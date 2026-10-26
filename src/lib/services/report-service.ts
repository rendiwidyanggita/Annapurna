import { prisma } from "@/lib/prisma";
import {
  PaymentStatus,
  TransactionStatus,
  UnitStatus,
  PenaltyType,
  Prisma,
} from "@prisma/client";
import { getWibDateRange, type DateRangePreset } from "@/lib/date-range";

export interface ReportFilterParams {
  preset?: DateRangePreset;
  startDate?: string;
  endDate?: string;
  status?: string;
  productId?: string;
  page?: number;
  limit?: number;
}

// ==============================================================================
// 1. Revenue & Cash Aggregation (AA-85, AA-88, AA-89)
// ==============================================================================
export async function getRevenueSummary(filter: ReportFilterParams = {}) {
  const range = getWibDateRange(filter.preset ?? "30d", filter.startDate, filter.endDate);

  // Inflows: DP & online payments successfully paid
  const inflows = await prisma.payment.aggregate({
    where: {
      paidAt: {
        gte: range.startUtc,
        lte: range.endUtc,
      },
      paymentStatus: {
        in: [
          PaymentStatus.DP_Paid,
          PaymentStatus.Remaining_Paid,
          PaymentStatus.Fully_Paid,
        ],
      },
    },
    _sum: { grossAmount: true },
    _count: { id: true },
  });

  // Refunds: Payments marked refunded in this date range
  const refunds = await prisma.payment.aggregate({
    where: {
      updatedAt: {
        gte: range.startUtc,
        lte: range.endUtc,
      },
      paymentStatus: PaymentStatus.Refunded,
    },
    _sum: { grossAmount: true },
    _count: { id: true },
  });

  // Cashier Remaining Payments (Cash / In-Store QRIS paid at pickup)
  // For transactions completed/confirmed/active where remaining payment was collected
  const settledRemaining = await prisma.rentalTransaction.aggregate({
    where: {
      updatedAt: {
        gte: range.startUtc,
        lte: range.endUtc,
      },
      paymentStatus: {
        in: [PaymentStatus.Remaining_Paid, PaymentStatus.Fully_Paid],
      },
      remainingAmount: { gt: 0 },
    },
    _sum: { remainingAmount: true },
    _count: { id: true },
  });

  // Penalties collected
  const penalties = await prisma.penalty.aggregate({
    where: {
      createdAt: {
        gte: range.startUtc,
        lte: range.endUtc,
      },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  const grossInflows = inflows._sum.grossAmount ?? 0;
  const totalRefunded = refunds._sum.grossAmount ?? 0;
  const cashierRemaining = settledRemaining._sum.remainingAmount ?? 0;
  const totalPenalties = penalties._sum.amount ?? 0;
  const netRevenue = grossInflows + cashierRemaining + totalPenalties - totalRefunded;

  return {
    dateRange: range,
    grossInflows,
    totalRefunded,
    cashierRemaining,
    totalPenalties,
    netRevenue,
    paymentCount: inflows._count.id,
    refundCount: refunds._count.id,
    remainingCount: settledRemaining._count.id,
    penaltyCount: penalties._count.id,
  };
}

// ==============================================================================
// 2. Rental Transaction Report (AA-87)
// ==============================================================================
export async function getRentalTransactionReport(filter: ReportFilterParams = {}) {
  const range = getWibDateRange(filter.preset ?? "30d", filter.startDate, filter.endDate);
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Prisma.RentalTransactionWhereInput = {
    createdAt: {
      gte: range.startUtc,
      lte: range.endUtc,
    },
    ...(filter.status ? { transactionStatus: filter.status as TransactionStatus } : {}),
  };

  const [totalCount, transactions, statusAggregation, durationAgg] = await Promise.all([
    prisma.rentalTransaction.count({ where }),
    prisma.rentalTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true, phoneNumber: true } },
          },
        },
        items: true,
        payments: true,
      },
    }),
    prisma.rentalTransaction.groupBy({
      by: ["transactionStatus"],
      where,
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    prisma.rentalTransaction.aggregate({
      where,
      _avg: { totalDurationDays: true },
      _sum: { totalAmount: true, dpAmount: true, remainingAmount: true },
    }),
  ]);

  return {
    dateRange: range,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
    summary: {
      totalTransactions: totalCount,
      averageDurationDays: Math.round((durationAgg._avg.totalDurationDays ?? 0) * 10) / 10,
      totalGrossAmount: durationAgg._sum.totalAmount ?? 0,
      totalDpAmount: durationAgg._sum.dpAmount ?? 0,
      totalRemainingAmount: durationAgg._sum.remainingAmount ?? 0,
      statusBreakdown: statusAggregation.map((s) => ({
        status: s.transactionStatus,
        count: s._count.id,
        totalAmount: s._sum.totalAmount ?? 0,
      })),
    },
    transactions,
  };
}

