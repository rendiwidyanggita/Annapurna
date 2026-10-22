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
        // Layout — centered column
        "group flex flex-col items-center justify-center gap-2.5",
        // Sizing
        "p-4 min-w-[80px]",
        // Visual
        "rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
        "shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]",
        // Hover effects: clean border highlight without colored card background
        "hover:border-[var(--color-primary)]",
        "transition-all duration-200 ease-out",
        "hover:scale-105 active:scale-100",
        className,
      )}
      aria-label={`Lihat kategori ${name}`}
    >
      {/* Icon — Clean default icon without colored background box */}
      <HugeiconsIcon
        icon={icon}
        size={28}
        strokeWidth={1.5}
        className="text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors duration-200"
        color="currentColor"
      />

      {/* Label */}
      <span className="text-xs font-semibold text-center text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors duration-200 leading-tight">
        {name}
      </span>

      {/* Optional product count */}
      {productCount !== undefined && (
        <span className="text-[10px] text-[var(--color-muted)] leading-none">
          {productCount} {unitLabel}
        </span>
      )}
    </Link>
  );
}
