"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  DashboardBrowsingIcon,
  ListViewIcon,
} from "@hugeicons/core-free-icons";
import { CatalogMobileDrawer } from "./catalog-mobile-drawer";
import { type CategoryOption } from "./catalog-sidebar";

interface CatalogHeaderProps {
  categories: CategoryOption[];
  totalResults: number;
  viewMode: "grid" | "list";
  onViewChange: (mode: "grid" | "list") => void;
}

export function CatalogHeader({
  categories,
  totalResults,
  viewMode,
  onViewChange,
}: CatalogHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") ?? "";
  const currentSort = searchParams.get("sort") ?? "terbaru";

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get("q") as string)?.trim() ?? "";

    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSortChange(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
        />
        <Input
          name="q"
          placeholder="Cari tenda dome, carrier, sleeping bag, kompor portable..."
          defaultValue={currentSearch}
          className="pl-10 pr-24 h-11 bg-white border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-sm text-sm"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-semibold rounded-md"
        >
          Cari
        </Button>
      </form>

      {/* Control Strip: Results Count, Mobile Filter, Sort, View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <CatalogMobileDrawer categories={categories} />
          <p className="text-xs text-[var(--color-muted)] font-medium">
            Menampilkan <span className="font-bold text-[var(--color-foreground)]">{totalResults}</span> produk perlengkapan
          </p>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-muted)] hidden sm:inline">Urutkan:</span>
            <select
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-[var(--color-border)] bg-white text-xs text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              aria-label="Urutkan produk"
            >
              <option value="terbaru">Terbaru</option>
              <option value="harga-asc">Harga: Termurah</option>
              <option value="harga-desc">Harga: Termahal</option>
              <option value="nama-asc">Nama: A - Z</option>
            </select>
          </div>

          {/* Grid vs List View Toggle */}
          <div className="flex items-center border border-[var(--color-border)] rounded-md bg-white p-0.5">
            <button
              type="button"
              onClick={() => onViewChange("grid")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
              title="Tampilan Grid"
              aria-label="Tampilan Grid"
            >
              <HugeiconsIcon icon={DashboardBrowsingIcon} size={15} />
            </button>
            <button
              type="button"
              onClick={() => onViewChange("list")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
              title="Tampilan List"
              aria-label="Tampilan List"
            >
              <HugeiconsIcon icon={ListViewIcon} size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
