import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PackageCard } from "@/components/molecules/package-card";
import { ROUTES } from "@/config/routes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Package01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

export const metadata: Metadata = {
  title: "Katalog Paket Sewa Hemat Perlengkapan Outdoor | ANNAPURNA",
  description:
    "Pilihan paket sewa hemat perlengkapan camping dan pendakian gunung di ANNAPURNA. Bundling tenda, alat masak, dan alat tektok lengkap siap pakai.",
};

export default async function PackagesCatalogPage() {
  const packages = await prisma.package.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        include: {
          product: {
            select: { name: true },
          },
        },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Breadcrumb & Title Header ── */}
      <div className="mb-8">
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <li>
              <Link
                href={ROUTES.HOME}
                className="hover:text-[var(--color-primary)] transition-colors"
              >
                Beranda
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-[var(--color-foreground)]">
              Paket Sewa
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
              Paket Sewa Hemat
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Solusi praktis dan hemat untuk kebutuhan camping, tektok, dan petualangan outdoor kamu
            </p>
          </div>

          <Link
            href={ROUTES.CATALOG}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] self-start sm:self-auto"
          >
            <span>Sewa alat satuan</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Link>
        </div>
      </div>

      {/* ── Package Grid / Empty State ── */}
      {packages.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center max-w-md mx-auto">
          <div className="mx-auto w-12 h-12 flex items-center justify-center text-[var(--color-muted)] mb-3">
            <HugeiconsIcon icon={Package01Icon} size={32} />
          </div>
          <h2 className="text-base font-semibold text-[var(--color-foreground)]">
            Belum Ada Paket Tersedia
          </h2>
          <p className="text-xs text-[var(--color-muted)] mt-1 mb-6">
            Saat ini paket sewa sedang dalam persiapan. Kamu tetap bisa menyewa alat outdoor satuan melalui katalog kami.
          </p>
          <Link
            href={ROUTES.CATALOG}
            className="inline-flex items-center justify-center h-9 px-4 rounded-[var(--radius-md)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-medium transition-colors"
          >
            Jelajahi Katalog Satuan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      )}
    </div>
  );
}
