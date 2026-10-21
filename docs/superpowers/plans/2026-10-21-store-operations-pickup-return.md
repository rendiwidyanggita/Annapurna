# Implementation Plan: Store Operations & Rental Lifecycle (Pickup, Return, Penalty, Cancellation & Webhook Reconciliation)

- **Specification:** [`docs/superpowers/specs/2026-10-21-store-operations-pickup-return-design.md`](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna/docs/superpowers/specs/2026-10-21-store-operations-pickup-return-design.md)
- **Guidelines Applied:** Supabase Postgres Best Practices (`AGENTS.md`), Vercel React Best Practices, PRD Section 16.13, 16.14 & 30
- **Status:** Completed (All Phases Implemented & Verified)

---

## Proposed Changes

### Phase 1: Database Schema Modifications (`prisma/schema.prisma`)
1. In `RentalTransaction`:
   - Add `guaranteeIdNumber String? @map("guarantee_id_number")`
   - Add `guaranteeNotes String? @map("guarantee_notes")`
2. In `ReturnItem`:
   - Add `transactionItemId String @map("transaction_item_id")`
   - Change `unitId String? @map("unit_id")` (make nullable to support consumables)
   - Add `quantity Int @default(1)`
   - Add relation `transactionItem RentalTransactionItem @relation(fields: [transactionItemId], references: [id])`
   - Add `@@index([transactionItemId])`
3. In `RentalTransactionItem`:
   - Add relation `returnItems ReturnItem[]`
4. In `Payment`:
   - Add `paymentMethod String? @map("payment_method")` (e.g., "Cash" | "QRIS_Store" | "Midtrans")
5. Run `npx prisma generate` and `npx prisma db push`.

---

### Phase 2: Validation Schemas & Privacy Utilities
1. Create `src/schemas/transaction-operations.ts`:
   - `pickupSchema`: `transactionId`, `guaranteeDocType` ("KTP" | "SIM" | "KTM"), `guaranteeIdNumber` (min 6 chars), `guaranteeNotes` (optional), `paymentMethod` ("Cash" | "QRIS_Store"), `verifiedUnitIds` (array of string uuids).
   - `returnSchema`: `transactionId`, `returnedItems` (array of `transactionItemId`, optional `unitId`, `quantity`, `condition` (UnitStatus), optional `notes`), `penalties` (array of `penaltyType`, `amount` >= 0, `reason` non-empty string), optional `penaltyPaymentMethod`, optional `notes`.
   - `cancellationSchema`: `transactionId`, `reason`, `cancelledBy` ("customer" | "admin").
2. Create `src/lib/services/transaction-privacy.ts`:
   - Masking function `maskIdentityNumber(rawId: string): string` -> e.g. `3273 •••• •••• 1234`.
   - Admin unmask authorization check.

---

### Phase 3: Core Service Layer (`src/lib/services/transaction-operations.ts`)
1. Implement `processPickupTransaction`:
   - Deterministic row locking: `SELECT id, transaction_status, remaining_amount, transaction_code FROM rental_transactions WHERE id = $1 FOR UPDATE`.
   - Precondition check: must be in `[DP_Dibayar, Siap_Diambil]`.
   - Batch lock units in ascending order: `SELECT id FROM inventory_units WHERE id = ANY($1) ORDER BY id ASC FOR UPDATE`.
   - Settle remaining payment: Insert `Payment` with idempotency key `"MANUAL-" + tx.transactionCode + "-REMAINING"`.
   - Update inventory units to `UnitStatus.Rented` and insert `UnitStatusLog` (`previousStatus: Reserved`, `newStatus: Rented`).
   - Update `RentalTransaction`: status `Sedang_Disewa`, paymentStatus `Fully_Paid`, guaranteeStatus `Received`, guarantee metadata.
   - Insert `ActivityLog` (`TRANSACTION_PICKUP`).
2. Implement `processReturnTransaction`:
   - Row lock transaction and units.
   - Precondition check: must be `Sedang_Disewa` or `Terlambat`.
   - Create `ReturnTransaction` with `lateDays` and `guaranteeReturnStatus: Returned`.
   - Per returned item:
     - If serialized unit: 2-phase status transition: `Rented -> Returned` and then `Returned -> [targetCondition]`. Write 2 audit logs in `UnitStatusLog`.
     - If consumable: check `product.isReusable`; if true, increment `Product.consumableStock` and log activity.
     - Insert `ReturnItem`.
   - PRD 16.14 manual penalty processing: validate amounts and mandatory reasons, insert `Penalty` records. If total > 0, insert `Payment` with idempotency key `"MANUAL-" + tx.transactionCode + "-PENALTY-" + returnTx.id`.
   - Release guarantee: `guaranteeStatus: GuaranteeStatus.Returned`.
   - Check if all items in transaction are returned: set `Selesai` or remain `Sedang_Disewa`.
   - Insert `ActivityLog` (`TRANSACTION_RETURN`).
3. Implement `processCancellationTransaction`:
   - Customer self-cancel: DP forfeited (`DP Hangus`), release unit schedule hold, set `Dibatalkan`.
   - Store cancel: set `Refunded`, release units, set `Dibatalkan`.
4. Implement `reconcileLateMidtransPayment`:
   - Check for conflicting reservations on same dates. If conflict, mark `LATE_PAYMENT_REFUND_REQUIRED` and flag admin for refund. If clear, restore to `DP_Dibayar`.

---

### Phase 4: Server Actions Layer (`src/app/admin/dashboard/transaksi/actions.ts`)
1. Secure all actions with `requireRole(["admin", "owner"])`.
2. Provide `getTransactionsList({ page, search, status, dateFrom, dateTo })`.
3. Provide `getTransactionDetail(id: string)`.
4. Provide `pickupTransactionAction(data)`.
5. Provide `returnTransactionAction(data)`.
6. Provide `cancelTransactionAction(data)`.
7. Provide `revealGuaranteeIdAction(transactionId: string)`.

---

### Phase 5: Admin UI Pages & Sidebar Integration
1. Enable `Transaksi` in `src/components/layouts/admin-sidebar.tsx`.
2. List page: `src/app/admin/dashboard/transaksi/page.tsx` with filter tabs, metrics, search bar, and transaction table.
3. Detail page: `src/app/admin/dashboard/transaksi/[id]/page.tsx` with tabs/sections for Customer, Guarantee (masked + reveal button), Items, Payment, and Audit timeline.
4. Pickup page: `src/app/admin/dashboard/transaksi/[id]/pickup/page.tsx` with DP verification badge, identity form, remaining balance payment, and unit checklist.
5. Return page: `src/app/admin/dashboard/transaksi/[id]/return/page.tsx` with unit inspection dropdowns, consumable return counters, PRD 16.14 suggested penalty reference calculator, manual penalty form, and guarantee return confirmation.

---

### Phase 6: Testing & Verification
1. Create `tests/transaction-operations.test.ts`.
2. Verify pickup atomic flow, remaining cash payment, and unit status logs.
3. Verify return two-phase unit transition (`Rented -> Returned -> Available/Damaged`).
4. Verify consumable restock when `isReusable: true`.
5. Verify PRD 16.14: validation error when penalty submitted without reason, and system does not auto-commit penalty.
6. Verify idempotency on duplicate payment submissions.
7. Verify NIK masking and authorization privacy.
8. Run `npx tsc --noEmit` and `npm run lint`.
