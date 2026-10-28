"use client";

import { useState } from "react";
import Link from "next/link";
import { TabSwitcher } from "@/components/atoms/tab-switcher";
import { ProductCard } from "@/components/molecules/product-card";
import type { StatusBadgeVariant } from "@/components/atoms/status-badge";
import { ROUTES } from "@/config/routes";

export interface ProductTabItem {
  id: string;
  /** Used as slug for the detail URL */
  slug: string;
  name: string;
  category: string;
  imageUrl?: string;
  pricePerNight: number;
  status: StatusBadgeVariant;
}

interface ProductTabsClientProps {
  /** Products sorted by "terlaris" proxy */
  popularProducts: ProductTabItem[];
  /** Products sorted by latest createdAt */
  latestProducts: ProductTabItem[];
}

/**
 * ProductTabsClient — Client Component for interactive tab state.
 *
 * Receives pre-fetched product data from the ProductTabs Server Component
 * parent — no DB calls here. This keeps DB access server-side only.
 */
export function ProductTabsClient({
  popularProducts,
  latestProducts,
}: ProductTabsClientProps) {
  const [activeTab, setActiveTab] = useState("terlaris");

  const products =
    activeTab === "terlaris" ? popularProducts : latestProducts;

  return (
    <div>
      {/* Tab switcher — underline style per Design.md */}
      <TabSwitcher
        tabs={[
          { key: "terlaris", label: "Terlaris" },
          { key: "terbaru", label: "Terbaru" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        aria-label="Filter tampilan produk"
        className="mb-6"
      />

      {/* Product grid or empty state */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            Belum ada produk tersedia saat ini.
          </p>
          <Link
            href={ROUTES.CATALOG}
            className="mt-3 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Lihat semua katalog →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              name={product.name}
              category={product.category}
              imageUrl={product.imageUrl}
              pricePerNight={product.pricePerNight}
              status={product.status}
            />
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-10 text-center">
        <Link
          href={ROUTES.CATALOG}
          className="inline-flex items-center justify-center h-12 px-7 rounded-xl border border-slate-200 hover:border-brand-600 text-sm font-semibold text-brand-600 hover:bg-brand-50 active:scale-[0.96] transition-[transform,background-color,border-color] duration-150 ease-out shadow-xs"
        >
          Lihat Semua Produk
        </Link>
      </div>
    </div>
  );
}
