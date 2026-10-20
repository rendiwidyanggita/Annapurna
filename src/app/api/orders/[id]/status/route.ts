import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NotFoundError, ForbiddenError, AppError } from "@/lib/errors";

/**
 * GET /api/orders/[id]/status
 *
 * Lightweight endpoint to poll the latest transaction status.
 * Used by the InvoiceContent client component to detect webhook-driven
 * status updates after a Snap payment is completed.
 *
 * Returns only transactionStatus and paymentStatus (minimal payload).
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

    if (transaction.userId !== profileStatus.user.id) {
      throw new ForbiddenError("Akses tidak diizinkan.");
    }

    return successResponse({
      transactionStatus: transaction.transactionStatus,
      paymentStatus: transaction.paymentStatus,
      updatedAt: transaction.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.code, error.statusCode);
    }
    return errorResponse("Terjadi kesalahan.", "INTERNAL_ERROR", 500);
  }
}
