"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, RefreshIcon } from "@hugeicons/core-free-icons";

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductFilterBarProps {
  categories: CategoryOption[];
}

export function ProductFilterBar({ categories }: ProductFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") ?? "";
  const currentCategory = searchParams.get("kategori") ?? "";
  const currentType = searchParams.get("tipe") ?? "";
  const currentStatus = searchParams.get("status") ?? "";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 on filter change
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleReset() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasActiveFilters = currentSearch || currentCategory || currentType || currentStatus;

  return (
    <div className="bg-white p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative md:col-span-1">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <Input
            placeholder="Cari nama produk..."
            defaultValue={currentSearch}
            onChange={(e) => updateFilter("q", e.target.value)}
            className="pl-9 bg-[var(--color-surface)] border-[var(--color-border)] text-sm"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={currentCategory}
            onChange={(e) => updateFilter("kategori", e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            aria-label="Filter berdasarkan kategori"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Item Type Filter */}
        <div>
          <select
            value={currentType}
            onChange={(e) => updateFilter("tipe", e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            aria-label="Filter berdasarkan tipe barang"
          >
            <option value="">Semua Tipe</option>
            <option value="rental_unit">Rental Unit (Sewa)</option>
            <option value="consumable">Consumable (Habis Pakai)</option>
          </select>
        </div>

        {/* Status Filter & Reset */}
        <div className="flex gap-2">
          <select
            value={currentStatus}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="flex-1 h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            aria-label="Filter berdasarkan status aktif"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleReset}
              title="Reset semua filter"
              className="px-3 h-10 flex items-center justify-center rounded-md border border-[var(--color-border)] hover:bg-gray-100 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors text-xs font-medium"
            >
              <HugeiconsIcon icon={RefreshIcon} size={16} className={isPending ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