// ==============================================================================
// 3. DP Midtrans Report (AA-88)
// ==============================================================================
export async function getDpReport(filter: ReportFilterParams = {}) {
  const range = getWibDateRange(filter.preset ?? "30d", filter.startDate, filter.endDate);
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Prisma.PaymentWhereInput = {
    paidAt: {
      gte: range.startUtc,
      lte: range.endUtc,
    },
    paymentStatus: {
      in: [PaymentStatus.DP_Paid, PaymentStatus.Fully_Paid],
    },
  };

  const [totalCount, payments, methodBreakdown, grossAgg] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paidAt: "desc" },
      include: {
        transaction: {
          select: {
            id: true,
            transactionCode: true,
            startDate: true,
            endDate: true,
            totalAmount: true,
            user: {
              select: {
                email: true,
                profile: { select: { fullName: true } },
              },
            },
          },
        },
      },
    }),
    prisma.payment.groupBy({
      by: ["paymentType"],
      where,
      _count: { id: true },
      _sum: { grossAmount: true },
    }),
    prisma.payment.aggregate({
      where,
      _sum: { grossAmount: true },
    }),
  ]);

  return {
    dateRange: range,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
    summary: {
      totalDpCount: totalCount,
      totalDpAmount: grossAgg._sum.grossAmount ?? 0,
      methodBreakdown: methodBreakdown.map((m) => ({
        method: m.paymentType || "Unknown",
        count: m._count.id,
        amount: m._sum.grossAmount ?? 0,
      })),
    },
    payments,
  };
}

// ==============================================================================
// 4. Remaining Payment (Kasir) Report (AA-89)
// ==============================================================================
export async function getRemainingPaymentReport(filter: ReportFilterParams = {}) {
  const range = getWibDateRange(filter.preset ?? "30d", filter.startDate, filter.endDate);
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Prisma.RentalTransactionWhereInput = {
    updatedAt: {
      gte: range.startUtc,
      lte: range.endUtc,
    },
    paymentStatus: {
      in: [PaymentStatus.Remaining_Paid, PaymentStatus.Fully_Paid],
    },
    remainingAmount: { gt: 0 },
  };

  const [totalCount, transactions, agg] = await Promise.all([
    prisma.rentalTransaction.count({ where }),
    prisma.rentalTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { fullName: true, phoneNumber: true } },
          },
        },
        items: true,
      },
    }),
    prisma.rentalTransaction.aggregate({
      where,
      _sum: { remainingAmount: true },
    }),
  ]);

  return {
    dateRange: range,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
    summary: {
      totalRemainingCount: totalCount,
      totalRemainingAmount: agg._sum.remainingAmount ?? 0,
    },
    transactions,
  };
}

