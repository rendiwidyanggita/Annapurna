"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import {
  createUnitSchema,
  updateUnitSchema,
  changeUnitStatusSchema,
  deleteUnitSchema,
} from "@/schemas/inventory-unit";
import { adjustConsumableStockSchema } from "@/schemas/consumable-stock";
import { UnitStatus } from "@prisma/client";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  warning?: string | null;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

/**
 * AA-48: Create new physical inventory unit
 */
export async function createInventoryUnit(formData: FormData): Promise<ActionResponse> {
  try {
    const { user } = await requireRole(["admin", "owner"]);

    const rawData = {
      productId: formData.get("productId") as string,
      variantId: formData.get("variantId") as string,
      unitCode: (formData.get("unitCode") as string)?.trim(),
      notes: (formData.get("notes") as string)?.trim() || undefined,
    };

    const parsed = createUnitSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    // Verify product exists and is rental_unit
    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId, deletedAt: null },
      select: { itemType: true, name: true },
    });

    if (!product || product.itemType !== "rental_unit") {
      return {
        success: false,
        error: "Unit fisik hanya dapat ditambahkan untuk produk tipe rental unit.",
      };
    }

    // Check unique inventory code
    const existingCode = await prisma.inventoryUnit.findUnique({
      where: { inventoryCode: parsed.data.unitCode },
    });

    if (existingCode) {
      return {
        success: false,
        fieldErrors: { unitCode: ["Kode unit sudah digunakan, harap gunakan kode lain."] },
      };
    }

    const newUnit = await prisma.inventoryUnit.create({
      data: {
        variantId: parsed.data.variantId,
        inventoryCode: parsed.data.unitCode,
        conditionNotes: parsed.data.notes,
        unitStatus: UnitStatus.Available,
      },
    });

    // Record activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "INVENTORY_UNIT_CREATED",
        entityName: "InventoryUnit",
        entityId: newUnit.id,
        newValue: JSON.stringify({ code: newUnit.inventoryCode, variantId: newUnit.variantId }),
        description: `Menambahkan unit fisik baru: ${newUnit.inventoryCode}`,
      },
    });

    revalidatePath("/admin/dashboard/unit");
    return { success: true, data: newUnit };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menambahkan unit fisik.",
    };
  }
}

/**
 * AA-48: Update inventory unit
 */
export async function updateInventoryUnit(formData: FormData): Promise<ActionResponse> {
  try {
    const { user } = await requireRole(["admin", "owner"]);

    const rawData = {
      id: formData.get("id") as string,
      productId: formData.get("productId") as string,
      variantId: formData.get("variantId") as string,
      unitCode: (formData.get("unitCode") as string)?.trim(),
      notes: (formData.get("notes") as string)?.trim() || undefined,
    };

    const parsed = updateUnitSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const unit = await prisma.inventoryUnit.findUnique({
      where: { id: parsed.data.id, deletedAt: null },
    });

    if (!unit) {
      return { success: false, error: "Unit fisik tidak ditemukan." };
    }

    if (parsed.data.unitCode && parsed.data.unitCode !== unit.inventoryCode) {
      const codeDuplicate = await prisma.inventoryUnit.findUnique({
        where: { inventoryCode: parsed.data.unitCode },
      });
      if (codeDuplicate) {
        return {
          success: false,
          fieldErrors: { unitCode: ["Kode unit sudah digunakan."] },
        };
      }
    }

    const updated = await prisma.inventoryUnit.update({
      where: { id: parsed.data.id },
      data: {
        inventoryCode: parsed.data.unitCode ?? unit.inventoryCode,
        variantId: parsed.data.variantId ?? unit.variantId,
        conditionNotes: parsed.data.notes !== undefined ? parsed.data.notes : unit.conditionNotes,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "INVENTORY_UNIT_UPDATED",
        entityName: "InventoryUnit",
        entityId: updated.id,
        oldValue: JSON.stringify({ code: unit.inventoryCode }),
        newValue: JSON.stringify({ code: updated.inventoryCode }),
        description: `Mengupdate unit fisik ${updated.inventoryCode}`,
      },
    });

    revalidatePath("/admin/dashboard/unit");
    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengupdate unit fisik.",
    };
  }
}

/**
 * AA-48: Change unit physical status with mandatory reason notes and audit trail
 */
