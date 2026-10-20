import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, TransactionStatus, UnitStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface MidtransNotification {
  order_id: string;
  transaction_id: string;
  transaction_status: string;
  fraud_status?: string;
  status_code: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  signature_key: string;
  settlement_time?: string;
  currency?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Signature Verification (AA-73)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates Midtrans webhook signature.
 *
 * Formula (from Midtrans docs):
 *   SHA-512( order_id + status_code + gross_amount + ServerKey )
 *
 * Reference: https://docs.midtrans.com/reference/handle-notifications
 */
function verifyMidtransSignature(notification: MidtransNotification): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    console.error("[webhook] MIDTRANS_SERVER_KEY not configured");
    return false;
  }

  const signatureInput = `${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`;
  const calculatedSignature = crypto
    .createHash("sha512")
    .update(signatureInput)
    .digest("hex");

  return calculatedSignature === notification.signature_key;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Mappers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps Midtrans transaction_status + fraud_status to internal PaymentStatus.
 */
function mapToPaymentStatus(
  transactionStatus: string,
  fraudStatus?: string,
): PaymentStatus | null {
  switch (transactionStatus) {
    case "capture":
      // Credit card: capture + challenge = fraud suspect, deny
      if (fraudStatus === "challenge") return null; // do not update
      return PaymentStatus.DP_Paid;
    case "settlement":
      return PaymentStatus.DP_Paid;
    case "pending":
      return PaymentStatus.Pending;
    case "expire":
      return PaymentStatus.Expired;
    case "cancel":
    case "deny":
    case "failure":
      return PaymentStatus.Failed;
    default:
      return null; // unknown status — skip
  }
}

/**
 * Maps Midtrans transaction_status to internal TransactionStatus.
 */
