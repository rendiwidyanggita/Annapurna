import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
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

  // Parallel data fetching
  const [categories, totalProducts, products] = await Promise.all([
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
  ]);

  const totalPages = Math.ceil(totalProducts / pageSize);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-primary)]">
              Manajemen Produk
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[var(--color-primary)] border border-emerald-200">
              {totalProducts} Total
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Kelola katalog alat outdoor, skema tarif durasi sewa, dan variasi unit fisik.
          </p>
        </div>

        <div>
          <Link href="/admin/dashboard/produk/baru">
            <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-sm gap-2">
              <HugeiconsIcon icon={PlusSignIcon} size={18} />
              Tambah Produk
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <ProductFilterBar categories={categories} />

      {/* Product Table */}
      <ProductTable
        products={products as unknown as ProductItem[]}
        totalCount={totalProducts}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
