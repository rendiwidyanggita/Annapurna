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
  className,
}: CategoryCardProps) {
  const href = `${ROUTES.CATALOG}?kategori=${slug}`;

  return (
    <Link
      href={href}
      className={cn(
        // Layout — centered column
        "group flex flex-col items-center justify-center gap-2.5",
        // Sizing
        "p-4 min-w-[80px]",
        // Visual
        "rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
        "shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]",
        // Hover effects
        "hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]",
        "transition-all duration-200 ease-out",
        "hover:scale-105 active:scale-100",
        className,
      )}
      aria-label={`Lihat kategori ${name}`}
    >
      {/* Icon container */}
      <div
        className={cn(
          "flex items-center justify-center rounded-[var(--radius-md)]",
          "w-11 h-11",
          "bg-[var(--color-primary-soft)]",
          "group-hover:bg-[var(--color-primary)] transition-colors duration-200",
        )}
      >
        <HugeiconsIcon
          icon={icon}
          size={22}
          strokeWidth={1.5}
          className="text-[var(--color-primary)] group-hover:text-white transition-colors duration-200"
          color="currentColor"
        />
      </div>

      {/* Label */}
      <span className="text-xs font-semibold text-center text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors duration-200 leading-tight">
        {name}
      </span>

      {/* Optional product count */}
      {productCount !== undefined && (
        <span className="text-[10px] text-[var(--color-muted)] leading-none">
          {productCount} produk
        </span>
      )}
    </Link>
  );
}
