"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AdminFilterToolbar } from "@/components/molecules/admin-filter-toolbar";

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductFilterBarProps {
  categories: CategoryOption[];
  totalProducts?: number;
  primaryAction?: React.ReactNode;
}

export function ProductFilterBar({
  categories,
  totalProducts,
  primaryAction,
}: ProductFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") ?? "";
  const currentCategory = searchParams.get("kategori") ?? "all";
  const currentType = searchParams.get("tipe") ?? "all";
  const currentStatus = searchParams.get("status") ?? "all";

  const [searchInput, setSearchInput] = useState(currentSearch);

  // Sync state if searchParams changes from outside (e.g. back navigation or reset)
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Debounced search update (300ms) to eliminate keystroke waterfalls
  useEffect(() => {
    if (searchInput === currentSearch) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput.trim()) {
        params.set("q", searchInput.trim());
      } else {
        params.delete("q");
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, currentSearch, pathname, router, searchParams]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
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
    setSearchInput("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasActiveFilters =
    Boolean(currentSearch) ||
    currentCategory !== "all" ||
    currentType !== "all" ||
    currentStatus !== "all";

  return (
    <AdminFilterToolbar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Cari nama atau deskripsi produk…"
      onReset={handleReset}
      isFiltered={hasActiveFilters}
      segmentedSwitcher={
        primaryAction ? (
          <div className="flex items-center gap-2">
            {primaryAction}
            {totalProducts !== undefined && (
              <span className="hidden sm:inline-block text-xs text-[#6B7280]">
                (Total <strong className="text-[#111827] tabular-nums">{totalProducts}</strong> item)
              </span>
            )}
          </div>
        ) : undefined
      }
    >
      {/* ── Category Filter ── */}
      <div>
        <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
          Kategori Produk
        </label>
        <select
          value={currentCategory}
          onChange={(e) => updateFilter("kategori", e.target.value)}
          className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-[#F9FAFB] text-xs font-medium text-gray-800 focus:outline-none focus:border-[#16624B]"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Item Type Filter ── */}
      <div>
        <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
          Tipe Inventaris
        </label>
        <select
          value={currentType}
          onChange={(e) => updateFilter("tipe", e.target.value)}
          className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-[#F9FAFB] text-xs font-medium text-gray-800 focus:outline-none focus:border-[#16624B]"
        >
          <option value="all">Semua Tipe</option>
          <option value="rental_unit">Rental Unit (Wajib Balik)</option>
          <option value="consumable">Consumable (Habis Pakai)</option>
        </select>
      </div>

      {/* ── Status Filter ── */}
      <div>
        <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
          Status Katalog
        </label>
        <select
          value={currentStatus}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-[#F9FAFB] text-xs font-medium text-gray-800 focus:outline-none focus:border-[#16624B]"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif (Tampil di Toko)</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>
    </AdminFilterToolbar>
  );
}
