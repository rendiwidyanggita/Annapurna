"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AdminFilterToolbar } from "@/components/molecules/admin-filter-toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        <Select
          value={currentCategory}
          onValueChange={(val) => updateFilter("kategori", val)}
        >
          <SelectTrigger className="h-9 text-xs bg-[#F9FAFB] border-gray-200">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Item Type Filter ── */}
      <div>
        <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
          Tipe Inventaris
        </label>
        <Select
          value={currentType}
          onValueChange={(val) => updateFilter("tipe", val)}
        >
          <SelectTrigger className="h-9 text-xs bg-[#F9FAFB] border-gray-200">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="rental_unit">Rental Unit (Wajib Balik)</SelectItem>
            <SelectItem value="consumable">Consumable (Habis Pakai)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Status Filter ── */}
      <div>
        <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
          Status Katalog
        </label>
        <Select
          value={currentStatus}
          onValueChange={(val) => updateFilter("status", val)}
        >
          <SelectTrigger className="h-9 text-xs bg-[#F9FAFB] border-gray-200">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif (Tampil di Toko)</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </AdminFilterToolbar>
  );
}
