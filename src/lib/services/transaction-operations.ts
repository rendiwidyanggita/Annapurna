import { prisma } from "@/lib/prisma";
import {
  TransactionStatus,
  PaymentStatus,
  UnitStatus,
  GuaranteeStatus,
  PenaltyType,
} from "@prisma/client";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { ACTIVE_STATUSES } from "@/lib/constants";
import { logActivity } from "@/lib/services/audit-log";
import { differenceInCalendarDays } from "date-fns";
import type {
  PickupInput,
  ReturnInput,
  CancellationInput,
} from "@/schemas/transaction-operations";

/**
 * Service Layer: Store Operations & Rental Lifecycle (AA-77 through AA-84)
 *
 * Implements strict ACID transactions, row-level locking (SELECT FOR UPDATE),
 * deterministic lock ordering (ORDER BY id ASC), PRD 16.14 manual penalty enforcement,
 * two-phase unit state transitions, and consumable stock recovery.
 */

// ==============================================================================
// 1. Process Handover / Pickup (AA-77, AA-78, AA-79)
// ==============================================================================
export async function processPickupTransaction(
  input: PickupInput,
  adminUserId: string
) {
  const {
    transactionId,
    guaranteeDocType,
    guaranteeIdNumber,
    guaranteeNotes,
    paymentMethod,
    verifiedUnitIds,
  } = input;

  return await prisma.$transaction(async (tx) => {
    // 1. Row lock the transaction
    const lockedRows = await tx.$queryRaw<
      Array<{
        id: string;
        transaction_status: TransactionStatus;
        remaining_amount: number;
        transaction_code: string;
        user_id: string;
      }>
    >`SELECT id, transaction_status, remaining_amount, transaction_code, user_id 
      FROM rental_transactions 
      WHERE id = ${transactionId} 
      FOR UPDATE`;

    if (!lockedRows || lockedRows.length === 0) {
      throw new NotFoundError("Transaksi tidak ditemukan.");
    }

    const currentTx = lockedRows[0];

    // 2. Precondition check
    const validPickupStatuses: TransactionStatus[] = [
      TransactionStatus.DP_Dibayar,
      TransactionStatus.Siap_Diambil,
      TransactionStatus.Dikonfirmasi,
    ];

    if (!validPickupStatuses.includes(currentTx.transaction_status)) {
      throw new ConflictError(
        `Transaksi tidak dalam status siap pickup. Status saat ini: ${currentTx.transaction_status}.`
      );
    }

    // 3. Batch lock inventory units in deterministic ascending order
    if (verifiedUnitIds.length > 0) {
      const sortedUnitIds = [...verifiedUnitIds].sort();
      await tx.$queryRaw`
        SELECT id FROM inventory_units 
        WHERE id = ANY(${sortedUnitIds}::text[]) 
        ORDER BY id ASC 
        FOR UPDATE
      `;
    }

    const now = new Date();

    // 4. Record remaining payment (Idempotency key: MANUAL-[CODE]-REMAINING)
    if (currentTx.remaining_amount > 0) {
      const remainingOrderId = `MANUAL-${currentTx.transaction_code}-REMAINING`;

      // Check if already paid to prevent double-charging
      const existingPayment = await tx.payment.findUnique({
        where: { midtransOrderId: remainingOrderId },
      });

      if (!existingPayment) {
        await tx.payment.create({
          data: {
            transactionId,
            midtransOrderId: remainingOrderId,
            paymentType: "Remaining",
            paymentMethod,
            grossAmount: currentTx.remaining_amount,
            paymentStatus: PaymentStatus.Fully_Paid,
            paidAt: now,
          },
        });
      }
    }

    // 5. Transition inventory units to Rented with audit logs
    for (const unitId of verifiedUnitIds) {
      const unit = await tx.inventoryUnit.findUnique({
        where: { id: unitId },
        select: { unitStatus: true, inventoryCode: true },
      });

      if (unit) {
        await tx.inventoryUnit.update({
          where: { id: unitId },
          data: { unitStatus: UnitStatus.Rented },
        });

        await tx.unitStatusLog.create({
          data: {
            unitId,
            previousStatus: unit.unitStatus,
            newStatus: UnitStatus.Rented,
            notes: "Unit diserahkan ke pelanggan (Handover / Pickup)",
            changedBy: adminUserId,
          },
        });
      }
    }

    // 6. Update RentalTransaction record
    const updatedTx = await tx.rentalTransaction.update({
      where: { id: transactionId },
      data: {
        transactionStatus: TransactionStatus.Sedang_Disewa,
        paymentStatus: PaymentStatus.Fully_Paid,
        guaranteeStatus: GuaranteeStatus.Received,
        guaranteeDocType,
        guaranteeIdNumber,
        guaranteeNotes: guaranteeNotes || null,
      },
    });

    // 7. Insert Activity Log audit trail
    await tx.activityLog.create({
      data: {
        userId: adminUserId,
        action: "TRANSACTION_PICKUP",
        entityName: "RentalTransaction",
        entityId: transactionId,
        oldValue: currentTx.transaction_status,
        newValue: TransactionStatus.Sedang_Disewa,
        description: `Handover pickup barang selesai. Dokumen jaminan ${guaranteeDocType} dicatat. Pelunasan sisa tagihan via ${paymentMethod}.`,
      },
    });

    return updatedTx;
  });
}

