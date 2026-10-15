import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ItemType, type Prisma } from "@prisma/client";
import { CatalogSidebar } from "./catalog-sidebar";
import { CatalogViewContainer } from "./catalog-view-container";
import { type CatalogProduct } from "./catalog-grid";

export const metadata: Metadata = {
  title: "Katalog Perlengkapan Outdoor & Camping | ANNAPURNA",
  description:
    "Sewa perlengkapan camping dan pendakian gunung berkualitas di ANNAPURNA. Tenda dome, carrier, sleeping bag, kompor, dan alat outdoor lengkap dengan tarif hemat per durasi sewa.",
};

interface CatalogPageProps {
  searchParams: Promise<{
    q?: string;
    kategori?: string;
    tipe?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolved = await searchParams;

  const searchQuery = resolved.q?.trim() || "";
  const categoryId = resolved.kategori?.trim() || "";
  const itemType = resolved.tipe?.trim() as ItemType | undefined;
  const minPrice = resolved.minPrice ? parseInt(resolved.minPrice, 10) : undefined;
  const maxPrice = resolved.maxPrice ? parseInt(resolved.maxPrice, 10) : undefined;
  const sort = resolved.sort || "terbaru";
  const currentPage = Math.max(1, parseInt(resolved.page || "1", 10));
  const pageSize = 12;

  // Build Prisma filter
  const where: Prisma.ProductWhereInput = {
    isActive: true,
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

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Prisma.IntFilter = {};
    if (minPrice !== undefined && !isNaN(minPrice)) {
      priceFilter.gte = minPrice;
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      priceFilter.lte = maxPrice;
    }
    where.pricePermalam = priceFilter;
  }

  // Sorting logic
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "harga-asc") {
    orderBy = { pricePermalam: "asc" };
  } else if (sort === "harga-desc") {
    orderBy = { pricePermalam: "desc" };
  } else if (sort === "nama-asc") {
    orderBy = { name: "asc" };
  }

  // Parallel database execution
  const [categoriesRaw, totalProducts, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: {
              where: { isActive: true, deletedAt: null },
            },
          },
        },
      },
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
          select: { id: true, variantName: true },
        },
        media: {
          select: { id: true, mediaUrl: true, isPrimary: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const categories = categoriesRaw.map((cat) => ({
    id: cat.id,
    name: cat.name,
    productCount: cat._count.products,
  }));

  const totalPages = Math.ceil(totalProducts / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner / Title Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-primary)]">
          Katalog Perlengkapan Outdoor
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1.5 max-w-2xl">
          Temukan peralatan sewa terawat standar pendakian dan ekspedisi. Pilih durasi sewa harian atau paket kegiatan akhir pekan dengan tarif transparan.
        </p>
      </div>

      {/* Main Grid: Sidebar Desktop (3 cols) + Catalog Feed (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-3 sticky top-24 bg-white p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm">
          <CatalogSidebar categories={categories} />
        </div>

        {/* Catalog Main Feed */}
        <div className="lg:col-span-9">
          <CatalogViewContainer
            categories={categories}
            products={products as unknown as CatalogProduct[]}
            totalCount={totalProducts}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>
      </div>
    </div>
  );
}
