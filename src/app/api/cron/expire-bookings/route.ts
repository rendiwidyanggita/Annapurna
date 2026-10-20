import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { TransactionStatus, PaymentStatus, UnitStatus } from "@prisma/client";

/**
 * GET /api/cron/expire-bookings
 *
 * Fallback cron job to expire unpaid bookings after 65 minutes.
 *
 * Design rationale (AA-71):
 * - Primary expiry: Midtrans sends "expire" webhook when the Snap token
 *   (60-minute custom_expiry) lapses. The webhook handler handles this case.
 * - Fallback: This cron runs every 5 minutes to catch transactions whose
 *   Midtrans webhook was never delivered (network issues, Midtrans downtime).
 * - Uses 65 minutes (not 60) to provide a 5-minute grace buffer for webhook
 *   delivery delays before the cron takes over.
 *
 * Security:
 * - Protected by CRON_SECRET bearer token.
 * - Vercel Cron Jobs include this header automatically.
 *
 * Idempotency:
 * - Only processes transactions in Menunggu_Pembayaran_DP state.
 * - Each transaction is updated atomically in its own Prisma transaction.
 *
 * Configured in vercel.json:
 *   crons: [{ path: "/api/cron/expire-bookings", schedule: "every 5 minutes" }]
 */
export async function GET(request: NextRequest) {
  // 1. Authorization — verify Vercel Cron or manual invocation with secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return errorResponse(
      "Unauthorized — invalid or missing CRON_SECRET",
      "UNAUTHORIZED",
      401,
    );
  }

  const startTime = Date.now();
  const cutoffTime = new Date(Date.now() - 65 * 60 * 1000); // 65 minutes ago

  // 2. Find all transactions that have been waiting for DP payment for > 65 minutes
  const expiredTransactions = await prisma.rentalTransaction.findMany({
    where: {
      transactionStatus: TransactionStatus.Menunggu_Pembayaran_DP,
      createdAt: {
        lt: cutoffTime,
      },
    },
    include: {
      items: {
        where: { unitId: { not: null } },
        select: { id: true, unitId: true, productNameSnap: true },
      },
    },
  });

  if (expiredTransactions.length === 0) {
    return successResponse(
      {
        expiredCount: 0,
        processedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      },
      "Tidak ada transaksi yang perlu dikadaluwarsa.",
    );
  }

  // 3. Process each expired transaction atomically
  const results: {
    transactionId: string;
    transactionCode: string;
    success: boolean;
    unitsReleased: number;
    error?: string;
  }[] = [];

  for (const trx of expiredTransactions) {
    try {
      const rentalUnitIds = trx.items
        .map((item) => item.unitId)
        .filter((id): id is string => id !== null);

      await prisma.$transaction(async (tx) => {
        // Update transaction status to Expired
        await tx.rentalTransaction.update({
          where: { id: trx.id },
          data: {
            transactionStatus: TransactionStatus.Expired,
            paymentStatus: PaymentStatus.Expired,
          },
        });

        // Release inventory units back to Available
        if (rentalUnitIds.length > 0) {
          await tx.inventoryUnit.updateMany({
            where: {
              id: { in: rentalUnitIds },
              // Only release units that are still in Available state
              // (webhook may have already released them)
              unitStatus: { in: [UnitStatus.Available, UnitStatus.Reserved] },
            },
            data: { unitStatus: UnitStatus.Available },
          });
        }

        // Update any pending Payment records to Expired
        await tx.payment.updateMany({
          where: {
            transactionId: trx.id,
            paymentStatus: PaymentStatus.Pending,
          },
          data: {
            paymentStatus: PaymentStatus.Expired,
          },
        });

        // Audit log
        await tx.activityLog.create({
          data: {
            userId: trx.userId,
            action: "BOOKING_EXPIRED_BY_CRON",
            entityName: "RentalTransaction",
            entityId: trx.id,
            newValue: JSON.stringify({
              previousStatus: TransactionStatus.Menunggu_Pembayaran_DP,
              newStatus: TransactionStatus.Expired,
              unitsReleased: rentalUnitIds.length,
              cutoffTime: cutoffTime.toISOString(),
            }),
            description: `Reservasi kadaluwarsa (cron fallback): ${trx.transactionCode}`,
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
        `[cron/expire] Expired: ${trx.transactionCode}, units released: ${rentalUnitIds.length}`,
      );
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "Unknown error";

      console.error(
        `[cron/expire] Failed to expire transaction ${trx.transactionCode}:`,
        error,
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

  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  return successResponse(
    {
      expiredCount: successCount,
      failedCount,
      totalProcessed: expiredTransactions.length,
      processedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      results,
    },
    `${successCount} transaksi berhasil dikadaluwarsa.`,
  );
}
