# Technical Design Document: Store Operations & Rental Lifecycle (Pickup, Return, Penalty, Cancellation & Webhook Reconciliation)

- **Date:** 2026-10-21
- **Author:** Antigravity AI & Rendi Widya Anggita
- **Sprint:** Sprint 2 Phase 3 (AA-77 through AA-84)
- **Status:** Approved
- **References:** PRD Section 21 & 23, `Architecture.md` (Section 6.3), `Schema.md` (OQ-08, OQ-09, OQ-10), Supabase Postgres Best Practices, Vercel React Best Practices

---

## 1. Executive Summary & Problem Statement

### 1.1 Context
In Sprint 2 Phases 1 & 2, customer-facing booking, date-range availability checking, multi-item checkout with concurrency locking, and Midtrans DP payment integration (AA-58 through AA-76) were completed.
Phase 3 closes the operational loop in the physical store:
1. **Handover (Pickup / Pengambilan)**: Customer arrives at the physical store. Admin verifies DP payment, inspects identity document (KTP/SIM/KTM), records guarantee data, processes remaining payment (Kas/QRIS), conducts physical condition inspection of equipment units, and transitions units to `Rented` and transaction to `Sedang Disewa`.
2. **Return (Pengembalian)**: Customer brings equipment back. Admin inspects each item condition, flags returned items (`is_returned`), logs any damage/loss/delay, calculates and settles penalties on the spot, logs unit physical condition changes to `unit_status_logs`, returns the identity guarantee document, and finishes the order (`Selesai`).
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
                        [Status: DP_Dibayar]                     [Status: Sedang_Disewa / Terlambat]
                                      /                               \
                                     v                                 v
