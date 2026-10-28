import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Package01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

export interface PackageCardProps {
  id: string;
  name: string;
  description?: string | null;
  bannerUrl?: string | null;
  pricePermalam: number;
  itemCount: number;
  itemsPreview?: string[];
  className?: string;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * PackageCard — Molecule component for displaying rental packages.
 *
 * Used in: Homepage featured packages section, /paket catalog page.
 *
 * Features:
 * - 16:9 banner image with subtle zoom on hover
 * - Package item count badge
 * - Included items preview chips
 * - Transparent and clean typography
 * - Direct link to package detail page
 */
export function PackageCard({
  id,
  name,
  description,
  bannerUrl,
  pricePermalam,
  itemCount,
  itemsPreview = [],
  className,
}: PackageCardProps) {
  return (
    <Link
      href={ROUTES.PACKAGE_DETAIL(id)}
      className={cn(
        // Layout & Concentric Radius
        "group flex flex-col rounded-2xl p-2.5 sm:p-3 overflow-hidden",
        // Background & border
        "bg-white border border-black/[0.04]",
        // Shadow & elevation
        "shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_10px_25px_-3px_rgba(15,23,42,0.08)]",
        // Transition & feedback
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "hover:-translate-y-1 active:scale-[0.98]",
        className,
      )}
      aria-label={`Lihat detail ${name}`}
    >
      {/* ── Banner Image with ring-1 outline ── */}
      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 ring-1 ring-black/[0.06]">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-50">
            <span className="text-brand-600 text-xs font-medium opacity-60">
              Banner belum tersedia
            </span>
          </div>
        )}

        {/* Item count tag */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md text-white text-[11px] font-medium shadow-sm">
          <HugeiconsIcon icon={Package01Icon} size={13} />
          <span className="tabular-nums">{itemCount} Alat Termasuk</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="pt-3 px-1 pb-1 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          <h3 className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-brand-600 transition-colors duration-150 line-clamp-1 text-balance">
            {name}
          </h3>

          {description && (
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed text-pretty">
              {description}
            </p>
          )}

          {/* Items preview chips */}
          {itemsPreview.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-1.5">
              {itemsPreview.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  className="inline-block text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium"
                >
                  {item}
                </span>
              ))}
              {itemsPreview.length > 3 && (
                <span className="inline-block text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 font-medium tabular-nums">
                  +{itemsPreview.length - 3} lagi
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Footer / Pricing ── */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-medium">
              Mulai dari
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-bold text-brand-600 tabular-nums tracking-tight">
                {formatRupiah(pricePermalam)}
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                /malam
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform duration-200 ease-out">
            <span>Detail</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}
