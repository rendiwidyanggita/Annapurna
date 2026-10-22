import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PackageCard } from "@/components/molecules/package-card";
import { ROUTES } from "@/config/routes";

/**
 * FeaturedPackages — Server Component that queries and renders
 * the featured rental packages on the homepage per Design.md & UI-Annapurna.md.
 */
export async function FeaturedPackages() {
  const packages = await prisma.package.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    take: 4,
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (packages.length === 0) {
    return null;
  }

  return (
    <section aria-label="Paket Sewa Pilihan">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-foreground)]">
            Paket Sewa Pilihan
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] mt-1">
            Bundling alat camping lengkap dan siap pakai dengan harga lebih hemat
          </p>
        </div>
        <Link
          href={ROUTES.PACKAGES}
          className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors duration-150 whitespace-nowrap ml-4"
        >
          Lihat Semua Paket →
        </Link>
      </div>

      {/* Grid Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => {
          const itemsPreview = pkg.items
            .map((item) => item.product?.name)
            .filter((name): name is string => Boolean(name));

          const totalQuantity = pkg.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          return (
            <PackageCard
              key={pkg.id}
              id={pkg.id}
              name={pkg.name}
              description={pkg.description}
              bannerUrl={pkg.bannerUrl}
              pricePermalam={pkg.pricePermalam}
              itemCount={totalQuantity || pkg.items.length}
              itemsPreview={itemsPreview}
            />
          );
        })}
      </div>
    </section>
  );
}

/**
 * Skeleton loader for FeaturedPackages.
 */
export function FeaturedPackagesSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-48 rounded bg-[var(--color-border-soft)]" />
        <div className="h-4 w-72 rounded bg-[var(--color-border-soft)]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
          >
            <div className="aspect-[16/9] bg-[var(--color-border-soft)]" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 rounded bg-[var(--color-border-soft)]" />
              <div className="h-3 w-full rounded bg-[var(--color-border-soft)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--color-border-soft)]" />
              <div className="pt-2 border-t border-[var(--color-border)] flex justify-between items-center">
                <div className="h-4 w-20 rounded bg-[var(--color-border-soft)]" />
                <div className="h-3 w-12 rounded bg-[var(--color-border-soft)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
