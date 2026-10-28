import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StatusBadge, type StatusBadgeVariant } from "@/components/atoms";
import { ROUTES } from "@/config/routes";

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  /** Category display name */
  category: string;
  /** Thumbnail URL from Supabase storage or placeholder */
  imageUrl?: string;
  /** Starting price — harga Permalam (1 malam) */
  pricePerNight: number;
  /** Availability status for StatusBadge */
  status?: StatusBadgeVariant;
  /** Optional className for the card wrapper */
  className?: string;
}

/**
 * Format currency to Indonesian Rupiah.
 * Example: 50000 → "Rp 50.000"
 */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * ProductCard — Molecule component for displaying a product in grid/list views.
 *
 * Used in: Homepage (Terlaris/Terbaru tabs), Katalog page.
 *
 * Features:
 * - Next.js Image with 4:3 aspect ratio and blur placeholder
 * - StatusBadge overlay (top-right absolute)
 * - Two-level shadow system: shadow-card → shadow-card-hover on hover
 * - Full card is a link to product detail page
 *
 * @example
 * <ProductCard
 *   id="cuid123"
 *   slug="tenda-dome-2p"
 *   name="Tenda Dome 2 Person"
 *   category="Tenda"
 *   imageUrl="/images/products/tenda-dome.jpg"
 *   pricePerNight={75000}
 *   status="available"
 * />
 */
export function ProductCard({
  slug,
  name,
  category,
  imageUrl,
  pricePerNight,
  status = "available",
  className,
}: ProductCardProps) {
  return (
    <Link
      href={ROUTES.PRODUCT_DETAIL(slug)}
      className={cn(
        // Layout & Concentric Radius
        "group flex flex-col rounded-2xl p-2.5 sm:p-3 overflow-hidden",
        // Background & border
        "bg-white border border-black/[0.04]",
        // Shadow — multi-layer system
        "shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_10px_25px_-3px_rgba(15,23,42,0.08)]",
        // Motion & tactile feedback (no transition-all)
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "hover:-translate-y-1 active:scale-[0.98]",
        className,
      )}
      aria-label={`Lihat detail ${name}`}
    >
      {/* ── Image Container (1:1 aspect ratio with subtle black ring outline) ── */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 ring-1 ring-black/[0.06]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          // Placeholder when no image
          <div className="absolute inset-0 flex items-center justify-center bg-brand-50">
            <span className="text-brand-600 text-xs font-medium opacity-60">
              Foto belum tersedia
            </span>
          </div>
        )}

        {/* Status badge — absolute top-2.5 right-2.5 */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <StatusBadge variant={status} size="sm" dot />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col gap-1 pt-3 px-1 pb-0.5 flex-1">
        {/* Category label */}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {category}
        </span>

        {/* Product name — text-balance */}
        <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 text-balance group-hover:text-brand-600 transition-colors duration-150">
          {name}
        </h3>

        {/* Spacer pushes price to bottom */}
        <div className="flex-1 min-h-2" />

        {/* Price block */}
        <div className="mt-1 pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 leading-none mb-1">
            Mulai dari
          </p>
          <p className="text-sm sm:text-base font-bold text-brand-600 tabular-nums tracking-tight">
            {formatRupiah(pricePerNight)}
            <span className="text-[11px] font-normal text-slate-500 ml-1">
              /malam
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
