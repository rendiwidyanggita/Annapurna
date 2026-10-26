import { prisma } from "@/lib/prisma";
import { TransactionStatus, PaymentStatus, UnitStatus } from "@prisma/client";

export interface ExpiryResult {
  transactionId: string;
  transactionCode: string;
  success: boolean;
  unitsReleased: number;
  error?: string;
}

export interface ExpirySummary {
  expiredCount: number;
  failedCount: number;
  cutoffTime: string;
  results: ExpiryResult[];
}

/**
 * Expire stale bookings that have been waiting for DP payment beyond grace period.
 * Releases reserved inventory units back to Available.
 *
 * @param graceMinutes Grace period in minutes (default 65 = 60m Snap expiry + 5m buffer)
 * @param triggerSource Audit origin: "CRON" | "STARTUP_SWEEP" | "MANUAL"
 */
export async function expireStaleBookings(
  graceMinutes = 65,
  triggerSource: "CRON" | "STARTUP_SWEEP" | "MANUAL" = "CRON"
): Promise<ExpirySummary> {
  const cutoffTime = new Date(Date.now() - graceMinutes * 60 * 1000);

  const staleTransactions = await prisma.rentalTransaction.findMany({
    where: {
      transactionStatus: TransactionStatus.Menunggu_Pembayaran_DP,
      createdAt: { lt: cutoffTime },
    },
    include: {
      items: {
        where: { unitId: { not: null } },
        select: { id: true, unitId: true, productNameSnap: true },
      },
    },
  });

  const results: ExpiryResult[] = [];

  for (const trx of staleTransactions) {
    try {
      const rentalUnitIds = trx.items
        .map((item) => item.unitId)
        .filter((id): id is string => id !== null);

      await prisma.$transaction(async (tx) => {
        // 1. Update transaction status
        await tx.rentalTransaction.update({
          where: { id: trx.id },
          data: {
            transactionStatus: TransactionStatus.Expired,
            paymentStatus: PaymentStatus.Expired,
          },
        });

        // 2. Release reserved units back to Available
        if (rentalUnitIds.length > 0) {
          await tx.inventoryUnit.updateMany({
            where: {
              id: { in: rentalUnitIds },
              unitStatus: { in: [UnitStatus.Available, UnitStatus.Reserved] },
            },
            data: { unitStatus: UnitStatus.Available },
          });
        }

        // 3. Mark pending payments as Expired
        await tx.payment.updateMany({
          where: {
            transactionId: trx.id,
            paymentStatus: PaymentStatus.Pending,
          },
          data: { paymentStatus: PaymentStatus.Expired },
        });

        // 4. Audit Log
        await tx.activityLog.create({
          data: {
            userId: trx.userId,
            action: `BOOKING_EXPIRED_BY_${triggerSource}`,
            entityName: "RentalTransaction",
            entityId: trx.id,
            newValue: JSON.stringify({
              previousStatus: TransactionStatus.Menunggu_Pembayaran_DP,
              newStatus: TransactionStatus.Expired,
              unitsReleased: rentalUnitIds.length,
              cutoffTime: cutoffTime.toISOString(),
              triggerSource,
            }),
            description: `Reservasi kadaluwarsa (${triggerSource.toLowerCase()}): ${trx.transactionCode}`,
          },
        });
      });

      results.push({
        transactionId: trx.id,
        transactionCode: trx.transactionCode,
        success: true,
        unitsReleased: rentalUnitIds.length,
      });

      console.info(
        `[booking-expiry] (${triggerSource}) Expired: ${trx.transactionCode}, units released: ${rentalUnitIds.length}`
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(
        `[booking-expiry] (${triggerSource}) Failed to expire ${trx.transactionCode}:`,
        err
      );
      results.push({
        transactionId: trx.id,
        transactionCode: trx.transactionCode,
        success: false,
        unitsReleased: 0,
        error: errMsg,
      });
    }
  }

  const expiredCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  return {
    expiredCount,
    failedCount,
    cutoffTime: cutoffTime.toISOString(),
    results,
  };
}
