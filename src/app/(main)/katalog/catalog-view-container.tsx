"use client";

import { useState } from "react";
import { CatalogHeader } from "./catalog-header";
import { CatalogGrid, type CatalogProduct } from "./catalog-grid";
import { CatalogPagination } from "./catalog-pagination";
import { type CategoryOption } from "./catalog-sidebar";

interface CatalogViewContainerProps {
  categories: CategoryOption[];
  products: CatalogProduct[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function CatalogViewContainer({
  categories,
  products,
  totalCount,
  currentPage,
  totalPages,
}: CatalogViewContainerProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="space-y-6">
      <CatalogHeader
        categories={categories}
        totalResults={totalCount}
        viewMode={viewMode}
        onViewChange={setViewMode}
      />

      <CatalogGrid products={products} viewMode={viewMode} />

      <CatalogPagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
