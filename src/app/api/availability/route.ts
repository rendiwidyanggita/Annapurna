import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES } from "@/lib/constants";
import { successResponse, errorResponse } from "@/lib/api-response";
import { UnitStatus } from "@prisma/client";

/**
 * Public Availability Check API (AA-64, AA-66)
 *
 * Checks if a rental unit variant or consumable product is available
 * for a specified date range without locking the database.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const variantId = searchParams.get("variantId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const quantity = Math.max(1, parseInt(searchParams.get("quantity") || "1", 10));

    if (!productId) {
      return errorResponse("Parameter productId wajib diisi", "BAD_REQUEST", 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
      select: {
        id: true,
        name: true,
        itemType: true,
        consumableStock: true,
        isActive: true,
      },
    });

    if (!product || !product.isActive) {
      return errorResponse("Produk tidak ditemukan atau tidak aktif", "NOT_FOUND", 404);
    }

    // 1. Consumable Stock Check (AA-66)
    if (product.itemType === "consumable") {
      const isAvailable = product.consumableStock >= quantity;
      const statusLevel = isAvailable
        ? product.consumableStock <= 3
          ? "limited"
          : "available"
        : "unavailable";

      return successResponse({
        isAvailable,
        availableCount: product.consumableStock,
        totalCount: product.consumableStock,
        itemType: "consumable",
        statusLevel,
        message: isAvailable
          ? `Stok tersedia (${product.consumableStock} unit siap pakai).`
          : "Stok habis atau melebihi persediaan.",
      });
    }

    // 2. Rental Unit Check (AA-64)
    if (!startDateParam || !endDateParam) {
      return errorResponse(
        "Parameter startDate dan endDate wajib diisi untuk produk rental",
        "BAD_REQUEST",
        400
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return errorResponse("Format tanggal tidak valid (gunakan format ISO)", "BAD_REQUEST", 400);
    }

    if (endDate < startDate) {
      return errorResponse("Tanggal kembali tidak boleh lebih awal dari tanggal ambil", "BAD_REQUEST", 400);
    }

    // Build query where clause: if variantId is provided, filter by variant, otherwise by product's variants
    const variantFilter = variantId
      ? { variantId }
      : { variant: { productId, deletedAt: null } };

    // Query non-overlapping available physical units
    const availableUnits = await prisma.inventoryUnit.findMany({
      where: {
        ...variantFilter,
        isActive: true,
        deletedAt: null,
        unitStatus: UnitStatus.Available, // Physically healthy and in shop
        transactionItems: {
          none: {
            transaction: {
              transactionStatus: { in: ACTIVE_STATUSES },
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          },
        },
      },
      select: {
        id: true,
        inventoryCode: true,
        variantId: true,
      },
    });

    // Query total active units for reference count
    const totalUnitsCount = await prisma.inventoryUnit.count({
      where: {
        ...variantFilter,
        isActive: true,
        deletedAt: null,
      },
    });

    const isAvailable = availableUnits.length >= quantity;
    let statusLevel: "available" | "limited" | "unavailable" = "available";

    if (!isAvailable) {
      statusLevel = "unavailable";
    } else if (availableUnits.length <= 2) {
      statusLevel = "limited";
    }

    let message = `Tersedia ${availableUnits.length} unit siap disewa untuk jadwal ini.`;
    if (!isAvailable) {
      message = "Seluruh unit telah dipesan atau sedang dalam masa sewa untuk rentang tanggal tersebut.";
    } else if (statusLevel === "limited") {
      message = `Stok terbatas! Hanya tersisa ${availableUnits.length} unit untuk jadwal ini.`;
    }

    return successResponse({
      isAvailable,
      availableCount: availableUnits.length,
      totalCount: totalUnitsCount,
      itemType: "rental_unit",
      statusLevel,
      message,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Gagal memeriksa ketersediaan unit",
      "INTERNAL_ERROR",
      500
    );
  }
}