// ==============================================================================
// 2. Process Return & Manual Penalties (AA-80, AA-81, AA-82, PRD 16.13 & 16.14)
// ==============================================================================
export async function processReturnTransaction(
  input: ReturnInput,
  adminUserId: string
) {
  const {
    transactionId,
    returnedItems,
    penalties,
    penaltyPaymentMethod,
    guaranteeReturned,
    notes,
  } = input;

  return await prisma.$transaction(async (tx) => {
    // 1. Row lock the transaction
    const lockedRows = await tx.$queryRaw<
      Array<{
        id: string;
        transaction_status: TransactionStatus;
        transaction_code: string;
        end_date: Date;
      }>
    >`SELECT id, transaction_status, transaction_code, end_date 
      FROM rental_transactions 
      WHERE id = ${transactionId} 
      FOR UPDATE`;

    if (!lockedRows || lockedRows.length === 0) {
      throw new NotFoundError("Transaksi tidak ditemukan.");
    }

    const currentTx = lockedRows[0];

    // 2. Precondition check
    const validReturnStatuses: TransactionStatus[] = [
      TransactionStatus.Sedang_Disewa,
      TransactionStatus.Terlambat,
    ];

    if (!validReturnStatuses.includes(currentTx.transaction_status)) {
      throw new ConflictError(
        `Transaksi tidak dalam status aktif sewa atau terlambat. Status saat ini: ${currentTx.transaction_status}.`
      );
    }

    // 3. Batch lock candidate units in deterministic ascending order
    const unitIds = returnedItems
      .map((item) => item.unitId)
      .filter((id): id is string => Boolean(id))
      .sort();

    if (unitIds.length > 0) {
      await tx.$queryRaw`
        SELECT id FROM inventory_units 
        WHERE id = ANY(${unitIds}::text[]) 
        ORDER BY id ASC 
        FOR UPDATE
      `;
    }

    const now = new Date();
    const lateDays = Math.max(
      0,
      differenceInCalendarDays(now, new Date(currentTx.end_date))
    );

    // 4. Create ReturnTransaction record
    const returnTx = await tx.returnTransaction.create({
      data: {
        transactionId,
        staffUserId: adminUserId,
        returnDate: now,
        lateDays,
        guaranteeReturnStatus: guaranteeReturned
          ? GuaranteeStatus.Returned
          : GuaranteeStatus.Received,
        notes: notes || null,
      },
    });

    // 5. Process Returned Items
    for (const item of returnedItems) {
      // Create ReturnItem record (Single source of truth for returned events)
      await tx.returnItem.create({
        data: {
          returnTransactionId: returnTx.id,
          transactionItemId: item.transactionItemId,
          unitId: item.unitId || null,
          quantity: item.quantity,
          returnedCondition: item.condition,
          notes: item.notes || null,
        },
      });

      // 5A. Physical Serialized Unit: Two-Phase Status Transition (PRD 16.13 & 16.9)
      if (item.unitId) {
        const unit = await tx.inventoryUnit.findUnique({
          where: { id: item.unitId },
          select: { unitStatus: true },
        });

        const initialStatus = unit?.unitStatus ?? UnitStatus.Rented;

        // Phase 1: Intermediate state 'Returned'
        await tx.inventoryUnit.update({
          where: { id: item.unitId },
          data: { unitStatus: UnitStatus.Returned },
        });

        await tx.unitStatusLog.create({
          data: {
            unitId: item.unitId,
            previousStatus: initialStatus,
            newStatus: UnitStatus.Returned,
            notes: "Unit diterima kembali dari pelanggan (Fase Pengembalian)",
            changedBy: adminUserId,
          },
        });

        // Phase 2: Final state classification (Available / Maintenance / Damaged / Lost)
        await tx.inventoryUnit.update({
          where: { id: item.unitId },
          data: {
            unitStatus: item.condition,
            conditionNotes: item.notes || null,
          },
        });

        await tx.unitStatusLog.create({
          data: {
            unitId: item.unitId,
            previousStatus: UnitStatus.Returned,
            newStatus: item.condition,
            notes:
              item.notes ||
              `Klasifikasi kondisi pasca pengembalian: ${item.condition}`,
            changedBy: adminUserId,
          },
        });
      } else {
        // 5B. Consumable Item: Check if reusable and restock Product.consumableStock
        const txItem = await tx.rentalTransactionItem.findUnique({
          where: { id: item.transactionItemId },
          select: { productId: true },
        });

        if (txItem) {
          const product = await tx.product.findUnique({
            where: { id: txItem.productId },
            select: { id: true, isReusable: true, name: true },
          });

          if (product?.isReusable) {
            await tx.product.update({
              where: { id: product.id },
              data: {
                consumableStock: { increment: item.quantity },
              },
            });

            await tx.activityLog.create({
              data: {
                userId: adminUserId,
                action: "CONSUMABLE_RESTOCK_ON_RETURN",
                entityName: "Product",
                entityId: product.id,
                description: `Restock barang konsumsi reusable: ${product.name} (+${item.quantity} unit).`,
              },
            });
          }
        }
      }
    }

    // 6. Manual Penalty Processing (PRD 16.14 Compliance)
    // System requires explicit nominal input and mandatory reason from admin
    let totalPenaltyAmount = 0;

    for (const penalty of penalties) {
      if (penalty.amount > 0) {
        if (!penalty.reason || penalty.reason.trim().length === 0) {
          throw new ValidationError(
            "Setiap denda wajib disertai alasan yang jelas sesuai PRD 16.14."
          );
        }

        totalPenaltyAmount += penalty.amount;

        await tx.penalty.create({
          data: {
            transactionId,
            penaltyType: penalty.penaltyType as PenaltyType,
            amount: penalty.amount,
            reason: penalty.reason.trim(),
          },
        });
      }
    }

    // Record settlement payment if penalty incurred
    if (totalPenaltyAmount > 0) {
      const penaltyOrderId = `MANUAL-${currentTx.transaction_code}-PENALTY-${returnTx.id}`;

      await tx.payment.create({
        data: {
          transactionId,
          midtransOrderId: penaltyOrderId,
          paymentType: "Penalty",
          paymentMethod: penaltyPaymentMethod || "Cash",
          grossAmount: totalPenaltyAmount,
          paymentStatus: PaymentStatus.Fully_Paid,
          paidAt: now,
        },
      });
    }

    // 7. Check Full vs Partial Return
    const allTxItems = await tx.rentalTransactionItem.findMany({
      where: { transactionId },
      select: { id: true, quantity: true },
    });

    const returnItemAggregates = await tx.returnItem.groupBy({
      by: ["transactionItemId"],
      where: {
        transactionItemId: { in: allTxItems.map((i) => i.id) },
      },
      _sum: { quantity: true },
    });

    const returnedMap = new Map<string, number>();
    for (const agg of returnItemAggregates) {
      returnedMap.set(agg.transactionItemId, agg._sum.quantity ?? 0);
    }

    const isFullyReturned = allTxItems.every((item) => {
      const totalReturned = returnedMap.get(item.id) ?? 0;
      return totalReturned >= item.quantity;
    });

    const finalStatus = isFullyReturned
      ? TransactionStatus.Selesai
      : TransactionStatus.Sedang_Disewa;

    // 8. Update RentalTransaction status & guarantee status
    const updatedTx = await tx.rentalTransaction.update({
      where: { id: transactionId },
      data: {
        transactionStatus: finalStatus,
        guaranteeStatus: guaranteeReturned
          ? GuaranteeStatus.Returned
          : GuaranteeStatus.Received,
      },
    });

    // 9. Activity Log
    await tx.activityLog.create({
      data: {
        userId: adminUserId,
        action: "TRANSACTION_RETURN",
        entityName: "RentalTransaction",
        entityId: transactionId,
        oldValue: currentTx.transaction_status,
        newValue: finalStatus,
        description: `Pengembalian barang dicatat. Total Denda: Rp ${totalPenaltyAmount.toLocaleString(
          "id-ID"
        )}. Dokumen jaminan ${guaranteeReturned ? "dikembalikan" : "tertahan"}. Status akhir: ${finalStatus}.`,
      },
    });

    return {
      returnTransaction: returnTx,
      updatedTransaction: updatedTx,
      isFullyReturned,
      totalPenaltyAmount,
    };
  });
}