export async function changeUnitStatus(
  id: string,
  newStatus: string,
  notes: string
): Promise<ActionResponse> {
  try {
    const { user } = await requireRole(["admin", "owner"]);

    const parsed = changeUnitStatusSchema.safeParse({ id, newStatus, notes });
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    // Check if unit is in an active overlapping transaction
    const activeTxItem = await prisma.rentalTransactionItem.findFirst({
      where: {
        unitId: id,
        transaction: {
          transactionStatus: {
            in: ["Sedang_Disewa", "Siap_Diambil", "Dikonfirmasi"],
          },
        },
      },
      include: {
        transaction: {
          select: { transactionCode: true, transactionStatus: true },
        },
      },
    });

    const targetStatus = parsed.data.newStatus as UnitStatus;

    const result = await prisma.$transaction(async (tx) => {
      const unit = await tx.inventoryUnit.findUniqueOrThrow({
        where: { id },
      });

      // Update unit status
      const updatedUnit = await tx.inventoryUnit.update({
        where: { id },
        data: {
          unitStatus: targetStatus,
        },
      });

      // Insert audit trail into unit_status_logs
      await tx.unitStatusLog.create({
        data: {
          unitId: id,
          previousStatus: unit.unitStatus,
          newStatus: targetStatus,
          notes: parsed.data.notes,
          changedBy: user.id,
        },
      });

      // Generic ActivityLog
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "UNIT_STATUS_CHANGED",
          entityName: "InventoryUnit",
          entityId: id,
          oldValue: unit.unitStatus,
          newValue: targetStatus,
          description: `Perubahan status unit ${unit.inventoryCode}: ${unit.unitStatus} -> ${targetStatus}. Alasan: ${parsed.data.notes}`,
        },
      });

      return updatedUnit;
    });

    revalidatePath("/admin/dashboard/unit");

    const warning = activeTxItem
      ? `Perhatian: Unit ini sedang terkait transaksi aktif (${activeTxItem.transaction.transactionCode} - Status: ${activeTxItem.transaction.transactionStatus}). Perubahan status dapat mempengaruhi ketersediaan rental.`
      : null;

    return {
      success: true,
      data: result,
      warning,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengubah status unit.",
    };
  }
}

/**
 * AA-48: Delete inventory unit (Soft-delete if has transaction history, hard-delete otherwise)
 */
export async function deleteInventoryUnit(id: string): Promise<ActionResponse> {
  try {
    const { user } = await requireRole(["admin", "owner"]);

    const parsed = deleteUnitSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: "ID unit tidak valid." };
    }

    const unit = await prisma.inventoryUnit.findUnique({
      where: { id: parsed.data.id },
      include: {
        transactionItems: { take: 1 },
      },
    });

    if (!unit) {
      return { success: false, error: "Unit tidak ditemukan." };
    }

    // Check if unit has any transaction history
    const hasTxHistory = unit.transactionItems.length > 0;

    if (hasTxHistory) {
      // Soft-delete to preserve transaction references & foreign keys
      await prisma.inventoryUnit.update({
        where: { id: parsed.data.id },
        data: {
          deletedAt: new Date(),
          isActive: false,
          unitStatus: UnitStatus.Inactive,
        },
      });
    } else {
      // Hard delete if never used
      await prisma.inventoryUnit.delete({
        where: { id: parsed.data.id },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "INVENTORY_UNIT_DELETED",
        entityName: "InventoryUnit",
        entityId: parsed.data.id,
        oldValue: JSON.stringify({ code: unit.inventoryCode, softDeleted: hasTxHistory }),
        description: `Menghapus unit fisik ${unit.inventoryCode} (${hasTxHistory ? "Soft Delete" : "Hard Delete"})`,
      },
    });

    revalidatePath("/admin/dashboard/unit");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus unit fisik.",
    };
  }
}

/**
 * AA-48: Get last 3 status change logs for a unit
 */
export async function getUnitStatusLogs(unitId: string) {
  try {
    await requireRole(["admin", "owner"]);

    const logs = await prisma.unitStatusLog.findMany({
      where: { unitId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        changedByUser: {
          select: {
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    return { success: true, data: logs };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memuat log status unit.",
    };
  }
}

/**
 * AA-49: Adjust consumable stock using delta inside database transaction (anti-race condition)
 */
export async function adjustConsumableStock(
  productId: string,
  delta: number,
  notes: string
): Promise<ActionResponse> {
  try {
    const { user } = await requireRole(["admin", "owner"]);

    const parsed = adjustConsumableStockSchema.safeParse({ productId, delta, notes });
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({
        where: { id: productId, deletedAt: null },
      });

      if (product.itemType !== "consumable") {
        throw new Error("Produk ini bukan tipe consumable.");
      }

      const newStock = product.consumableStock + parsed.data.delta;
      if (newStock < 0) {
        throw new Error("Stok hasil penyesuaian tidak boleh bernilai negatif.");
      }

      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          consumableStock: newStock,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "CONSUMABLE_STOCK_ADJUSTED",
          entityName: "Product",
          entityId: productId,
          oldValue: String(product.consumableStock),
          newValue: String(newStock),
          description: `Penyesuaian stok ${product.name} (Delta: ${parsed.data.delta > 0 ? "+" : ""}${parsed.data.delta}, Sisa: ${newStock}). Catatan: ${parsed.data.notes}`,
        },
      });

      return updated;
    });

    revalidatePath("/admin/dashboard/unit");
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyesuaikan stok consumable.",
    };
  }
}
