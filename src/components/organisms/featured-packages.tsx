import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Package01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { prisma } from "@/lib/prisma";
import { PackageCard } from "@/components/molecules/package-card";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * FeaturedPackages — Server Component presenting bundled rental packages
 * in an Asymmetric Bento Grid (40% editorial story card, 60% package showcase).
 */
export async function FeaturedPackages() {
  const packages = await prisma.package.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    take: 3,
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

  const primaryPackage = packages[0];
  const secondaryPackages = packages.slice(1);

  const primaryItemsPreview = primaryPackage.items
    .map((item) => item.product?.name)
    .filter((name): name is string => Boolean(name));

  const primaryTotalQuantity = primaryPackage.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <section aria-label="Paket Sewa Pilihan" className="w-full">
      {/* ── Section Title Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/60 text-brand-700 text-xs font-semibold mb-2.5">
            <HugeiconsIcon icon={SparklesIcon} size={13} className="text-brand-600" />
            <span>Bundling Hemat & Praktis</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
            Paket Sewa Pilihan Pendaki
          </h2>
        </div>
        <Link
          href={ROUTES.PACKAGES}
          className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition-colors group self-start sm:self-auto"
        >
          <span>Lihat Semua Paket</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>

      {/* ── Asymmetric Bento Grid (40% Left / 60% Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ── Sisi Kiri: Editorial Story Card (5 Cols ~ 40%) ── */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl bg-gradient-to-b from-brand-50/80 via-white to-white border border-brand-100 p-6 md:p-8 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100/70 text-brand-800 text-xs font-semibold tracking-wide w-fit mb-4">
              <span>Solusi Lengkap Sekali Angkut</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance leading-tight">
              Sewa Paket Lebih Hemat & Praktis
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed text-pretty mt-3.5">
              Tidak perlu pusing memilih perlengkapan satu per satu. Dapatkan kombinasi tenda, matras empuk, sleeping bag hangat, hingga cooking set siap pakai untuk ekspedisimu.
            </p>

            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                <span className="shrink-0 text-brand-600 mt-0.5">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                </span>
                <span>Hemat biaya sewa hingga 20% dibanding sewa satuan</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                <span className="shrink-0 text-brand-600 mt-0.5">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                </span>
                <span>Kompatibilitas dan kelengkapan alat dicek sebelum diserahkan</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                <span className="shrink-0 text-brand-600 mt-0.5">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                </span>
                <span>Dikemas rapi dalam tas pelindung, siap langsung dibawa</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link
              href={ROUTES.PACKAGES}
              className={cn(
                "w-full sm:w-auto h-12 px-6 rounded-xl",
                "bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm",
                "inline-flex items-center justify-center gap-2",
                "shadow-sm hover:shadow",
                "active:scale-[0.96] transition-transform duration-150 ease-out"
              )}
            >
              <span>Jelajahi Semua Paket</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>
          </div>
        </div>

        {/* ── Sisi Kanan: Showcase Grid Paket (7 Cols ~ 60%) ── */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* ── Kartu Utama Lanskap (Hero Bento Item) ── */}
          <Link
            href={ROUTES.PACKAGE_DETAIL(primaryPackage.id)}
            className={cn(
              "group flex flex-col sm:flex-row rounded-3xl p-3 sm:p-4 gap-4 sm:gap-5",
              "bg-white border border-black/[0.04]",
              "shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_10px_25px_-3px_rgba(15,23,42,0.08)]",
              "transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 active:scale-[0.98]"
            )}
          >
            {/* Banner Image */}
            <div className="relative w-full sm:w-1/2 aspect-[16/10] sm:aspect-auto sm:min-h-[220px] rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-black/[0.06] shrink-0">
              {primaryPackage.bannerUrl ? (
                <Image
                  src={primaryPackage.bannerUrl}
                  alt={primaryPackage.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 35vw"
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-brand-50">
                  <span className="text-brand-600 text-xs font-medium opacity-60">
                    Banner belum tersedia
                  </span>
                </div>
              )}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-600/90 backdrop-blur-md text-white text-[11px] font-semibold shadow-sm">
                <span>Paling Diminati</span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md text-white text-[11px] font-medium shadow-sm">
                <HugeiconsIcon icon={Package01Icon} size={13} />
                <span className="tabular-nums">
                  {primaryTotalQuantity || primaryPackage.items.length} Alat Termasuk
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-between py-1 flex-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block mb-1">
                  Paket Utama
                </span>
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-balance line-clamp-2">
                  {primaryPackage.name}
                </h4>
                {primaryPackage.description && (
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-1.5 leading-relaxed text-pretty">
                    {primaryPackage.description}
                  </p>
                )}

                {/* Included items preview chips */}
                {primaryItemsPreview.length > 0 && (
                  <div className="pt-3 flex flex-wrap gap-1.5">
                    {primaryItemsPreview.slice(0, 4).map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-block text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium"
                      >
                        {item}
                      </span>
                    ))}
                    {primaryItemsPreview.length > 4 && (
                      <span className="inline-block text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 font-medium tabular-nums">
                        +{primaryItemsPreview.length - 4} lagi
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Price & Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-medium">
                    Mulai dari
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-bold text-brand-600 tabular-nums tracking-tight">
                      {formatRupiah(primaryPackage.pricePermalam)}
                    </span>
                    <span className="text-xs font-normal text-slate-500">
                      /malam
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform duration-200">
                  <span>Lihat Detail</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </div>
              </div>
            </div>
          </Link>

          {/* ── Kartu Sekunder (2 Kolom Subgrid) ── */}
          {secondaryPackages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              {secondaryPackages.map((pkg) => {
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
      </div>
    </section>
  );
}

/**
 * Skeleton loader for FeaturedPackages.
 */
export function FeaturedPackagesSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 h-[380px] bg-slate-100 rounded-3xl border border-slate-200" />
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="h-[200px] bg-slate-100 rounded-3xl border border-slate-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-[180px] bg-slate-100 rounded-2xl border border-slate-200" />
            <div className="h-[180px] bg-slate-100 rounded-2xl border border-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
