import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NotFoundError, ForbiddenError, AppError } from "@/lib/errors";
import { coreClient } from "@/lib/midtrans";
import { PaymentStatus, TransactionStatus, UnitStatus } from "@prisma/client";

/**
 * GET /api/orders/[id]/status
 *
 * Lightweight endpoint to poll the latest transaction status.
 * Used by the InvoiceContent client component to detect webhook-driven
 * status updates after a Snap payment is completed.
 *
 * Also actively syncs with Midtrans Core API when pending, allowing seamless
 * local development testing without requiring Ngrok, and providing a resilient
 * fallback if webhooks are delayed.
 *
 * Security: user must own the transaction.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const profileStatus = await getCurrentUserProfile();
    if (!profileStatus.isAuthenticated || !profileStatus.user) {
      return errorResponse("Silakan login terlebih dahulu.", "UNAUTHORIZED", 401);
    }
    const currentUser = profileStatus.user;

    const transaction = await prisma.rentalTransaction.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        transactionStatus: true,
        paymentStatus: true,
        updatedAt: true,
      },
    });

    if (!transaction) {
      throw new NotFoundError("Transaksi tidak ditemukan.");
    }

    if (transaction.userId !== currentUser.id) {
      throw new ForbiddenError("Akses tidak diizinkan.");
    }

    let currentTransactionStatus = transaction.transactionStatus;
    let currentPaymentStatus = transaction.paymentStatus;
    let updatedAt = transaction.updatedAt.toISOString();

    // Jika status masih Menunggu_Pembayaran_DP, aktif sinkronkan dengan Midtrans API
    if (transaction.transactionStatus === TransactionStatus.Menunggu_Pembayaran_DP) {
      const pendingPayment = await prisma.payment.findFirst({
        where: {
          transactionId: id,
          paymentStatus: PaymentStatus.Pending,
        },
        orderBy: { createdAt: "desc" },
      });

      if (pendingPayment?.midtransOrderId) {
        try {
          const rawStatus = await coreClient.transaction.status(
            pendingPayment.midtransOrderId
          );
          const midtransStatus = rawStatus as Record<string, unknown>;
          const txStatus = typeof midtransStatus.transaction_status === "string" ? midtransStatus.transaction_status : "";
          const fraudStatus = typeof midtransStatus.fraud_status === "string" ? midtransStatus.fraud_status : undefined;
          const settlementTime = typeof midtransStatus.settlement_time === "string" ? midtransStatus.settlement_time : null;
          const midtransTxId = typeof midtransStatus.transaction_id === "string" ? midtransStatus.transaction_id : null;
          const paymentType = typeof midtransStatus.payment_type === "string" ? midtransStatus.payment_type : null;

          if (
            (txStatus === "settlement" || txStatus === "capture") &&
            fraudStatus !== "challenge"
          ) {
            await prisma.$transaction(async (tx) => {
              await tx.payment.update({
                where: { id: pendingPayment.id },
                data: {
                  paymentStatus: PaymentStatus.DP_Paid,
                  midtransTransactionId: midtransTxId,
                  paymentType: paymentType,
                  paidAt: settlementTime ? new Date(settlementTime) : new Date(),
                  rawResponse: JSON.stringify(midtransStatus),
                },
              });

              await tx.rentalTransaction.update({
                where: { id },
                data: {
                  transactionStatus: TransactionStatus.DP_Dibayar,
                  paymentStatus: PaymentStatus.DP_Paid,
                },
              });

              const items = await tx.rentalTransactionItem.findMany({
                where: { transactionId: id, unitId: { not: null } },
                select: { unitId: true },
              });
              const unitIds = items
                .map((it: { unitId: string | null }) => it.unitId)
                .filter((u: string | null): u is string => u !== null);

              if (unitIds.length > 0) {
                await tx.inventoryUnit.updateMany({
                  where: { id: { in: unitIds }, unitStatus: UnitStatus.Available },
                  data: { unitStatus: UnitStatus.Reserved },
                });
              }

              await tx.activityLog.create({
                data: {
                  userId: currentUser.id,
                  action: "PAYMENT_STATUS_SYNCED",
                  entityName: "Payment",
                  entityId: pendingPayment.id,
                  newValue: JSON.stringify({
                    transaction_status: txStatus,
                    order_id: pendingPayment.midtransOrderId,
                  }),
                  description: `Status pembayaran disinkronisasi dari Midtrans API: ${txStatus}`,
                },
              });
            });

            currentTransactionStatus = TransactionStatus.DP_Dibayar;
            currentPaymentStatus = PaymentStatus.DP_Paid;
            updatedAt = new Date().toISOString();
          }
        } catch (syncErr) {
          console.warn("[order-status] Midtrans status sync skipped:", syncErr);
        }
      }
    }

    return successResponse({
      transactionStatus: currentTransactionStatus,
      paymentStatus: currentPaymentStatus,
      updatedAt,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.code, error.statusCode);
    }
    return errorResponse("Terjadi kesalahan.", "INTERNAL_ERROR", 500);
  }
}