function mapToTransactionStatus(
  transactionStatus: string,
  fraudStatus?: string,
): TransactionStatus | null {
  switch (transactionStatus) {
    case "capture":
      if (fraudStatus === "challenge") return null;
      return TransactionStatus.DP_Dibayar;
    case "settlement":
      return TransactionStatus.DP_Dibayar;
    case "expire":
      return TransactionStatus.Expired;
    case "cancel":
    case "deny":
    case "failure":
      return TransactionStatus.Dibatalkan;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/webhooks/midtrans
 *
 * Receives Midtrans payment notifications and processes them idempotently.
 *
 * Security:
 * - Validates SHA-512 signature before any processing.
 * - Returns 200 OK even on business logic errors to prevent Midtrans retries
 *   (errors are logged internally).
 *
 * Idempotency (AA-74):
 * - Uses Payment.midtransOrderId as the idempotency key.
 * - If payment is already in DP_Paid state and notification is "settlement",
 *   the handler returns 200 OK without re-processing (no duplicate updates).
 *
 * State transitions (AA-75):
 * - settlement  → TransactionStatus: DP_Dibayar, Units: Available → Reserved
 * - expire      → TransactionStatus: Expired, Units: Reserved → Available
 * - cancel/deny → TransactionStatus: Dibatalkan, Units: Reserved → Available
 */
export async function POST(request: NextRequest) {
  let notification: MidtransNotification;

  // 1. Parse request body
  try {
    notification = await request.json();
  } catch {
    console.error("[webhook] Failed to parse request body");
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  // 2. Signature verification (AA-73)
  const isSignatureValid = verifyMidtransSignature(notification);
  if (!isSignatureValid) {
    console.warn(
      `[webhook] Signature verification FAILED for order_id: ${notification.order_id}`,
    );
    return NextResponse.json(
      { message: "Invalid signature" },
      { status: 401 },
    );
  }

  const {
    order_id,
    transaction_id,
    transaction_status,
    fraud_status,
    payment_type,
    gross_amount,
  } = notification;

  console.info(
    `[webhook] Received: order_id=${order_id}, status=${transaction_status}, fraud=${fraud_status ?? "none"}`,
  );

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // 3. Find Payment by midtransOrderId (idempotency key)
        const payment = await tx.payment.findUnique({
          where: { midtransOrderId: order_id },
          include: {
            transaction: {
              include: {
                items: {
                  where: { unitId: { not: null } },
                  select: { unitId: true },
                },
              },
            },
          },
        });

        if (!payment) {
          console.warn(
            `[webhook] Payment not found for order_id: ${order_id}. Possibly not yet created.`,
          );
          // Return 200 to prevent Midtrans infinite retries for unknown orders
          return { skipped: true, reason: "payment_not_found" };
        }

        // 4. Idempotency guard (AA-74) — skip if already in final state
        const isAlreadySettled = payment.paymentStatus === PaymentStatus.DP_Paid;
        const isIncomingSettlement =
          transaction_status === "settlement" || transaction_status === "capture";

        if (isAlreadySettled && isIncomingSettlement) {
          console.info(
            `[webhook] Duplicate settlement notification for order_id: ${order_id}. Skipping.`,
          );
          return { skipped: true, reason: "already_settled" };
        }

        const isAlreadyTerminal =
          payment.paymentStatus === PaymentStatus.Expired ||
          payment.paymentStatus === PaymentStatus.Failed;
        const isIncomingTerminal = ["expire", "cancel", "deny", "failure"].includes(
          transaction_status,
        );

        if (isAlreadyTerminal && isIncomingTerminal) {
          console.info(
            `[webhook] Duplicate terminal notification for order_id: ${order_id}. Skipping.`,
          );
          return { skipped: true, reason: "already_terminal" };
        }

        // 5. Map statuses
        const newPaymentStatus = mapToPaymentStatus(transaction_status, fraud_status);
        const newTransactionStatus = mapToTransactionStatus(
          transaction_status,
          fraud_status,
        );

        if (!newPaymentStatus) {
          console.info(
            `[webhook] Unhandled transaction_status: ${transaction_status}. Storing raw response only.`,
          );
        }

        // 6. Update Payment record
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            ...(newPaymentStatus ? { paymentStatus: newPaymentStatus } : {}),
            midtransTransactionId: transaction_id,
            paymentType: payment_type,
            paidAt:
              isIncomingSettlement ? new Date(notification.settlement_time ?? Date.now()) : null,
            rawResponse: JSON.stringify(notification),
          },
        });

        // 7. Update RentalTransaction status
        if (newTransactionStatus) {
          await tx.rentalTransaction.update({
            where: { id: payment.transactionId },
            data: {
              transactionStatus: newTransactionStatus,
              paymentStatus: newPaymentStatus ?? undefined,
            },
          });
        }

        // 8. Handle InventoryUnit status changes
        const rentalUnitIds = payment.transaction.items
          .map((item) => item.unitId)
          .filter((id): id is string => id !== null);

        if (rentalUnitIds.length > 0) {
          // Settlement: Available → Reserved (AA-75)
          if (isIncomingSettlement && fraud_status !== "challenge") {
            await tx.inventoryUnit.updateMany({
              where: {
                id: { in: rentalUnitIds },
                unitStatus: UnitStatus.Available,
              },
              data: { unitStatus: UnitStatus.Reserved },
            });

            console.info(
              `[webhook] ${rentalUnitIds.length} unit(s) set to Reserved for order_id: ${order_id}`,
            );
          }

          // Expire / Cancel: release units back to Available
          if (isIncomingTerminal) {
            await tx.inventoryUnit.updateMany({
              where: {
                id: { in: rentalUnitIds },
                unitStatus: { in: [UnitStatus.Reserved, UnitStatus.Available] },
              },
              data: { unitStatus: UnitStatus.Available },
            });

            console.info(
              `[webhook] ${rentalUnitIds.length} unit(s) released to Available for order_id: ${order_id}`,
            );
          }
        }

        // 9. Audit log
        await tx.activityLog.create({
          data: {
            userId: payment.transaction.userId,
            action: "PAYMENT_WEBHOOK_PROCESSED",
            entityName: "Payment",
            entityId: payment.id,
            newValue: JSON.stringify({
              transaction_status,
              fraud_status,
              order_id,
              gross_amount,
            }),
            description: `Midtrans webhook [${transaction_status}] diproses untuk order ${order_id}`,
          },
        });

        return {
          skipped: false,
          orderId: order_id,
          transactionStatus: newTransactionStatus,
          paymentStatus: newPaymentStatus,
          unitsAffected: rentalUnitIds.length,
        };
      },
      {
        timeout: 10000,
      },
    );

    console.info(`[webhook] Processed: order_id=${order_id}`, result);

    // Always return 200 to acknowledge receipt to Midtrans
    return NextResponse.json(
      { message: "Webhook processed", ...result },
      { status: 200 },
    );
  } catch (error) {
    // Log the error but still return 200 to prevent Midtrans retries
    // (retries are handled by the cron fallback)
    console.error(`[webhook] Error processing order_id=${order_id}:`, error);

    return NextResponse.json(
      {
        message: "Webhook received but processing encountered an error",
        orderId: order_id,
      },
      { status: 200 },
    );
  }
}