// ==============================================================================
// 5. Penalty / Denda Report (AA-90)
// ==============================================================================
export async function getPenaltyReport(filter: ReportFilterParams = {}) {
  const range = getWibDateRange(filter.preset ?? "30d", filter.startDate, filter.endDate);
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Prisma.PenaltyWhereInput = {
    createdAt: {
      gte: range.startUtc,
      lte: range.endUtc,
    },
  };

  const [totalCount, penalties, typeBreakdown, sumAgg] = await Promise.all([
    prisma.penalty.count({ where }),
    prisma.penalty.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        transaction: {
          select: {
            transactionCode: true,
            user: {
              select: {
                email: true,
                profile: { select: { fullName: true } },
              },
            },
          },
        },
      },
    }),
    prisma.penalty.groupBy({
      by: ["penaltyType"],
      where,
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.penalty.aggregate({
      where,
      _sum: { amount: true },
    }),
  ]);

  return {
    dateRange: range,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
    summary: {
      totalPenaltyCount: totalCount,
      totalPenaltyAmount: sumAgg._sum.amount ?? 0,
      typeBreakdown: typeBreakdown.map((t) => ({
        type: t.penaltyType,
        count: t._count.id,
        amount: t._sum.amount ?? 0,
      })),
    },
    penalties,
  };
}

