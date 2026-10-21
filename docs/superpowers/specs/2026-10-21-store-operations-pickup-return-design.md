# Technical Design Document: Store Operations & Rental Lifecycle (Pickup, Return, Penalty, Cancellation & Webhook Reconciliation)

- **Date:** 2026-10-21 (Revised)
- **Author:** Antigravity AI & Rendi Widya Anggita
- **Sprint:** Sprint 2 Phase 3 (AA-77 through AA-84)
- **Status:** In Review / Revised
- **References:** PRD Section 4 (Non-Goals), Section 16.9 (Availability), Section 16.13 (Pickup & Return), Section 16.14 (Manual Penalty), Section 30 (Security), `Architecture.md`, `Schema.md` (OQ-08, OQ-09, OQ-10), Supabase Postgres Best Practices, Vercel React Best Practices

---

## 1. Executive Summary & Problem Statement

### 1.1 Context
In Sprint 2 Phases 1 & 2, customer booking, date-range availability checking, multi-item checkout with concurrency locking, and Midtrans DP payment integration (AA-58 through AA-76) were implemented and verified.

Sprint 2 Phase 3 closes the operational loop in the physical store with strict adherence to the PRD:
1. **Handover (Pickup / Pengambilan)**: Customer arrives at the physical store. Admin verifies DP payment, inspects identity document (KTP/SIM/KTM), records guarantee metadata with security masking, settles remaining payment via in-store manual payment (Kas Tunai/QRIS Toko), conducts physical handover of equipment units, locks transaction row against race conditions, updates units to `Rented`, and transitions transaction to `Sedang_Disewa`.
2. **Return (Pengembalian)**: Customer brings equipment back. Admin inspects items:
   - Units transition through status `Returned` before final classification (`Available`, `Maintenance`, `Damaged`, `Lost`) with full audit trail in `unit_status_logs` (PRD 16.13 & 16.9).
   - Reusable consumables (`is_reusable = true`) restock `Product.consumableStock` automatically upon return.
   - `ReturnItem` serves as the single source of truth for returned items (no redundant `isReturned` columns on `RentalTransactionItem`).
   - Penalties follow PRD 16.14: system provides **suggested** calculations based on late days and S.K. rules, but admin must manually confirm/enter the nominal amount and mandatory reason. System never auto-computes final penalties without explicit admin submission.
3. **Cancellation & Refund Flow**: Transparent cancellation logic: Customer self-cancellation forfeits DP (`DP Hangus`), while store-initiated cancellation triggers a full refund (`paymentStatus: Refunded`).
4. **Webhook Reconciliation Job**: Handles late Midtrans payments arriving after an order has expired (60-minute window) by preventing re-reservation of conflicting units and flagging for automated refund reconciliation.

---

## 2. Architecture & Data Flow

