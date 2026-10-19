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

  // Calculate unit health metrics
  const totalUnits = units.length;
  const availableCount = units.filter((u) => u.unitStatus === "Available").length;
  const rentedCount = units.filter((u) => u.unitStatus === "Rented").length;
  const maintenanceCount = units.filter(
    (u) => u.unitStatus !== "Available" && u.unitStatus !== "Rented"
  ).length;

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

      {/* Inventory Health & Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-white shadow-xs">
          <div className="text-[11px] font-medium text-[var(--color-muted)]">Total Aset Fisik</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{totalUnits}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Unit terdaftar di sistem</div>
        </div>
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-800">Siap Disewa</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{availableCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Kondisi sehat di toko</div>
        </div>
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 shadow-xs">
          <div className="text-[11px] font-medium text-blue-800">Sedang Disewa</div>
          <div className="text-xl font-bold text-blue-700 mt-1">{rentedCount}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Unit di tangan penyewa</div>
        </div>
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 shadow-xs">
          <div className="text-[11px] font-medium text-amber-800">Perbaikan / Terkendala</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{maintenanceCount}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Maintenance / Hilang</div>
        </div>
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
