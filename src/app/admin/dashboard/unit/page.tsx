import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { UnitTable, type InventoryUnitItem } from "./unit-table";
import { ConsumableTab, type ConsumableProductItem } from "./consumable-tab";
import { UnitTabsClient } from "./unit-tabs-client";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import {
  Package01Icon,
  CheckmarkCircle01Icon,
  Time02Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Unit & Stok — Admin ANNAPURNA",
};

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
      {/* ── Archetype A: KPI Summary Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          label="Total Aset Fisik"
          value={totalUnits}
          icon={Package01Icon}
          iconColorVariant="emerald"
          subtext="Unit teregistrasi di sistem"
        />
        <AdminKpiCard
          label="Siap Disewa (Available)"
          value={availableCount}
          icon={CheckmarkCircle01Icon}
          iconColorVariant="blue"
          subtext="Kondisi sehat di etalase toko"
        />
        <AdminKpiCard
          label="Sedang Disewa (Rented)"
          value={rentedCount}
          icon={Time02Icon}
          iconColorVariant="purple"
          subtext="Berada di tangan pelanggan"
        />
        <AdminKpiCard
          label="Perbaikan / Terkendala"
          value={maintenanceCount}
          icon={AlertCircleIcon}
          iconColorVariant={maintenanceCount > 0 ? "rose" : "neutral"}
          subtext="Maintenance, Rusak, atau Hilang"
        />
      </div>

      {/* ── Tabs Container (Rental Units vs Consumables) ── */}
      <UnitTabsClient
        unitCount={units.length}
        consumableCount={consumables.length}
        unitsContent={<UnitTable units={units} products={rentalProducts} />}
        consumableContent={<ConsumableTab consumables={consumables} />}
      />
    </div>
  );
}
