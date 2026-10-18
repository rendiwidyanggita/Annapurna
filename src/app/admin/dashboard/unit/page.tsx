import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { UnitTable, type InventoryUnitItem } from "./unit-table";
import { ConsumableTab, type ConsumableProductItem } from "./consumable-tab";
import { UnitTabsClient } from "./unit-tabs-client";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  try {
    await requireRole(["admin", "owner"]);
  } catch {
    redirect("/admin/dashboard");
  }

  // 1. Fetch physical rental units (exclude soft-deleted)
  const rawUnits = await prisma.inventoryUnit.findMany({
    where: { deletedAt: null },
    include: {
      variant: {
        include: {
          product: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const units: InventoryUnitItem[] = rawUnits.map((u) => ({
    id: u.id,
    inventoryCode: u.inventoryCode,
    unitStatus: u.unitStatus,
    conditionNotes: u.conditionNotes,
    updatedAt: u.updatedAt,
    variant: {
      id: u.variant.id,
      variantName: u.variant.variantName,
      size: u.variant.size,
      color: u.variant.color,
      product: {
        id: u.variant.product.id,
        name: u.variant.product.name,
      },
    },
  }));

  // 2. Fetch rental products with variants for the add unit dropdown
  const rentalProducts = await prisma.product.findMany({
    where: { itemType: "rental_unit", deletedAt: null },
    select: {
      id: true,
      name: true,
      variants: {
        where: { deletedAt: null },
        select: {
          id: true,
          variantName: true,
          size: true,
          color: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // 3. Fetch consumable products
  const rawConsumables = await prisma.product.findMany({
    where: { itemType: "consumable", deletedAt: null },
    include: {
      category: {
        select: { id: true, name: true },
      },
      media: {
        where: { isPrimary: true },
        select: { mediaUrl: true, isPrimary: true },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  const consumables: ConsumableProductItem[] = rawConsumables.map((c) => ({
    id: c.id,
    name: c.name,
    consumableStock: c.consumableStock,
    isReusable: c.isReusable,
    isActive: c.isActive,
    updatedAt: c.updatedAt,
    category: {
      id: c.category.id,
      name: c.category.name,
    },
    media: c.media.map((m) => ({
      mediaUrl: m.mediaUrl,
      isPrimary: m.isPrimary,
    })),
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">
          Inventaris & Unit Fisik
        </h1>
        <p className="text-xs text-[var(--color-muted)] mt-1">
          Kelola unit fisik peralatan camping sewaan, riwayat status teknisi, dan stok barang habis pakai (consumable).
        </p>
      </div>

      {/* Tabs Container */}
      <UnitTabsClient
        unitCount={units.length}
        consumableCount={consumables.length}
        unitsContent={<UnitTable units={units} products={rentalProducts} />}
        consumableContent={<ConsumableTab consumables={consumables} />}
      />
    </div>
  );
}
