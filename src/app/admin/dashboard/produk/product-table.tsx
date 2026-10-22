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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/atoms/status-badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  Delete01Icon,
  ShoppingBag01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { DeleteProductDialog } from "./delete-product-dialog";
import { toggleProductStatus } from "./actions";
import { cn } from "@/lib/utils";

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

  const [deletingProduct, setDeletingProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);

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
      {/* ── Table Container (Archetype A Compact View) ── */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-[#F9FAFB]">
            <TableRow className="border-b border-[#E5E7EB]">
              <TableHead className="font-semibold text-xs text-[#6B7280] uppercase tracking-wider pl-6 py-3.5">
                Produk Info
              </TableHead>
              <TableHead className="font-semibold text-xs text-[#6B7280] uppercase tracking-wider">
                Kategori & Tipe
              </TableHead>
              <TableHead className="font-semibold text-xs text-[#6B7280] uppercase tracking-wider">
                Tarif Durasi (Permalam / K1 / K2)
              </TableHead>
              <TableHead className="font-semibold text-xs text-[#6B7280] uppercase tracking-wider">
                Kesehatan Stok / Unit
              </TableHead>
              <TableHead className="font-semibold text-xs text-[#6B7280] uppercase tracking-wider text-center">
                Status Katalog
              </TableHead>
              <TableHead className="font-semibold text-xs text-[#6B7280] uppercase tracking-wider text-right pr-6">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-[#E5E7EB]">
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center text-[#6B7280] space-y-2">
                    <HugeiconsIcon
                      icon={ShoppingBag01Icon}
                      size={36}
                      className="opacity-40"
                    />
                    <p className="text-sm font-semibold text-[#111827]">
                      Belum ada produk ditemukan
                    </p>
                    <p className="text-xs text-[#6B7280] max-w-sm">
                      Silakan sesuaikan filter pencarian atau tambahkan produk master baru.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const primaryMedia =
                  product.media.find((m) => m.isPrimary) || product.media[0];

                const isRental = product.itemType === "rental_unit";
                const totalUnits = product.variants.reduce(
                  (acc, v) => acc + (v._count?.units ?? 0),
                  0
                );
                const variantCount = Math.max(1, product.variants.length);

                // Stock Health Calculation (Archetype A)
                let stockLabel = "";
                let stockStatusVariant: "available" | "warning" | "damaged" = "available";
                let progressPercent = 0;

                if (isRental) {
                  progressPercent = Math.min(100, Math.max(15, totalUnits * 12));
                  if (totalUnits >= 4) {
                    stockLabel = `${totalUnits} Unit (Aman)`;
                    stockStatusVariant = "available";
                  } else if (totalUnits > 0) {
                    stockLabel = `${totalUnits} Unit (Menipis)`;
                    stockStatusVariant = "warning";
                  } else {
                    stockLabel = "0 Unit (Kosong)";
                    stockStatusVariant = "damaged";
                    progressPercent = 5;
                  }
                } else {
                  progressPercent = Math.min(100, (product.consumableStock / 30) * 100);
                  if (product.consumableStock >= 10) {
                    stockLabel = `${product.consumableStock} Pcs (Aman)`;
                    stockStatusVariant = "available";
                  } else if (product.consumableStock > 0) {
                    stockLabel = `${product.consumableStock} Pcs (Menipis)`;
                    stockStatusVariant = "warning";
                  } else {
                    stockLabel = "0 Pcs (Habis)";
                    stockStatusVariant = "damaged";
                    progressPercent = 5;
                  }
                }

                return (
                  <TableRow
                    key={product.id}
                    className="hover:bg-[#F9FAFB]/70 transition-colors"
                  >
                    {/* ── 1. Produk Info (Thumbnail + Name + ID) ── */}
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-[#E5E7EB] shrink-0">
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
                            className="font-bold text-sm text-[#111827] hover:text-[#16624B] transition-colors line-clamp-1 leading-snug"
                          >
                            {product.name}
                          </Link>
                          <span className="font-mono text-[11px] text-[#6B7280] block mt-0.5 tabular-nums">
                            ID: {product.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* ── 2. Kategori & Tipe ── */}
                    <TableCell className="align-middle">
                      <div className="space-y-1">
                        <span className="inline-block text-xs font-semibold text-[#111827]">
                          {product.category?.name || "Tanpa Kategori"}
                        </span>
                        <div>
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                              isRental
                                ? "bg-[#E7F3EE] text-[#16624B] border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            )}
                          >
                            {isRental ? "Rental Unit" : "Consumable"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* ── 3. Tarif Durasi Sewa (tabular-nums) ── */}
                    <TableCell className="align-middle tabular-nums">
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-[#16624B]">
                          {formatRupiah(product.pricePermalam)}
                          <span className="text-[10px] text-[#6B7280] font-normal"> /mlm</span>
                        </div>
                        <div className="text-[11px] text-[#6B7280]">
                          K1: {formatRupiah(product.pricePerkegiatan1)} | K2: {formatRupiah(product.pricePerkegiatan2)}
                        </div>
                      </div>
                    </TableCell>

                    {/* ── 4. Stok / Ketersediaan & Progress Health Bar ── */}
                    <TableCell className="align-middle tabular-nums">
                      <div className="w-36 space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-[#111827]">
                            {stockLabel}
                          </span>
                        </div>
                        {/* Health Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-300",
                              stockStatusVariant === "available" && "bg-[#16624B]",
                              stockStatusVariant === "warning" && "bg-amber-500",
                              stockStatusVariant === "damaged" && "bg-red-500"
                            )}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-[#6B7280]">
                          {isRental
                            ? `${variantCount} variasi aktif`
                            : "Stok habis pakai"}
                        </div>
                      </div>
                    </TableCell>

                    {/* ── 5. Status Katalog Toggle ── */}
                    <TableCell className="align-middle text-center">
                      <div className="inline-flex items-center gap-2">
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => handleToggleStatus(product.id)}
                          disabled={isPending}
                          aria-label={`Ubah status katalog ${product.name}`}
                        />
                        <StatusBadge
                          variant={product.isActive ? "active" : "inactive"}
                          dot
                          size="sm"
                        >
                          {product.isActive ? "Aktif" : "Nonaktif"}
                        </StatusBadge>
                      </div>
                    </TableCell>

                    {/* ── 6. Aksi ── */}
                    <TableCell className="align-middle pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/dashboard/produk/${product.id}/edit`}
                          title="Edit Produk & Variasi"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-[#6B7280] hover:text-[#16624B] hover:bg-[#E7F3EE] rounded-lg"
                          >
                            <HugeiconsIcon icon={Edit01Icon} size={15} />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeletingProduct({ id: product.id, name: product.name })
                          }
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          title="Hapus Produk"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={15} />
                          <span className="sr-only">Hapus</span>
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

      {/* ── Pagination Footer (tabular-nums) ── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-2 text-xs text-[#6B7280] tabular-nums">
          <p>
            Menampilkan halaman <strong className="text-[#111827]">{currentPage}</strong> dari{" "}
            <strong className="text-[#111827]">{totalPages}</strong> (Total {totalCount} produk)
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="h-8 text-xs gap-1 border-gray-200"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
              className="h-8 text-xs gap-1 border-gray-200"
            >
              Selanjutnya
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteProductDialog
        product={deletingProduct}
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => {
          if (!open) setDeletingProduct(null);
        }}
      />
    </div>
  );
}