```
                                  +---------------------------------------+
                                  |     /admin/dashboard/transaksi        |
                                  |  - Table list with status filter tabs |
                                  |  - Search by code, customer, & dates  |
                                  +---------------------------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |   /admin/dashboard/transaksi/[id]     |
                                  |  - Overview, Customer, Units, Billing |
                                  |  - Stepper & Audit Log Timeline       |
                                  +---------------------------------------+
                                          /                         \
                                         /                           \
                        [Status: DP_Dibayar / Siap_Diambil]     [Status: Sedang_Disewa / Terlambat]
                                       /                               \
                                      v                                 v
+-----------------------------------------------+   +-----------------------------------------------+
|     /admin/dashboard/transaksi/[id]/pickup    |   |     /admin/dashboard/transaksi/[id]/return    |
|                                               |   |                                               |
| 1. DP Validation check (must be confirmed)    |   | 1. Per-item checklist (units & consumables)   |
| 2. Identity Guarantee (KTP/SIM/KTM + masked   |   | 2. Physical condition per unit:               |
|    ID + storage notes + eye reveal toggle)    |   |    Rented -> Returned -> Available/Maint/etc. |
| 3. Settle Remaining Amount (Kas / QRIS Toko)  |   | 3. Reusable consumable stock restock check    |
| 4. Unit Physical Handover Checklist           |   | 4. Suggested Penalty Calculator (PRD 16.14)   |
| 5. Submit with Transaction Row-Level Lock     |   |    (admin confirms nominal & reason)          |
|                                               |   | 5. On-the-spot Penalty Settlement             |
|                                               |   | 6. Return Physical Guarantee ID document      |
+-----------------------------------------------+   +-----------------------------------------------+
                        \                                           /
                         v                                         v
+---------------------------------------------------------------------------------------------------+
|                        Service Layer: src/lib/services/transaction-operations.ts                  |
|                                                                                                   |
|                         Atomic prisma.$transaction (ACID Guarantees)                              |
| - Row Lock: SELECT id, transaction_status FROM rental_transactions WHERE id = X FOR UPDATE         |
| - Batch Lock Units: SELECT id FROM inventory_units WHERE id = ANY(...) ORDER BY id ASC FOR UPDATE |
| - Update RentalTransaction (status, guaranteeStatus, guaranteeIdNumber, guaranteeNotes)          |
| - Insert Payment record (idempotency key: MANUAL-TRX-REMAINING, MANUAL-TRX-PENALTY-[returnTxId])  |
| - Insert ReturnTransaction & ReturnItem records (single source of truth for return events)        |
| - Transition Units: Rented -> Returned -> [Target Status] (log each step to unit_status_logs)     |
| - Increment Product.consumableStock for returned items where is_reusable == true                  |
| - Insert ActivityLog audit trail entries                                                          |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Database Schema Modifications (`prisma/schema.prisma`)

### 3.1 `RentalTransaction`
Add guarantee tracking fields:
```prisma
model RentalTransaction {
  // ... existing fields ...
  guaranteeDocType      String?          @map("guarantee_doc_type") // KTP | SIM | KTM
  guaranteeIdNumber     String?          @map("guarantee_id_number") // Stored encrypted/sanitized; masked on client
  guaranteeNotes        String?          @map("guarantee_notes") // Storage shelf location (e.g., "Kotak Jaminan B-02")
  // ...
}
```

### 3.2 `ReturnItem` (Resolving Consumable & Redundancy Gaps)
Update `ReturnItem` to support both serialized units and consumable items without duplicating boolean flags in `RentalTransactionItem`:
```prisma
model ReturnItem {
  id                  String                 @id @default(uuid())
  returnTransactionId String                 @map("return_transaction_id")
  transactionItemId   String                 @map("transaction_item_id")
  unitId              String?                @map("unit_id") // Nullable for consumables
  quantity            Int                    @default(1)     // Quantity returned (for consumables)
  returnedCondition   UnitStatus             @map("returned_condition")
  notes               String?
  createdAt           DateTime               @default(now()) @map("created_at")

  returnTransaction   ReturnTransaction      @relation(fields: [returnTransactionId], references: [id], onDelete: Cascade)
  transactionItem     RentalTransactionItem  @relation(fields: [transactionItemId], references: [id])
  unit                InventoryUnit?         @relation(fields: [unitId], references: [id])

  @@index([transactionItemId])
  @@map("return_items")
}
```

*Design rationale:*
- `RentalTransactionItem` remains immutable snapshot data (no redundant `isReturned` or `itemConditionNotes` columns).
- An item is determined to be returned by aggregating `ReturnItem` records where `transactionItemId = item.id`.
- Reusable consumables (`is_reusable = true`) can now be cleanly tracked and linked to the return transaction even though `unitId = null`.

### 3.3 `Payment`
Add `paymentMethod` to distinguish manual in-store transactions from Midtrans:
```prisma
model Payment {
  // ... existing fields ...
  paymentMethod String? @map("payment_method") // "Cash" | "QRIS_Store" | "Midtrans"
}
```

---

## 4. Service Layer Specifications

Path: `src/lib/services/transaction-operations.ts`

### 4.1 Handover / Pickup (`processPickupTransaction`)
- **Inputs**:
  - `transactionId`: string
  - `adminUserId`: string
  - `guaranteeDocType`: `"KTP" | "SIM" | "KTM"`
  - `guaranteeIdNumber`: string
  - `guaranteeNotes`?: string
  - `paymentMethod`: `"Cash" | "QRIS_Store"`
  - `verifiedUnitIds`: string[]
- **Atomic Operations** (inside `prisma.$transaction`):
  1. **Row Lock Transaction**:
     ```sql
     SELECT id, transaction_status, remaining_amount, transaction_code 
     FROM rental_transactions 
     WHERE id = ${transactionId} 
     FOR UPDATE;
     ```
  2. **Precondition Check**:
     Verify `transactionStatus` is in `[TransactionStatus.DP_Dibayar, TransactionStatus.Siap_Diambil]`. If not, throw `ConflictError("Transaksi tidak dalam status siap pickup.")`.
  3. **Batch Lock Inventory Units**:
     Use established pattern:
     ```sql
     SELECT id FROM inventory_units 
     WHERE id = ANY(${verifiedUnitIds}::text[]) 
     ORDER BY id ASC 
     FOR UPDATE;
     ```
  4. **Record Remaining Payment**:
     Insert into `Payment`:
     - `midtransOrderId`: `"MANUAL-" + tx.transactionCode + "-REMAINING"` (guarantees idempotency via `@unique` constraint).
     - `paymentType`: `"Remaining"`
     - `paymentMethod`: `paymentMethod`
     - `grossAmount`: `tx.remainingAmount`
     - `paymentStatus`: `PaymentStatus.Fully_Paid`
     - `paidAt`: `new Date()`
  5. **Update Inventory Units**:
     - For each verified unit:
       - Update status to `UnitStatus.Rented`.
       - Create `UnitStatusLog` (`previousStatus: Reserved`, `newStatus: Rented`, `changedBy: adminUserId`, `notes: "Unit diserahkan ke pelanggan (Pickup)"`).
  6. **Update Transaction**:
     - `transactionStatus: TransactionStatus.Sedang_Disewa`
     - `paymentStatus: PaymentStatus.Fully_Paid`
     - `guaranteeStatus: GuaranteeStatus.Received`
     - `guaranteeDocType`, `guaranteeIdNumber`, `guaranteeNotes`
  7. **Activity Log**:
     - Create `ActivityLog` (`action: "TRANSACTION_PICKUP"`).

---

### 4.2 Return & Penalty (`processReturnTransaction`)
- **Inputs**:
  - `transactionId`: string
  - `adminUserId`: string
  - `returnedItems`: Array<{
      transactionItemId: string;
      unitId?: string | null;
      quantity: number;
      condition: UnitStatus; // Available | Maintenance | Damaged | Lost
      notes?: string;
    }>
  - `penalties`: Array<{
      penaltyType: PenaltyType;
      amount: number; // Explicit manual amount input by admin
      reason: string; // Mandatory reason (PRD 16.14)
    }>
  - `penaltyPaymentMethod`?: `"Cash" | "QRIS_Store"`
  - `notes`?: string
- **Atomic Operations** (inside `prisma.$transaction`):
  1. **Row Lock Transaction**:
     ```sql
     SELECT id, transaction_status, transaction_code, end_date 
     FROM rental_transactions 
     WHERE id = ${transactionId} 
     FOR UPDATE;
     ```
  2. **Precondition Check**:
     Verify status is `TransactionStatus.Sedang_Disewa` or `TransactionStatus.Terlambat`.
  3. **Batch Lock Units**:
     Collect all unit IDs from `returnedItems` and execute:
     ```sql
     SELECT id FROM inventory_units 
     WHERE id = ANY(${unitIds}::text[]) 
     ORDER BY id ASC 
     FOR UPDATE;
     ```
  4. **Create Return Transaction**:
     - Calculate days overdue as informative reference:
       `const lateDays = Math.max(0, differenceInCalendarDays(new Date(), tx.endDate));`
     - Create `ReturnTransaction` record (`lateDays`, `staffUserId`, `guaranteeReturnStatus: GuaranteeStatus.Returned`, `notes`).
  5. **Process Returned Items**:
     For each item in `returnedItems`:
     - Create `ReturnItem` linking `returnTransactionId`, `transactionItemId`, `unitId`, `quantity`, `returnedCondition`, `notes`.
     - **If Physical Unit (`unitId != null`)**:
       - Transition to intermediary status `Returned` first (PRD 16.13 & 16.9):
         - `update InventoryUnit status = Returned`
         - `insert UnitStatusLog (Rented -> Returned)`
       - Transition to final classification (`condition`):
         - `update InventoryUnit status = item.condition`
         - `insert UnitStatusLog (Returned -> item.condition, notes: item.notes)`
     - **If Consumable Item (`unitId == null`)**:
       - Fetch associated product details.
       - If `product.isReusable === true`:
         - Restock: `tx.product.update({ where: { id: item.productId }, data: { consumableStock: { increment: item.quantity } } })`
         - Insert `ActivityLog` noting consumable restock.
       - If `product.isReusable === false`:
         - Do not increment stock (consumed item).
  6. **Process Manual Penalties (PRD 16.14 Compliance)**:
     - Formula: `total_akhir = total_biaya_sewa + total_denda_manual`.
     - System does NOT auto-generate final penalty records; it requires admin to supply explicit nominal amounts and reasons.
     - For each confirmed penalty:
       - Validate `penalty.amount >= 0` and `penalty.reason.trim().length > 0`.
       - Create `Penalty` record.
     - If `totalPenaltyAmount > 0`:
       - Create `Payment` record:
         - `midtransOrderId`: `"MANUAL-" + tx.transactionCode + "-PENALTY-" + returnTx.id` (preserves uniqueness per return transaction while preventing duplicate double-submits).
         - `paymentType`: `"Penalty"`
         - `paymentMethod`: `penaltyPaymentMethod`
         - `grossAmount`: `totalPenaltyAmount`
         - `paymentStatus`: `PaymentStatus.Fully_Paid`
         - `paidAt`: `new Date()`
  7. **Guarantee Return**:
     - `guaranteeStatus: GuaranteeStatus.Returned`
  8. **Check Full vs Partial Return**:
     - Fetch all `RentalTransactionItem`s for this transaction.
     - For each item, sum `ReturnItem.quantity` returned to date.
     - If all items have `sum(quantity) >= item.quantity`:
       - `transactionStatus: TransactionStatus.Selesai`
     - Else:
       - `transactionStatus: TransactionStatus.Sedang_Disewa` (partial return remains active).
  9. **Activity Log**:
     - Create `ActivityLog` (`action: "TRANSACTION_RETURN"`).

---

### 4.3 Cancellation & Refund (`processCancellationTransaction`)
- **Customer Cancellation**:
  - Allowed when status is `Menunggu_Pembayaran_DP` (soft-hold reservation released).
  - When status is `DP_Dibayar`: customer cancellation forfeits DP (`DP Hangus`). Transaction status becomes `Dibatalkan`, units are released from `ACTIVE_STATUSES` schedule hold.
- **Store / Admin Cancellation**:
  - Mandatory admin reason required.
  - Transaction status becomes `Dibatalkan`.
  - Payment status marked for refund (`Refunded`).
  - Units released immediately.

---

### 4.4 Webhook Reconciliation (`reconcileLateMidtransPayment`)
- Triggered by Midtrans webhook or cron if a late settlement arrives for a transaction that was already marked `Expired` or `Dibatalkan`:
  - **Overbooking Protection**: Check if any units have been booked by newer transactions for the same dates.
  - If conflict exists: **Do NOT re-reserve units**. Mark payment with `LATE_PAYMENT_REFUND_REQUIRED` and trigger alert for admin manual refund.
  - If no conflict: Reinstate to `DP_Dibayar` and notify admin.

---

## 5. Security, Authorization & Privacy Specifications

1. **Role Enforcement**:
   - All store operations endpoints require `requireRole(["Admin", "Owner"])`.
2. **Identity Document (NIK) Protection**:
   - Customer-facing queries (`/pesanan/[id]`, `/api/orders/[id]`) NEVER select or serialize `guaranteeIdNumber` or `guaranteeNotes`.
   - Admin UI displays masked NIK by default: `3273 •••• •••• 1234`.
   - UI provides an explicit click-to-reveal toggle ("Lihat NIK") so that the unmasked number is only shown when physically inspecting the card at the counter.
   - Postgres RLS on `rental_transactions` restricts read access of guarantee columns strictly to store operators and owners.
3. **Deterministic Batch Locking**:
   - Always lock in ascending order (`ORDER BY id ASC FOR UPDATE`) to prevent deadlocks across concurrent operations.
4. **Zod Validation**:
   - All server actions and API routes validate incoming payloads strictly with Zod.

---

## 6. User Interface & Pages

### 6.1 Transaction List (`/admin/dashboard/transaksi`)
- Tabs: *Semua*, *DP Dibayar*, *Sedang Disewa*, *Terlambat*, *Selesai*, *Dibatalkan*.
- Summary metric cards: Total Transaksi, Siap Pickup, Sedang Disewa, Terlambat.
- Search by transaction code, customer name, phone.

### 6.2 Transaction Detail (`/admin/dashboard/transaksi/[id]`)
- Customer profile, rental duration, assigned items table, financial breakdown, guarantee status card (with masked NIK and reveal button), audit log stepper.

### 6.3 Handover / Pickup Page (`/admin/dashboard/transaksi/[id]/pickup`)
- Section 1: DP Payment confirmation banner.
- Section 2: Guarantee Identity capture (doc type, masked preview, storage notes).
- Section 3: Remaining balance settlement (displays `remainingAmount`, select Cash/QRIS).
- Section 4: Unit checklist verifying each physical unit handed over.
- Submit button with row-lock protection.

### 6.4 Return Page (`/admin/dashboard/transaksi/[id]/return`)
- Section 1: Item return checklist:
  - Physical units: condition dropdown (`Available`, `Maintenance`, `Damaged`, `Lost`), condition notes.
  - Reusable consumables: quantity returned input.
- Section 2: Suggested Penalty Calculator (PRD 16.14 compliant):
  - Displays calculated overdue reference: `lateDays * lateFeePerDay` as an **informative suggestion**.
  - Admin explicitly enters confirmed penalty amount and mandatory reason.
  - Damage/loss penalty fields with required reasons.
- Section 3: Penalty payment settlement (if total penalty > 0, select Cash/QRIS).
- Section 4: Physical guarantee return confirmation checkbox.
- Submit button with atomic two-phase unit transition (`Rented -> Returned -> [Condition]`).

---

## 7. Verification & Test Plan

1. **Unit & Integration Tests**:
   - Test pickup with row lock and remaining cash payment.
   - Test return with audit trail verifying `Rented -> Returned -> Available` in `unit_status_logs`.
   - Test return of reusable consumable and verify `Product.consumableStock` is incremented.
   - Test PRD 16.14 compliance: verify system does not auto-commit penalty without explicit admin input and mandatory reason.
   - Test idempotency on double-submit of pickup and return payments.
2. **Manual End-to-End Walkthrough**:
   - Perform full lifecycle: Order -> Midtrans DP -> Admin Pickup -> In-store Cash Settlement -> Return with Late Days Reference -> Admin Confirms Penalty -> Final Status `Selesai`.
