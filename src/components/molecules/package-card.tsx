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
        // Layout
        "group flex flex-col rounded-[var(--radius-lg)] overflow-hidden",
        // Background & border
        "bg-[var(--color-surface)] border border-[var(--color-border)]",
        // Shadow & elevation
        "shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]",
        // Transition
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5",
        className,
      )}
      aria-label={`Lihat detail ${name}`}
    >
      {/* ── Banner Image ── */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-[var(--color-border-soft)]">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-primary-soft)]">
            <span className="text-[var(--color-primary)] text-xs font-medium opacity-60">
              Banner belum tersedia
            </span>
          </div>
        )}

        {/* Item count tag */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium">
          <HugeiconsIcon icon={Package01Icon} size={13} />
          <span>{itemCount} Alat Termasuk</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          <h3 className="font-semibold text-sm sm:text-base text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors duration-150 line-clamp-1">
            {name}
          </h3>

          {description && (
            <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}

          {/* Items preview */}
          {itemsPreview.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-1">
              {itemsPreview.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  className="inline-block text-[10px] px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-border-soft)] text-[var(--color-muted)] font-normal"
                >
                  {item}
                </span>
              ))}
              {itemsPreview.length > 3 && (
                <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-border-soft)] text-[var(--color-muted)]">
                  +{itemsPreview.length - 3} lagi
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Footer / Pricing ── */}
        <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[var(--color-muted)] block uppercase tracking-wider font-medium">
              Mulai dari
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-bold text-[var(--color-primary)]">
                {formatRupiah(pricePermalam)}
              </span>
              <span className="text-[10px] text-[var(--color-muted)]">
                / malam
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] group-hover:translate-x-1 transition-transform duration-200">
            <span>Detail</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}