// ==============================================================================
// 3. Process Cancellation & Refund (AA-83, PRD 16.11)
// ==============================================================================
export async function processCancellationTransaction(
  input: CancellationInput,
  actorUserId: string
) {
  const { transactionId, reason, cancelledBy } = input;

  return await prisma.$transaction(async (tx) => {
    // 1. Lock the transaction
    const lockedRows = await tx.$queryRaw<
      Array<{
        id: string;
        transaction_status: TransactionStatus;
        payment_status: PaymentStatus;
        transaction_code: string;
      }>
    >`SELECT id, transaction_status, payment_status, transaction_code 
      FROM rental_transactions 
      WHERE id = ${transactionId} 
      FOR UPDATE`;

    if (!lockedRows || lockedRows.length === 0) {
      throw new NotFoundError("Transaksi tidak ditemukan.");
    }

    const currentTx = lockedRows[0];

    const cancellableStatuses: TransactionStatus[] = [
      TransactionStatus.Menunggu_Pembayaran_DP,
      TransactionStatus.DP_Dibayar,
      TransactionStatus.Dikonfirmasi,
      TransactionStatus.Siap_Diambil,
    ];

    if (!cancellableStatuses.includes(currentTx.transaction_status)) {
      throw new ConflictError(
        `Transaksi dalam status ${currentTx.transaction_status} tidak dapat dibatalkan.`
      );
    }

    // Determine refund status according to policy:
    // - Store/Admin cancellation: Refunded
    // - Customer self-cancellation: If DP was paid, DP is forfeited ("DP Hangus")
    let newPaymentStatus: PaymentStatus = currentTx.payment_status;
    let cancelNote = reason;

    if (cancelledBy === "admin") {
      if (currentTx.payment_status === PaymentStatus.DP_Paid) {
        newPaymentStatus = PaymentStatus.Refunded;
        cancelNote = `[Dibatalkan Toko - Refund Penuh] ${reason}`;
        await tx.payment.updateMany({
          where: { transactionId },
          data: { paymentStatus: PaymentStatus.Refunded },
        });
      }
    } else {
      if (currentTx.payment_status === PaymentStatus.DP_Paid) {
        cancelNote = `[Dibatalkan Pelanggan - DP Hangus] ${reason}`;
      }
    }

    // Release any reserved inventory units assigned to this transaction
    const txItems = await tx.rentalTransactionItem.findMany({
      where: { transactionId },
      select: { unitId: true },
    });

    const assignedUnitIds = txItems
      .map((i) => i.unitId)
      .filter((id): id is string => Boolean(id));

    for (const unitId of assignedUnitIds) {
      const unit = await tx.inventoryUnit.findUnique({
        where: { id: unitId },
        select: { unitStatus: true },
      });

      if (unit && unit.unitStatus === UnitStatus.Reserved) {
        await tx.inventoryUnit.update({
          where: { id: unitId },
          data: { unitStatus: UnitStatus.Available },
        });

        await tx.unitStatusLog.create({
          data: {
            unitId,
            previousStatus: UnitStatus.Reserved,
            newStatus: UnitStatus.Available,
            notes: `Unit dilepas karena pembatalan transaksi (${cancelledBy})`,
            changedBy: actorUserId,
          },
        });
      }
    }

    // Update RentalTransaction
    const updatedTx = await tx.rentalTransaction.update({
      where: { id: transactionId },
      data: {
        transactionStatus: TransactionStatus.Dibatalkan,
        paymentStatus: newPaymentStatus,
        cancelledReason: cancelNote,
      },
    });

    // Record Activity Log
    await logActivity(tx, {
      userId: actorUserId,
      action: "TRANSACTION_CANCELLED",
      entityName: "RentalTransaction",
      entityId: transactionId,
      oldValue: currentTx.transaction_status,
      newValue: TransactionStatus.Dibatalkan,
      description: `Transaksi dibatalkan oleh ${cancelledBy}. Catatan: ${cancelNote}.`,
    });

    return updatedTx;
  });
}

