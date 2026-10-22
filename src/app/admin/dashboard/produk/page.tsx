import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  ShoppingBag01Icon,
  Package01Icon,
  Archive01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { ProductTable, type ProductItem } from "./product-table";
import { ProductFilterBar } from "./product-filter-bar";
import { ItemType, type Prisma } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    kategori?: string;
    tipe?: string;
    status?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Katalog Produk & Variasi — Admin ANNAPURNA",
};

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const searchQuery = resolvedParams.q?.trim() || "";
  const categoryId = resolvedParams.kategori?.trim() || "";
  const itemType = resolvedParams.tipe?.trim() as ItemType | undefined;
  const statusFilter = resolvedParams.status?.trim() || "";
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const pageSize = 10;

  // Build Prisma where filter
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
  };

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { description: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (itemType && (itemType === ItemType.rental_unit || itemType === ItemType.consumable)) {
    where.itemType = itemType;
  }

  if (statusFilter === "active") {
    where.isActive = true;
  } else if (statusFilter === "inactive") {
    where.isActive = false;
  }

  // Parallel data fetching for table and KPIs
  const [
    categories,
    totalProducts,
    products,
    totalRentalUnits,
    totalConsumables,
    inactiveProducts,
  ] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
        variants: {
          where: { deletedAt: null },
          select: {
            id: true,
            variantName: true,
            size: true,
            color: true,
            _count: {
              select: {
                units: {
                  where: { deletedAt: null, isActive: true },
                },
              },
            },
          },
        },
        media: {
          select: {
            id: true,
            mediaUrl: true,
            isPrimary: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({
      where: { deletedAt: null, itemType: ItemType.rental_unit },
    }),
    prisma.product.count({
      where: { deletedAt: null, itemType: ItemType.consumable },
    }),
    prisma.product.count({
      where: { deletedAt: null, isActive: false },
    }),
  ]);

  const totalPages = Math.ceil(totalProducts / pageSize);

  return (
    <div className="space-y-6">
      {/* ── Archetype A: KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          label="Total Produk Master"
          value={totalProducts}
          icon={ShoppingBag01Icon}
          iconColorVariant="emerald"
          subtext="Seluruh katalog aktif & arsip"
        />
        <AdminKpiCard
          label="Alat Rental (Unit Fisik)"
          value={totalRentalUnits}
          icon={Package01Icon}
          iconColorVariant="blue"
          subtext="Dilacak per kode inventaris"
        />
        <AdminKpiCard
          label="Barang Consumable"
          value={totalConsumables}
          icon={Archive01Icon}
          iconColorVariant="amber"
          subtext="Stok massal / habis pakai"
        />
        <AdminKpiCard
          label="Produk Nonaktif"
          value={inactiveProducts}
          icon={AlertCircleIcon}
          iconColorVariant={inactiveProducts > 0 ? "rose" : "neutral"}
          subtext="Tidak tampil di katalog publik"
        />
      </div>

      {/* ── Archetype A: Filter & Action Toolbar ── */}
      <ProductFilterBar
        categories={categories}
        totalProducts={totalProducts}
        primaryAction={
          <Link href="/admin/dashboard/produk/baru">
            <Button
              type="button"
              size="sm"
              className="h-9 bg-[#16624B] hover:bg-[#0F4F3C] text-white text-xs font-semibold gap-1.5 shadow-2xs"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={15} />
              <span>+ Tambah Produk</span>
            </Button>
          </Link>
        }
      />

      {/* ── Archetype A: Product Table with Health Indicators ── */}
      <ProductTable
        products={products as unknown as ProductItem[]}
        totalCount={totalProducts}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
