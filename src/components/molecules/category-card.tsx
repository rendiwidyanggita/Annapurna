import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import type { HugeiconsIconProps } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

/** Type for passing a Hugeicons icon data as prop */
type IconSvgElement = HugeiconsIconProps["icon"];

export interface CategoryCardProps {
  /** Unique slug used to build the catalog filter URL */
  slug: string;
  /** Display name of the category */
  name: string;
  /** Hugeicons icon data from @hugeicons/core-free-icons */
  icon: IconSvgElement;
  /** Optional product count to display */
  productCount?: number;
  /** Optional custom href override */
  href?: string;
  /** Optional className override */
  className?: string;
}

/**
 * CategoryCard — Molecule for displaying a product category.
 *
 * Used in: Homepage category grid section.
 * Clicking navigates to /katalog?kategori={slug}.
 *
 * Design: centered icon + label, hover scale-105, primary soft background on hover.
 *
 * @example
 * import { Tent01Icon } from "@hugeicons/core-free-icons";
 *
 * <CategoryCard
 *   slug="tenda"
 *   name="Tenda"
 *   icon={Tent01Icon}
 *   productCount={12}
 * />
 */
export function CategoryCard({
  slug,
  name,
  icon,
  productCount,
  href,
  className,
}: CategoryCardProps) {
  const targetHref =
    href || (slug === "paket" ? ROUTES.PACKAGES : `${ROUTES.CATALOG}?kategori=${slug}`);
  const unitLabel = slug === "paket" ? "paket" : "produk";

  return (
    <Link
      href={targetHref}
      className={cn(
        // Layout — centered column with concentric padding
        "group flex flex-col items-center justify-center gap-2.5 p-3.5 sm:p-4 min-w-[80px]",
        // Concentric Radius & Surfaces
        "rounded-2xl bg-white",
        "border border-black/[0.04] hover:border-brand-600/40",
        "shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_10px_25px_-3px_rgba(15,23,42,0.08)]",
        // Transition & tactile feedback
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "hover:-translate-y-1 active:scale-[0.96]",
        className,
      )}
      aria-label={`Lihat kategori ${name}`}
    >
      {/* Inner Icon Container with concentric rounded-xl */}
      <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-brand-50 flex items-center justify-center transition-colors duration-200">
        <HugeiconsIcon
          icon={icon}
          size={24}
          strokeWidth={1.5}
          className="text-slate-700 group-hover:text-brand-600 transition-colors duration-200"
          color="currentColor"
        />
      </div>

      {/* Label */}
      <span className="text-xs font-semibold text-center text-slate-800 group-hover:text-brand-600 transition-colors duration-200 leading-tight">
        {name}
      </span>

      {/* Optional product count with tabular-nums */}
      {productCount !== undefined && (
        <span className="text-[10px] text-slate-500 leading-none tabular-nums font-medium">
          {productCount} {unitLabel}
        </span>
      )}
    </Link>
  );
}
