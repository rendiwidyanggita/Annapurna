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
        // Layout
        "group flex flex-col rounded-[var(--radius-lg)] overflow-hidden",
        // Background & border
        "bg-[var(--color-surface)] border border-[var(--color-border)]",
        // Shadow — two-level system from Design.md
        "shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]",
        // Transition
        "transition-all duration-200 ease-out",
        // Hover lift
        "hover:-translate-y-0.5",
        className,
      )}
      aria-label={`Lihat detail ${name}`}
    >
      {/* ── Image Container ── */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-[var(--color-border-soft)]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // Placeholder when no image
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-primary-soft)]">
            <span className="text-[var(--color-primary)] text-xs font-medium opacity-60">
              Foto belum tersedia
            </span>
          </div>
        )}

        {/* Status badge — absolute top-right */}
        <div className="absolute top-2 right-2">
          <StatusBadge variant={status} size="sm" dot />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col gap-1 p-3 flex-1">
        {/* Category label */}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {category}
        </span>

        {/* Product name — max 2 lines */}
        <h3 className="text-sm font-semibold text-[var(--color-foreground)] leading-snug line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors duration-150">
          {name}
        </h3>

        {/* Spacer pushes price to bottom */}
        <div className="flex-1" />

        {/* Price */}
        <div className="mt-2 pt-2 border-t border-[var(--color-border-soft)]">
          <p className="text-[11px] text-[var(--color-muted)] leading-none mb-0.5">
            Mulai dari
          </p>
          <p className="text-sm font-bold text-[var(--color-primary)]">
            {formatRupiah(pricePerNight)}
            <span className="text-[11px] font-normal text-[var(--color-muted)] ml-0.5">
              /malam
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
