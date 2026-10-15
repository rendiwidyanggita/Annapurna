"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterIcon, RefreshIcon } from "@hugeicons/core-free-icons";

export interface CategoryOption {
  id: string;
  name: string;
  productCount: number;
}

interface CatalogSidebarProps {
  categories: CategoryOption[];
  className?: string;
  onFilterApplied?: () => void;
}

export function CatalogSidebar({
  categories,
  className = "",
  onFilterApplied,
}: CatalogSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedCategory = searchParams.get("kategori") || "";
  const selectedType = searchParams.get("tipe") || "";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";

  function handleFilterChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset pagination on filter change

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
      if (onFilterApplied) onFilterApplied();
    });
  }

  function handlePriceSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const min = formData.get("minPrice") as string;
    const max = formData.get("maxPrice") as string;

    const params = new URLSearchParams(searchParams.toString());
    if (min) params.set("minPrice", min);
    else params.delete("minPrice");

    if (max) params.set("maxPrice", max);
    else params.delete("maxPrice");

    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
      if (onFilterApplied) onFilterApplied();
    });
  }

  function handleReset() {
    startTransition(() => {
      router.push(pathname);
      if (onFilterApplied) onFilterApplied();
    });
  }

  const hasActiveFilters = Boolean(
    selectedCategory || selectedType || currentMinPrice || currentMaxPrice
  );

  return (
    <aside className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={FilterIcon} size={18} className="text-[var(--color-primary)]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-primary)]">
            Filter Katalog
          </h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-xs text-[var(--color-muted)] hover:text-red-600 transition-colors flex items-center gap-1 font-medium"
          >
            <HugeiconsIcon icon={RefreshIcon} size={13} className={isPending ? "animate-spin" : ""} />
            Reset
          </button>
        )}
      </div>

      {/* Kategori Filter */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          Kategori Alat
        </h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between text-sm cursor-pointer hover:text-[var(--color-primary)] transition-colors">
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="kategori"
                checked={!selectedCategory}
                onChange={() => handleFilterChange("kategori", "")}
                className="accent-[var(--color-primary)]"
              />
              Semua Kategori
            </span>
          </label>
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center justify-between text-sm cursor-pointer hover:text-[var(--color-primary)] transition-colors"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="kategori"
                  checked={selectedCategory === cat.id}
                  onChange={() => handleFilterChange("kategori", cat.id)}
                  className="accent-[var(--color-primary)]"
                />
                {cat.name}
              </span>
              <span className="text-xs text-[var(--color-muted)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded">
                {cat.productCount}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tipe Item Filter */}
      <div className="space-y-3 pt-4 border-t border-[var(--color-border-soft)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          Tipe Barang
        </h3>
        <div className="space-y-2">
          {[
            { id: "", label: "Semua Tipe" },
            { id: "rental_unit", label: "Rental Unit (Sewa)" },
            { id: "consumable", label: "Consumable (Habis Pakai)" },
          ].map((type) => (
            <label
              key={type.id}
              className="flex items-center gap-2 text-sm cursor-pointer hover:text-[var(--color-primary)] transition-colors"
            >
              <input
                type="radio"
                name="tipe"
                checked={selectedType === type.id}
                onChange={() => handleFilterChange("tipe", type.id)}
                className="accent-[var(--color-primary)]"
              />
              {type.label}
            </label>
          ))}
        </div>
      </div>

      {/* Rentang Harga Filter */}
      <div className="space-y-3 pt-4 border-t border-[var(--color-border-soft)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          Harga Permalam (IDR)
        </h3>
        <form onSubmit={handlePriceSubmit} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-[var(--color-muted)]">Min (Rp)</Label>
              <Input
                name="minPrice"
                type="number"
                placeholder="0"
                defaultValue={currentMinPrice}
                className="h-8 text-xs bg-[var(--color-surface)]"
              />
            </div>
            <div>
              <Label className="text-[11px] text-[var(--color-muted)]">Max (Rp)</Label>
              <Input
                name="maxPrice"
                type="number"
                placeholder="200.000"
                defaultValue={currentMaxPrice}
                className="h-8 text-xs bg-[var(--color-surface)]"
              />
            </div>
          </div>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="w-full text-xs h-8 text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
          >
            Terapkan Harga
          </Button>
        </form>
      </div>
    </aside>
  );
}