+-----------------------------------------------+   +-----------------------------------------------+
|     /admin/dashboard/transaksi/[id]/pickup    |   |     /admin/dashboard/transaksi/[id]/return    |
|                                               |   |                                               |
| 1. DP Validation check (must be confirmed)    |   | 1. Per-item checklist (is_returned checkbox)  |
| 2. Identity Guarantee (KTP/SIM/KTM + ID + note|   | 2. Physical condition per unit:               |
| 3. Settle Remaining Amount (Kas / QRIS Toko)  |   |    Available | Maintenance | Damaged | Lost   |
| 4. Unit Physical Handover Checklist           |   | 3. Auto/Manual Penalty Calculator & Reason    |
|                                               |   | 4. Cash/QRIS On-the-spot Penalty Settlement   |
|                                               |   | 5. Return Physical Guarantee ID document      |
+-----------------------------------------------+   +-----------------------------------------------+
                        \                                           /
                         v                                         v
+---------------------------------------------------------------------------------------------------+
|                        Service Layer: src/lib/services/transaction-operations.ts                  |
|                                                                                                   |
|                         Atomic prisma.$transaction (ACID Guarantees)                              |
| - Update RentalTransaction (status, guaranteeStatus, guaranteeIdNumber, guaranteeNotes)          |
| - Insert Payment record (Remaining amount / Penalty amount via Cash/QRIS)                         |
| - Update RentalTransactionItem (is_returned, returned_at, item_condition_notes)                   |
| - Insert ReturnTransaction & ReturnItem records                                                   |
| - Update InventoryUnit status (Available / Rented / Maintenance / Damaged / Lost)                 |
| - Insert UnitStatusLog audit trail entries                                                        |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Specifications

### 3.1 Database Enhancements (`prisma/schema.prisma`)

1. **`RentalTransaction`**:
   - `guaranteeIdNumber`: `String? @map("guarantee_id_number")` — Nomor identitas kartu jaminan (e.g., NIK KTP / SIM / KTM).
   - `guaranteeNotes`: `String? @map("guarantee_notes")` — Catatan kondisi fisik kartu jaminan.

2. **`RentalTransactionItem`**:
   - `isReturned`: `Boolean @default(false) @map("is_returned")` — Partial return tracking per physical unit (OQ-08).
   - `returnedAt`: `DateTime? @map("returned_at")` — Waktu item dikembalikan.
   - `itemConditionNotes`: `String? @map("item_condition_notes")` — Catatan khusus kondisi unit saat diterima.

3. **`Payment`**:
   - `paymentMethod`: `String? @map("payment_method")` — `'Midtrans'`, `'Cash'`, `'QRIS_Store'` to clearly distinguish in-store settlements.

---

### 3.2 Service Layer & Atomic Transactions

Path: `src/lib/services/transaction-operations.ts`

#### A. Handover / Pickup (`processPickupTransaction`)
- **Pre-condition**: Transaction status must be `DP_Dibayar` or `Siap_Diambil`.
- **Atomic Operations** (within `prisma.$transaction`):
  1. Record identity guarantee:
     - `guaranteeStatus: "Received"`
     - `guaranteeDocType: data.guaranteeDocType` ("KTP" | "SIM" | "KTM")
     - `guaranteeIdNumber: data.guaranteeIdNumber`
     - `guaranteeNotes: data.guaranteeNotes`
  2. Record remaining payment:
     - Insert into `payments`:
       - `transactionId: tx.id`
       - `midtransOrderId: "MANUAL-" + tx.transactionCode + "-REMAINING"`
       - `paymentType: "Remaining"`
       - `paymentMethod: data.paymentMethod` ("Cash" | "QRIS")
       - `grossAmount: tx.remainingAmount`
       - `paymentStatus: "Fully_Paid"`
       - `paidAt: new Date()`
  3. Update units physical condition:
     - For all associated unique `unitId`s:
       - Update `InventoryUnit` status -> `Rented`.
       - Insert into `UnitStatusLog` (`previousStatus`, `newStatus: Rented`, `changedBy: adminUserId`, `notes: "Unit diserahkan ke pelanggan (Pickup)"`).
  4. Update transaction status:
     - `transactionStatus: "Sedang_Disewa"`
     - `paymentStatus: "Fully_Paid"`
  5. Log activity audit:
     - Record in `ActivityLog` (`action: "TRANSACTION_PICKUP"`).

#### B. Return & Penalty (`processReturnTransaction`)
- **Pre-condition**: Transaction status must be `Sedang_Disewa` or `Terlambat`.
- **Atomic Operations** (within `prisma.$transaction`):
  1. Process item returns:
     - Create `ReturnTransaction`:
       - `transactionId: tx.id`
       - `staffUserId: adminUserId`
       - `lateDays: calculatedLateDays`
       - `guaranteeReturnStatus: "Returned"`
       - `notes: data.notes`
  2. For each returned item:
     - Update `RentalTransactionItem`:
       - `isReturned: true`
       - `returnedAt: new Date()`
       - `itemConditionNotes: item.notes`
     - Create `ReturnItem`:
       - `returnTransactionId: returnTx.id`
       - `unitId: item.unitId`
       - `returnedCondition: item.condition` (`Available` | `Maintenance` | `Damaged` | `Lost`)
     - Update physical `InventoryUnit`:
       - `unitStatus: item.condition`
     - Insert `UnitStatusLog`:
       - `previousStatus: Rented`
       - `newStatus: item.condition`
       - `changedBy: adminUserId`
       - `notes: item.notes || "Pengembalian barang rental"`
  3. Penalty Processing (if any penalty exists):
     - For each penalty (Late Return, Damaged, Lost):
       - Create record in `Penalty`:
         - `transactionId: tx.id`
         - `penaltyType: p.penaltyType`
         - `amount: p.amount`
         - `reason: p.reason`
     - Record penalty payment in `payments`:
       - `midtransOrderId: "MANUAL-" + tx.transactionCode + "-PENALTY"`
       - `paymentType: "Penalty"`
       - `paymentMethod: data.penaltyPaymentMethod` ("Cash" | "QRIS")
       - `grossAmount: totalPenaltyAmount`
       - `paymentStatus: "Fully_Paid"`
       - `paidAt: new Date()`
  4. Guarantee Status update:
     - `guaranteeStatus: "Returned"`
  5. Transaction Status completion:
     - If all items in `RentalTransactionItem` have `isReturned === true`:
       - `transactionStatus: "Selesai"`
     - If partial return remains:
       - `transactionStatus: "Sedang_Disewa"` (with partial notes)
  6. Log activity audit.

#### C. Cancellation & Refund (`processCancellationTransaction`)
- **Customer Cancellation**:
  - Soft-hold released if `Menunggu_Pembayaran_DP`.
  - If `DP_Dibayar`: DP is forfeit (`cancelledReason: "Dibatalkan oleh pelanggan (DP Hangus)"`, `transactionStatus: "Dibatalkan"`). Associated units are released back to non-reserved availability.
- **Store/Admin Cancellation**:
  - Mandatory admin reason required.
  - Transaction status -> `Dibatalkan`.
  - Payment status -> `Refunded`.
  - Soft-hold / unit reservations released.

#### D. Webhook Reconciliation (`reconcileLateMidtransPayment`)
- Triggered by `POST /api/webhooks/midtrans` or `/api/cron/reconcile-transactions`.
- If a successful payment arrives for a transaction that was already marked `Expired` or `Dibatalkan`:
  - **Do NOT re-reserve units** (anti-overbooking guarantee).
  - Record payment as `Refunded` or `Pending` with note: `LATE_WEBHOOK_REFUND_REQUIRED`.
  - Create high-priority activity log entry and flag for store admin review.

---

## 4. User Interface & Routes

### 4.1 `/admin/dashboard/transaksi` (List View)
- Header with stats: *Total Transaksi*, *Menunggu Pickup (DP Dibayar)*, *Sedang Disewa*, *Terlambat*.
- Search bar (kode transaksi, nama customer, email).
- Filter status tabs: *Semua*, *DP Dibayar*, *Sedang Disewa*, *Terlambat*, *Selesai*, *Dibatalkan*.
- Data Table:
  - Kode Transaksi
  - Pelanggan
  - Tanggal Ambil & Kembali
  - Total & Sisa Tagihan
  - Status Transaksi (StatusBadge)
  - Status Jaminan
  - Aksi: View Detail, Quick Pickup, Quick Return.

### 4.2 `/admin/dashboard/transaksi/[id]` (Detail View)
- Customer Profile Card (Name, Phone, WhatsApp direct link, Email).
- Rental Schedule Card (Start Date, End Date, Duration, Days Remaining / Days Overdue).
- Unit Items Card:
  - Table of assigned physical units with serial/barcode snapshot, variant, subtotal, and return status badge.
- Financial Summary Card:
  - Total Amount, DP Paid (50%), Remaining Amount, Penalties, Net Total.
- Jaminan Identitas Card:
  - Status: *Belum Diterima / Tersimpan / Sudah Dikembalikan*.
  - Tipe & Nomor Identitas.
- Audit Timeline:
  - Timestamped history of state transitions from creation to completion.

### 4.3 `/admin/dashboard/transaksi/[id]/pickup` (Handover Page)
- Clean multi-step visual checklist:
  - **Section 1: Status Pembayaran DP**: Confirmed badge (`Rp XX.XXX dibayar via Midtrans`).
  - **Section 2: Jaminan Identitas**: Select `KTP` / `SIM` / `KTM`, input identity number, input storage notes (e.g., "Rak jaminan A-04").
  - **Section 3: Pelunasan Sisa**: Display `remainingAmount`, select method (`Kas Tunai` / `QRIS Toko`), confirmation checkbox.
  - **Section 4: Checklist Serah Terima Unit**: Checklist per physical unit to confirm physical verification before handing over to customer.
  - Action button: *"Konfirmasi Serah Terima (Pickup)"* -> invokes server action with immediate feedback.

### 4.4 `/admin/dashboard/transaksi/[id]/return` (Return Page)
- **Section 1: Checklist Pengembalian Unit**:
  - Per-item checkbox (`Kembali?`).
  - Dropdown condition: `Available` (Bagus), `Maintenance` (Perlu Servis/Cuci), `Damaged` (Rusak), `Lost` (Hilang).
  - Notes per item.
- **Section 2: Kalkulator Denda (Penalty)**:
  - Auto-calculated late days penalty: `lateDays * lateFeePerDay`.
  - Manual penalty additions: damaged fee or lost replacement fee with mandatory reason.
  - Total penalty sum display.
- **Section 3: Pelunasan Denda di Tempat**:
  - If total penalty > 0: payment method selection (Kas / QRIS) and confirmation of receipt.
- **Section 4: Pengembalian Jaminan**:
  - Confirmation checkbox: *"Jaminan identitas (KTP/SIM/KTM) telah dikembalikan kepada pelanggan"*.
- Action button: *"Selesaikan Pengembalian (Return)"*.

---

## 5. Security & Authorization
- All admin operational actions require `requireRole(["Admin", "Owner"])`.
- Zod schema validation applied to all inputs.
- Consistent locking order (`ORDER BY id ASC FOR UPDATE`) when modifying inventory units to prevent deadlocks.
- Sensitive identity numbers formatted and sanitized.

---

## 6. Verification & Test Plan

1. **Unit & Service Layer Tests**:
   - `processPickupTransaction`: verifies status transitions, payment creation, unit status change to `Rented`, and `UnitStatusLog` creation.
   - `processReturnTransaction`: verifies partial and complete return, penalty logging, unit status transitions, and guarantee update.
   - `reconcileLateMidtransPayment`: verifies no overbooking occurs when late payment hits expired orders.
2. **End-to-End Flow Test**:
   - Create order -> Pay DP -> Open `/admin/dashboard/transaksi` -> Click Pickup -> Submit guarantee & remaining cash payment -> Verify units become `Rented` -> Click Return -> Flag items with penalty -> Submit -> Verify units become `Available`/`Maintenance` and transaction status becomes `Selesai`.
