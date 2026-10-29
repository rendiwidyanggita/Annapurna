"use client";

import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/molecules/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBag01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { ROUTES } from "@/config/routes";

export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  itemType: "rental_unit" | "consumable";
  pricePermalam: number;
  pricePerkegiatan1: number;
  pricePerkegiatan2: number;
  category: {
    id: string;
    name: string;
  };
  media: {
    id: string;
    mediaUrl: string;
    isPrimary: boolean;
  }[];
  variants: {
    id: string;
    variantName: string;
  }[];
  availableUnitsCount?: number;
}

interface CatalogGridProps {
  products: CatalogProduct[];
  viewMode: "grid" | "list";
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CatalogGrid({ products, viewMode }: CatalogGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm space-y-4 my-6">
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center text-[var(--color-primary)]">
          <HugeiconsIcon icon={ShoppingBag01Icon} size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[var(--color-foreground)]">
            Produk Tidak Ditemukan
          </h3>
          <p className="text-xs text-[var(--color-muted)] max-w-sm">
            Tidak ada perlengkapan yang cocok dengan kriteria filter atau kata kunci pencarian Anda.
          </p>
        </div>
        <Link href="/katalog">
          <Button variant="outline" size="sm" className="text-xs">
            Hapus Semua Filter
          </Button>
        </Link>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {products.map((product) => {
          const primaryMedia =
            product.media.find((m) => m.isPrimary) || product.media[0];

          return (
            <div
              key={product.id}
              className="group flex flex-col sm:flex-row bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Image Container */}
              <div className="relative w-full sm:w-56 aspect-[4/3] sm:aspect-auto bg-gray-100 shrink-0">
                {primaryMedia ? (
                  <Image
                    src={primaryMedia.mediaUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 224px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <HugeiconsIcon icon={ShoppingBag01Icon} size={32} />
                  </div>
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-[var(--color-primary)] border border-gray-200">
                  {product.category.name}
                </span>
              </div>

              {/* Details & Pricing */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                      <Link href={ROUTES.PRODUCT_DETAIL(product.id)}>
                        {product.name}
                      </Link>
                    </h3>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {product.itemType === "rental_unit" ? "Rental Unit" : "Consumable"}
                    </Badge>
                  </div>

                  {product.description && (
                    <p className="text-xs text-[var(--color-muted)] mt-1.5 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Duration Pricing Comparison */}
                <div className="mt-4 pt-3 border-t border-[var(--color-border-soft)] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--color-muted)] block">
                        Permalam (1 Malam)
                      </span>
                      <span className="font-bold text-[var(--color-primary)]">
                        {formatRupiah(product.pricePermalam)}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-gray-200" />
                    <div>
                      <span className="text-[10px] text-[var(--color-muted)] block">
                        Perkegiatan I (3H3M)
                      </span>
                      <span className="font-semibold text-gray-700">
                        {formatRupiah(product.pricePerkegiatan1)}
                      </span>
                    </div>
                  </div>

                  <Link href={ROUTES.PRODUCT_DETAIL(product.id)}>
                    <Button
                      size="sm"
                      className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs gap-1 h-8 px-3"
                    >
                      Lihat Detail
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Grid Mode
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {products.map((product) => {
        const primaryMedia =
          product.media.find((m) => m.isPrimary) || product.media[0];

        return (
          <ProductCard
            key={product.id}
            id={product.id}
            slug={product.id}
            name={product.name}
            category={product.category.name}
            imageUrl={primaryMedia?.mediaUrl}
            pricePerNight={product.pricePermalam}
            status="available"
          />
        );
      })}
    </div>
  );
}
