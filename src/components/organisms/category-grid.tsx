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
import { prisma } from "@/lib/prisma";

/**
 * MVP categories configuration.
 * Slugs match query param or route.
 * categoryMatcher is used to match DB category names.
 */
const CATEGORIES = [
  {
    slug: "tenda",
    name: "Tenda",
    categoryMatcher: "tenda",
    icon: HikingIcon,
  },
  {
    slug: "carrier",
    name: "Carrier",
    categoryMatcher: "carrier",
    icon: Backpack01Icon,
  },
  {
    slug: "sleeping-gear",
    name: "Sleeping Gear",
    categoryMatcher: "sleeping gear",
    icon: SleepingIcon,
  },
  {
    slug: "alat-masak",
    name: "Alat Masak",
    categoryMatcher: "cooking",
    icon: CookingPotIcon,
  },
  {
    slug: "paket",
    name: "Paket Camping",
    categoryMatcher: "paket",
    icon: Package01Icon,
  },
] as const;

/**
 * CategoryGrid — Organism that displays the 5 MVP product categories with live item counts.
 *
 * Server Component. Rendered in homepage between HeroSection and ProductTabs.
 */
export async function CategoryGrid() {
  const [categoriesRaw, packageCount] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: {
              where: { isActive: true, deletedAt: null },
            },
          },
        },
      },
    }),
    prisma.package.count({
      where: { isActive: true, deletedAt: null },
    }),
  ]);

  const getCount = (matcher: string): number => {
    if (matcher === "paket") return packageCount;
    const cat = categoriesRaw.find((c) =>
      c.name.toLowerCase().includes(matcher.toLowerCase()),
    );
    return cat?._count.products ?? 0;
  };

  return (
    <section aria-label="Kategori Perlengkapan">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
            Jelajahi Kategori
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 text-pretty">
            Peralatan pendakian berkualitas terbagi berdasarkan kebutuhanmu
          </p>
        </div>
        <Link
          href={ROUTES.CATALOG}
          className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition-colors duration-150"
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
            productCount={getCount(cat.categoryMatcher)}
          />
        ))}
      </div>
    </section>
  );
}