// ==============================================================================
// 6. Problematic Units Report (AA-91)
// ==============================================================================
export async function getProblematicUnitsReport(filter: ReportFilterParams = {}) {
  const range = getWibDateRange(filter.preset ?? "30d", filter.startDate, filter.endDate);

  const problematicUnits = await prisma.inventoryUnit.findMany({
    where: {
      unitStatus: {
        in: [UnitStatus.Maintenance, UnitStatus.Damaged, UnitStatus.Lost],
      },
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      variant: {
        include: {
          product: {
            select: { id: true, name: true, category: { select: { name: true } } },
          },
        },
      },
      statusLogs: {
        where: {
          createdAt: {
            gte: range.startUtc,
            lte: range.endUtc,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          changedByUser: {
            select: { email: true, profile: { select: { fullName: true } } },
          },
        },
      },
    },
  });

  const countByStatus = {
    [UnitStatus.Maintenance]: 0,
    [UnitStatus.Damaged]: 0,
    [UnitStatus.Lost]: 0,
  };

  for (const unit of problematicUnits) {
    if (unit.unitStatus in countByStatus) {
      countByStatus[unit.unitStatus as keyof typeof countByStatus]++;
    }
  }

  return {
    dateRange: range,
    summary: {
      totalProblematic: problematicUnits.length,
      maintenanceCount: countByStatus[UnitStatus.Maintenance],
      damagedCount: countByStatus[UnitStatus.Damaged],
      lostCount: countByStatus[UnitStatus.Lost],
    },
    units: problematicUnits,
  };
}

// ==============================================================================
// 7. Consumable Usage Report (AA-92)
// ==============================================================================
export async function getConsumableUsageReport(filter: ReportFilterParams = {}) {
  const range = getWibDateRange(filter.preset ?? "30d", filter.startDate, filter.endDate);

  // Consumable products in catalog
  const consumableProducts = await prisma.product.findMany({
    where: {
      itemType: "consumable",
      deletedAt: null,
    },
    include: {
      category: { select: { name: true } },
    },
  });

  // Items rented in this period
  const rentedItems = await prisma.rentalTransactionItem.findMany({
    where: {
      createdAt: {
        gte: range.startUtc,
        lte: range.endUtc,
      },
      transaction: {
        transactionStatus: {
          notIn: [TransactionStatus.Dibatalkan, TransactionStatus.Ditolak, TransactionStatus.Expired],
        },
      },
    },
    select: {
      productId: true,
      productNameSnap: true,
      quantity: true,
      subtotal: true,
    },
  });

  const usageMap: Record<
    string,
    {
      productId: string;
      name: string;
      category: string;
      currentStock: number;
      isReusable: boolean;
      rentedQty: number;
      revenue: number;
    }
  > = {};

  for (const prod of consumableProducts) {
    usageMap[prod.id] = {
      productId: prod.id,
      name: prod.name,
      category: prod.category.name,
      currentStock: prod.consumableStock,
      isReusable: prod.isReusable,
      rentedQty: 0,
      revenue: 0,
    };
  }

  for (const item of rentedItems) {
    if (usageMap[item.productId]) {
      usageMap[item.productId].rentedQty += item.quantity;
      usageMap[item.productId].revenue += item.subtotal;
    }
  }

  const reusable = Object.values(usageMap).filter((item) => item.isReusable);
  const nonReusable = Object.values(usageMap).filter((item) => !item.isReusable);

  return {
    dateRange: range,
    summary: {
      totalConsumableTypes: consumableProducts.length,
      reusableCount: reusable.length,
      nonReusableCount: nonReusable.length,
    },
    reusable,
    nonReusable,
  };
}

// ==============================================================================
// 8. Top Products Report (AA-93)
// ==============================================================================
export async function getTopProductsReport(filter: ReportFilterParams = {}) {
  const range = getWibDateRange(filter.preset ?? "30d", filter.startDate, filter.endDate);
  const limit = filter.limit ?? 10;

  // Aggregate rented items grouped by productId
  const groupedItems = await prisma.rentalTransactionItem.groupBy({
    by: ["productId"],
    where: {
      createdAt: {
        gte: range.startUtc,
        lte: range.endUtc,
      },
      transaction: {
        transactionStatus: {
          notIn: [TransactionStatus.Dibatalkan, TransactionStatus.Ditolak, TransactionStatus.Expired],
        },
      },
    },
    _sum: {
      quantity: true,
      subtotal: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  });

  // Fetch product metadata
  const productIds = groupedItems.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { category: { select: { name: true } } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const topProducts = groupedItems.map((item, index) => {
    const prod = productMap.get(item.productId);
    return {
      rank: index + 1,
      productId: item.productId,
      name: prod?.name ?? "Produk Dihapus",
      category: prod?.category.name ?? "-",
      itemType: prod?.itemType ?? "rental_unit",
      totalRentedUnits: item._sum.quantity ?? 0,
      totalRevenue: item._sum.subtotal ?? 0,
      transactionCount: item._count.id,
    };
  });

  return {
    dateRange: range,
    topProducts,
  };
}

// ==============================================================================
// 9. Booking Trend (Weekly / Daily) for Pure SVG Chart (AA-85)
// ==============================================================================
export async function getBookingTrendData(days: number = 7) {
  const range = getWibDateRange(days === 7 ? "7d" : "30d");

  // Fetch active / valid bookings in this range
  const bookings = await prisma.rentalTransaction.findMany({
    where: {
      createdAt: {
        gte: range.startUtc,
        lte: range.endUtc,
      },
    },
    select: {
      createdAt: true,
      totalAmount: true,
      transactionStatus: true,
    },
  });

  // Group by WIB date (YYYY-MM-DD)
  const dayBuckets: Record<string, { date: string; label: string; count: number; revenue: number }> = {};

  for (let i = days - 1; i >= 0; i--) {
    const refMs = Date.now() + 7 * 60 * 60 * 1000 - i * 24 * 60 * 60 * 1000;
    const d = new Date(refMs);
    const ymd = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}-${d.getUTCDate().toString().padStart(2, "0")}`;
    const dayLabel = `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
    dayBuckets[ymd] = { date: ymd, label: dayLabel, count: 0, revenue: 0 };
  }

  for (const b of bookings) {
    const bWibMs = b.createdAt.getTime() + 7 * 60 * 60 * 1000;
    const bDate = new Date(bWibMs);
    const bYmd = `${bDate.getUTCFullYear()}-${(bDate.getUTCMonth() + 1).toString().padStart(2, "0")}-${bDate.getUTCDate().toString().padStart(2, "0")}`;
    if (dayBuckets[bYmd]) {
      dayBuckets[bYmd].count += 1;
      if (b.transactionStatus !== TransactionStatus.Dibatalkan && b.transactionStatus !== TransactionStatus.Ditolak) {
        dayBuckets[bYmd].revenue += b.totalAmount;
      }
    }
  }

  return Object.values(dayBuckets);
}