// ==============================================================================
// 4. Webhook Late Settlement Reconciliation (AA-84)
// ==============================================================================
export async function reconcileLateMidtransPayment(midtransOrderId: string) {
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { midtransOrderId },
      include: {
        transaction: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!payment || !payment.transaction) {
      return { success: false, message: "Data transaksi tidak ditemukan." };
    }

    const { transaction } = payment;

    // Only reconcile if transaction was expired or cancelled
    if (
      transaction.transactionStatus !== TransactionStatus.Expired &&
      transaction.transactionStatus !== TransactionStatus.Dibatalkan
    ) {
      return {
        success: true,
        reinstated: false,
        message: "Status transaksi aktif, rekonsiliasi tidak diperlukan.",
      };
    }

    // Check if any unit has conflicting reservations on the same date window
    const unitIds = transaction.items
      .map((i) => i.unitId)
      .filter((id): id is string => Boolean(id));

    let hasConflict = false;

    if (unitIds.length > 0) {
      const conflictingBookings = await tx.rentalTransactionItem.findMany({
        where: {
          unitId: { in: unitIds },
          transaction: {
            id: { not: transaction.id },
            transactionStatus: { in: ACTIVE_STATUSES },
            AND: [
              { startDate: { lte: transaction.endDate } },
              { endDate: { gte: transaction.startDate } },
            ],
          },
        },
      });

      if (conflictingBookings.length > 0) {
        hasConflict = true;
      }
    }

    if (hasConflict) {
      // OVERBOOKING PREVENTED: Do NOT re-reserve units. Flag for manual admin refund.
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: PaymentStatus.Pending,
          rawResponse: JSON.stringify({
            reconciliationAlert: "LATE_PAYMENT_REFUND_REQUIRED",
            reason:
              "Pembayaran Midtrans terlambat tiba saat unit telah dipesan pelanggan lain.",
          }),
        },
      });

      await tx.activityLog.create({
        data: {
          action: "RECONCILIATION_OVERBOOKING_FLAG",
          entityName: "Payment",
          entityId: payment.id,
          description: `Peringatan Overbooking: Pembayaran pesanan ${transaction.transactionCode} tiba terlambat dan unit telah terisi. Perlu refund manual.`,
        },
      });

      return {
        success: false,
        conflict: true,
        message:
          "Unit telah terisi transaksi lain. Sistem memblokir alokasi ganda dan menandai transaksi untuk refund.",
      };
    }

    // No conflict: Reinstate to DP_Dibayar
    await tx.rentalTransaction.update({
      where: { id: transaction.id },
      data: {
        transactionStatus: TransactionStatus.DP_Dibayar,
        paymentStatus: PaymentStatus.DP_Paid,
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: PaymentStatus.DP_Paid,
        paidAt: new Date(),
      },
    });

    await tx.activityLog.create({
      data: {
        action: "RECONCILIATION_REINSTATED",
        entityName: "RentalTransaction",
        entityId: transaction.id,
        description: `Pesanan ${transaction.transactionCode} dipulihkan ke status DP_Dibayar setelah pembayaran terlambat diverifikasi aman tanpa konflik.`,
      },
    });

    return {
      success: true,
      reinstated: true,
      message: "Transaksi berhasil dipulihkan ke DP_Dibayar.",
    };
  });
}
