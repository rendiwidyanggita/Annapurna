"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  Delete01Icon,
  ShoppingBag01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { DeleteProductDialog } from "./delete-product-dialog";
import { toggleProductStatus } from "./actions";

export interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  itemType: "rental_unit" | "consumable";
  pricePermalam: number;
  pricePerkegiatan1: number;
  pricePerkegiatan2: number;
  consumableStock: number;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  };
  variants: {
    id: string;
    variantName: string;
    size: string | null;
    color: string | null;
    _count?: {
      units: number;
    };
  }[];
  media: {
    id: string;
    mediaUrl: string;
    isPrimary: boolean;
  }[];
  createdAt: Date | string;
}

interface ProductTableProps {
  products: ProductItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ProductTable({
  products,
  totalCount,
  currentPage,
  totalPages,
}: ProductTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [deletingProduct, setDeletingProduct] = useState<{ id: string; name: string } | null>(
    null
  );

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  async function handleToggleStatus(productId: string) {
    startTransition(async () => {
      await toggleProductStatus(productId);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-[var(--color-surface)]">
            <TableRow className="border-b border-[var(--color-border)]">
              <TableHead className="font-semibold text-xs text-[var(--color-muted)] uppercase tracking-wider pl-4">
                Produk
              </TableHead>
              <TableHead className="font-semibold text-xs text-[var(--color-muted)] uppercase tracking-wider">
                Kategori
              </TableHead>
              <TableHead className="font-semibold text-xs text-[var(--color-muted)] uppercase tracking-wider">
                Tipe
              </TableHead>
              <TableHead className="font-semibold text-xs text-[var(--color-muted)] uppercase tracking-wider">
                Tarif Sewa
              </TableHead>
              <TableHead className="font-semibold text-xs text-[var(--color-muted)] uppercase tracking-wider">
                Variasi / Stok
              </TableHead>
              <TableHead className="font-semibold text-xs text-[var(--color-muted)] uppercase tracking-wider text-center">
                Status
              </TableHead>
              <TableHead className="font-semibold text-xs text-[var(--color-muted)] uppercase tracking-wider text-right pr-4">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center text-[var(--color-muted)] space-y-2">
                    <HugeiconsIcon icon={ShoppingBag01Icon} size={40} className="stroke-1 opacity-50" />
                    <p className="text-sm font-medium">Belum ada produk yang ditemukan.</p>
                    <p className="text-xs text-gray-400">
                      Coba sesuaikan filter pencarian atau tambahkan produk baru.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const primaryMedia =
                  product.media.find((m) => m.isPrimary) || product.media[0];

                return (
                  <TableRow
                    key={product.id}
                    className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-surface)]/60 transition-colors"
                  >
                    {/* Produk (Thumbnail + Nama) */}
                    <TableCell className="pl-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                          {primaryMedia ? (
                            <Image
                              src={primaryMedia.mediaUrl}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <HugeiconsIcon icon={ShoppingBag01Icon} size={20} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/dashboard/produk/${product.id}/edit`}
                            className="font-medium text-sm text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors line-clamp-1"
                          >
                            {product.name}
                          </Link>
                          <span className="text-xs text-[var(--color-muted)] block">
                            ID: {product.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Kategori */}
                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {product.category.name}
                      </Badge>
                    </TableCell>

                    {/* Tipe Item */}
                    <TableCell>
                      {product.itemType === "rental_unit" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Rental Unit
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Consumable
                        </span>
                      )}
                    </TableCell>

                    {/* Tarif Sewa (AA-54 preview) */}
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="font-semibold text-[var(--color-primary)]">
                          {formatRupiah(product.pricePermalam)}
                          <span className="text-[10px] text-gray-500 font-normal"> /mlm</span>
                        </div>
                        <div className="text-[11px] text-[var(--color-muted)]">
                          3H2M: {formatRupiah(product.pricePerkegiatan1)}
                        </div>
                      </div>
                    </TableCell>

                    {/* Variasi / Stok */}
                    <TableCell>
                      {product.itemType === "consumable" ? (
                        <span className="text-xs font-semibold text-gray-800">
                          Stok: {product.consumableStock} unit
                        </span>
                      ) : (
                        (() => {
                          const totalUnits = product.variants.reduce(
                            (acc, v) => acc + (v._count?.units ?? 0),
                            0
                          );
                          const variantCount =
                            product.variants.length > 0
                              ? product.variants.length
                              : 1;

                          return (
                            <div className="space-y-0.5 text-xs">
                              <span className="font-semibold text-gray-800">
                                {totalUnits} Unit Fisik
                              </span>
                              <span className="text-[11px] text-[var(--color-muted)] block">
                                ({variantCount} variasi)
                              </span>
                            </div>
                          );
                        })()
                      )}
                    </TableCell>

                    {/* Status Toggle */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => handleToggleStatus(product.id)}
                          disabled={isPending}
                          aria-label={`Ubah status ${product.name}`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            product.isActive ? "text-emerald-600" : "text-gray-400"
                          }`}
                        >
                          {product.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/dashboard/produk/${product.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-gray-100"
                            title="Edit Produk"
                          >
                            <HugeiconsIcon icon={Edit01Icon} size={16} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDeletingProduct({ id: product.id, name: product.name })
                          }
                          className="h-8 w-8 text-[var(--color-muted)] hover:text-red-600 hover:bg-red-50"
                          title="Hapus Produk"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-[var(--color-muted)]">
          <p>
            Total <span className="font-semibold text-gray-700">{totalCount}</span> produk
            (Halaman {currentPage} dari {totalPages})
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="h-8 text-xs gap-1"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
              className="h-8 text-xs gap-1"
            >
              Selanjutnya
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteProductDialog
        product={deletingProduct}
        open={!!deletingProduct}
        onOpenChange={(open) => {
          if (!open) setDeletingProduct(null);
        }}
      />
    </div>
  );
}
