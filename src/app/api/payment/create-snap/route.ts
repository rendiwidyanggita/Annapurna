import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { snapClient } from "@/lib/midtrans";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NotFoundError, ForbiddenError, AppError } from "@/lib/errors";
import { PaymentStatus, TransactionStatus } from "@prisma/client";
import { z } from "zod";

const createSnapSchema = z.object({
  transactionId: z.string().uuid("transactionId tidak valid"),
});

/**
 * POST /api/payment/create-snap
 *
 * Generates a Midtrans Snap payment token for a pending transaction's DP (50%).
 * Creates a Payment record in the database.
 *
 * Request body: { transactionId: string }
 * Response:     { snapToken: string, snapRedirectUrl: string, midtransOrderId: string }
 *
 * Business rules:
 * - Transaction must belong to the authenticated user.
 * - Transaction must be in Menunggu_Pembayaran_DP status.
 * - If a Pending Payment record already exists (snap token not yet used),
 *   return the existing token instead of creating a new one (idempotent).
 * - Sets custom_expiry of 60 minutes to match the booking soft-hold window.
 *
 * AA-72: Integrasi Midtrans Snap Sandbox
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const profileStatus = await getCurrentUserProfile();
    if (!profileStatus.isAuthenticated || !profileStatus.user) {
      return errorResponse(
        "Silakan login terlebih dahulu.",
        "UNAUTHORIZED",
        401,
      );
    }

    const { user, profile } = profileStatus;

    // 2. Validate input
    const body = await request.json();
    const parsed = createSnapSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message || "Data tidak valid",
        "VALIDATION_ERROR",
        422,
        parsed.error.flatten(),
      );
    }

    const { transactionId } = parsed.data;

    // 3. Fetch transaction with items + existing payments
    const transaction = await prisma.rentalTransaction.findUnique({
      where: { id: transactionId },
      include: {
        items: true,
        payments: {
          where: {
            paymentStatus: PaymentStatus.Pending,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!transaction) {
      throw new NotFoundError("Transaksi tidak ditemukan.");
    }

    // 4. Ownership check
    if (transaction.userId !== user.id) {
      throw new ForbiddenError("Anda tidak memiliki akses ke transaksi ini.");
    }

    // 5. Status validation
    if (
      transaction.transactionStatus !== TransactionStatus.Menunggu_Pembayaran_DP
    ) {
      const msg =
        transaction.transactionStatus === TransactionStatus.DP_Dibayar
          ? "Pembayaran DP untuk transaksi ini sudah berhasil dilakukan."
          : transaction.transactionStatus === TransactionStatus.Expired
            ? "Waktu pembayaran untuk transaksi ini telah habis."
            : `Transaksi tidak dapat dibayar (status: ${transaction.transactionStatus}).`;

      return errorResponse(msg, "INVALID_STATUS", 409);
    }

    // 6. Idempotency — return existing pending Snap token if available
    const existingPayment = transaction.payments[0];
    if (existingPayment?.snapToken) {
      return successResponse(
        {
          snapToken: existingPayment.snapToken,
          snapRedirectUrl: existingPayment.snapRedirectUrl ?? "",
          midtransOrderId: existingPayment.midtransOrderId,
          isReused: true,
        },
        "Snap token tersedia (reused).",
      );
    }

    // 7. Build Midtrans Snap request payload
    const midtransOrderId = `${transaction.transactionCode}-${Date.now()}`;

    const itemDetails = transaction.items.map((item) => ({
      id: item.productId,
      name:
        item.productNameSnap.length > 50
          ? item.productNameSnap.slice(0, 50)
          : item.productNameSnap,
      price: item.priceSnap,
      quantity: item.quantity,
    }));

    // Add DP label item so gross_amount == dpAmount exactly
    const dpItemDetails = [
      {
        id: `dp-${transaction.transactionCode}`,
        name: `DP 50% — ${transaction.transactionCode}`,
        price: transaction.dpAmount,
        quantity: 1,
      },
    ];

    const snapPayload = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: transaction.dpAmount,
      },
      customer_details: {
        first_name:
          (profile?.fullName ?? user.email?.split("@")[0] ?? "Customer"),
        email: user.email,
        phone: profile?.phoneNumber ?? "",
      },
      item_details: dpItemDetails,
      custom_expiry: {
        order_time: new Date().toISOString().replace("T", " ").slice(0, 19) + " +0700",
        expiry_duration: 60,
        unit: "minute" as const,
      },
    };

    // 8. Call Midtrans Snap API
    const snapResponse = await snapClient.createTransaction(snapPayload);

    if (!snapResponse.token) {
      throw new AppError(
        "Midtrans tidak mengembalikan token pembayaran.",
        "MIDTRANS_ERROR",
        502,
      );
    }

    // 9. Create Payment record in database
    const payment = await prisma.payment.create({
      data: {
        transactionId: transaction.id,
        midtransOrderId,
        snapToken: snapResponse.token,
        snapRedirectUrl: snapResponse.redirect_url ?? null,
        grossAmount: transaction.dpAmount,
        paymentStatus: PaymentStatus.Pending,
      },
    });

    // 10. Audit log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "SNAP_TOKEN_CREATED",
        entityName: "Payment",
        entityId: payment.id,
        newValue: JSON.stringify({
          midtransOrderId,
          dpAmount: transaction.dpAmount,
          transactionCode: transaction.transactionCode,
        }),
        description: `Snap token dibuat untuk transaksi ${transaction.transactionCode}`,
      },
    });

    return successResponse(
      {
        snapToken: snapResponse.token,
        snapRedirectUrl: snapResponse.redirect_url ?? "",
        midtransOrderId,
        isReused: false,
      },
      "Snap token berhasil dibuat.",
    );
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }

    console.error("[create-snap] Unexpected error:", error);
    return errorResponse(
      "Terjadi kesalahan saat membuat token pembayaran.",
      "INTERNAL_ERROR",
      500,
    );
  }
}
