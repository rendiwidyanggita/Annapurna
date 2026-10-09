import Link from "next/link";
import {
  HikingIcon,
  Backpack01Icon,
  SleepingIcon,
  CookingPotIcon,
  Package01Icon,
} from "@hugeicons/core-free-icons";
import { CategoryCard } from "@/components/molecules/category-card";
import { ROUTES } from "@/config/routes";

/**
 * MVP categories — hardcoded for Sprint 1.
 * Slugs match the URL query param used in /katalog?kategori={slug}.
 * Icons selected from @hugeicons/core-free-icons (verified available).
 */
const CATEGORIES = [
  {
    slug: "tenda",
    name: "Tenda",
    icon: HikingIcon,
  },
  {
    slug: "carrier",
    name: "Carrier",
    icon: Backpack01Icon,
  },
  {
    slug: "sleeping-gear",
    name: "Sleeping Gear",
    icon: SleepingIcon,
  },
  {
    slug: "alat-masak",
    name: "Alat Masak",
    icon: CookingPotIcon,
  },
  {
    slug: "paket",
    name: "Paket Camping",
    icon: Package01Icon,
  },
] as const;

/**
 * CategoryGrid — Organism that displays the 5 MVP product categories.
 *
 * Server Component. Rendered in homepage between HeroSection and ProductTabs.
 *
 * Layout:
 * - Mobile: 2-column grid
 * - Tablet: 3-column grid
 * - Desktop: 5-column grid (all categories in one row)
 */
export function CategoryGrid() {
  return (
    <section aria-label="Kategori Perlengkapan">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">
          Jelajahi Kategori
        </h2>
        <Link
          href={ROUTES.CATALOG}
          className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors duration-150"
        >
          Lihat Semua →
        </Link>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.slug}
            slug={cat.slug}
            name={cat.name}
            icon={cat.icon}
          />
        ))}
      </div>
    </section>
  );
}
