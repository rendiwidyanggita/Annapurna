"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import {
  pickupSchema,
  returnSchema,
  cancellationSchema,
  type PickupInput,
  type ReturnInput,
  type CancellationInput,
} from "@/schemas/transaction-operations";
import {
  processPickupTransaction,
  processReturnTransaction,
  processCancellationTransaction,
} from "@/lib/services/transaction-operations";
import { maskIdentityNumber } from "@/lib/services/transaction-privacy";
import { TransactionStatus, Prisma } from "@prisma/client";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  warning?: string | null;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

/**
 * Fetch paginated list of transactions with summary metrics
 */
export async function getTransactionsList({
  page = 1,
  limit = 10,
  status = "ALL",
  search = "",
}: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}) {
  await requireRole(["admin", "owner"]);

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.RentalTransactionWhereInput = {};

  if (status && status !== "ALL") {
    where.transactionStatus = status as TransactionStatus;
  }

  if (search && search.trim().length > 0) {
    const trimmed = search.trim();
    where.OR = [
      { transactionCode: { contains: trimmed, mode: "insensitive" } },
      {
        user: {
          profile: {
            fullName: { contains: trimmed, mode: "insensitive" },
          },
        },
      },
      {
        user: {
          email: { contains: trimmed, mode: "insensitive" },
        },
      },
    ];
  }

  const [total, transactions, countAll, countPickupReady, countRented, countLate] =
    await Promise.all([
      prisma.rentalTransaction.count({ where }),
      prisma.rentalTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          items: true,
          payments: true,
        },
      }),
      prisma.rentalTransaction.count(),
      prisma.rentalTransaction.count({
        where: {
          transactionStatus: {
            in: [
              TransactionStatus.DP_Dibayar,
              TransactionStatus.Siap_Diambil,
              TransactionStatus.Dikonfirmasi,
            ],
          },
        },
      }),
      prisma.rentalTransaction.count({
        where: { transactionStatus: TransactionStatus.Sedang_Disewa },
      }),
      prisma.rentalTransaction.count({
        where: { transactionStatus: TransactionStatus.Terlambat },
      }),
    ]);

  return {
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    metrics: {
      total: countAll,
      pickupReady: countPickupReady,
      rented: countRented,
      late: countLate,
    },
  };
}

/**
 * Fetch detailed transaction data for admin inspection
 */
export async function getTransactionDetail(id: string) {
  await requireRole(["admin", "owner"]);

  const transaction = await prisma.rentalTransaction.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      termsCondition: true,
      items: {
        include: {
          unit: true,
          returnItems: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
      returns: {
        orderBy: { returnDate: "desc" },
        include: {
          items: {
            include: {
              unit: true,
            },
          },
        },
      },
      penalties: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!transaction) return null;

  const activityLogs = await prisma.activityLog.findMany({
    where: {
      entityName: "RentalTransaction",
      entityId: id,
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  return {
    ...transaction,
    maskedGuaranteeId: maskIdentityNumber(transaction.guaranteeIdNumber),
    activityLogs,
  };
}

/**
 * AA-77: Execute Pickup / Handover Operation
 */
export async function pickupTransactionAction(
  data: PickupInput
): Promise<ActionResponse> {
  try {
    const { user } = await requireRole(["admin", "owner"]);

    const parsed = pickupSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const updated = await processPickupTransaction(parsed.data, user.id);

    revalidatePath("/admin/dashboard/transaksi");
    revalidatePath(`/admin/dashboard/transaksi/${data.transactionId}`);

    return {
      success: true,
      data: updated,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memproses pickup.";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * AA-80: Execute Return & Penalty Operation
 */
export async function returnTransactionAction(
  data: ReturnInput
): Promise<ActionResponse> {
  try {
    const { user } = await requireRole(["admin", "owner"]);

    const parsed = returnSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const result = await processReturnTransaction(parsed.data, user.id);

    revalidatePath("/admin/dashboard/transaksi");
    revalidatePath(`/admin/dashboard/transaksi/${data.transactionId}`);

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memproses pengembalian.";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * AA-83: Execute Cancellation Operation
 */
export async function cancelTransactionAction(
  data: CancellationInput
): Promise<ActionResponse> {
  try {
    const { user } = await requireRole(["admin", "owner"]);

    const parsed = cancellationSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const updated = await processCancellationTransaction(parsed.data, user.id);

    revalidatePath("/admin/dashboard/transaksi");
    revalidatePath(`/admin/dashboard/transaksi/${data.transactionId}`);

    return {
      success: true,
      data: updated,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membatalkan transaksi.";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Reveal raw guarantee ID number (Guarded by requireRole Admin/Owner)
 */
export async function revealGuaranteeIdAction(
  transactionId: string
): Promise<ActionResponse<{ rawGuaranteeId: string | null }>> {
  try {
    await requireRole(["admin", "owner"]);

    const tx = await prisma.rentalTransaction.findUnique({
      where: { id: transactionId },
      select: { guaranteeIdNumber: true },
    });

    if (!tx) {
      return {
        success: false,
        error: "Transaksi tidak ditemukan.",
      };
    }

    return {
      success: true,
      data: { rawGuaranteeId: tx.guaranteeIdNumber },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Akses ditolak.";
    return {
      success: false,
      error: message,
    };
  }
}
