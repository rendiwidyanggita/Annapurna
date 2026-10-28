import { prisma } from "@/lib/prisma";
import { ProductTabsClient, type ProductTabItem } from "./product-tabs-client";

/**
 * ProductTabs — Server Component that fetches product data and renders
 * the interactive tab section (Terlaris / Terbaru).
 *
 * Schema notes (prisma/schema.prisma):
 * - Product has no `slug` field → use `id` as URL slug for now
 * - Product.pricePermalam → maps to pricePerNight in ProductCard
 * - ProductMedia.mediaUrl → thumbnail image URL
 * - Product.isActive → filter active products only
 *
 * Terlaris: no rental count yet → proxy with oldest products (asc id)
 * Terbaru: latest products by createdAt desc
 */
export async function ProductTabs() {
  // Fetch products with primary media
  const [latestRaw, popularRaw] = await Promise.all([
    // Terbaru: sorted by most recent
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        category: true,
        media: {
          where: { isPrimary: true },
          take: 1,
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    // Terlaris: proxy by createdAt asc (oldest = established products)
    // Will be replaced with real rental count when AA-44 is complete
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: "asc" },
      take: 8,
      include: {
        category: true,
        media: {
          where: { isPrimary: true },
          take: 1,
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ]);

  // Transform raw Prisma result to ProductTabItem shape
  const transform = (
    p: (typeof latestRaw)[number],
  ): ProductTabItem => ({
    id: p.id,
    slug: p.id, // No slug field in schema yet — use id as route param
    name: p.name,
    category: p.category?.name ?? "Produk",
    imageUrl: p.media[0]?.mediaUrl ?? undefined,
    pricePerNight: p.pricePermalam,
    status: "available",
  });

  const latestProducts = latestRaw.map(transform);
  const popularProducts = popularRaw.map(transform);

  return (
    <section aria-label="Pilihan Utama Pendaki">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
          Pilihan Utama Pendaki
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 text-pretty">
          Koleksi peralatan camping dan hiking yang paling sering disewa dan teruji di jalur pendakian
        </p>
      </div>
      <ProductTabsClient
        popularProducts={popularProducts}
        latestProducts={latestProducts}
      />
    </section>
  );
}
