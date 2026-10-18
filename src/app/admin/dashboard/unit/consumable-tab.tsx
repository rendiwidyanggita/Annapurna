"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RefreshIcon,
  Search01Icon,
  AlertCircleIcon,
  Loading01Icon,
  Cancel01Icon,
  Package01Icon,
} from "@hugeicons/core-free-icons";
import { adjustConsumableStock } from "./actions";

export interface ConsumableProductItem {
  id: string;
  name: string;
  consumableStock: number;
  isReusable: boolean;
  isActive: boolean;
  updatedAt: Date | string;
  category: {
    id: string;
    name: string;
  };
  media: Array<{
    mediaUrl: string;
    isPrimary: boolean;
  }>;
}

interface ConsumableTabProps {
  consumables: ConsumableProductItem[];
}

export function ConsumableTab({ consumables }: ConsumableTabProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [targetProduct, setTargetProduct] = useState<ConsumableProductItem | null>(null);
  const [delta, setDelta] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filtered = consumables.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleOpenAdjust(product: ConsumableProductItem) {
    setTargetProduct(product);
    setDelta(1);
    setNotes("");
    setErrorMessage(null);
  }

  function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetProduct) return;
    setErrorMessage(null);

    if (delta === 0) {
      setErrorMessage("Jumlah penyesuaian tidak boleh nol (0).");
      return;
    }

    if (!notes.trim()) {
      setErrorMessage("Catatan alasan penyesuaian stok wajib diisi.");
      return;
    }

    const estimated = targetProduct.consumableStock + delta;
    if (estimated < 0) {
      setErrorMessage("Stok akhir tidak boleh bernilai negatif.");
      return;
    }

    startTransition(async () => {
      const res = await adjustConsumableStock(targetProduct.id, delta, notes.trim());
      if (res.success) {
        setTargetProduct(null);
      } else {
        setErrorMessage(res.error || "Gagal menyesuaikan stok consumable.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
          />
          <Input
            placeholder="Cari produk consumable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="text-xs text-[var(--color-muted)]">
          Total {consumables.length} item stok habis pakai / consumable
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-[var(--color-border)] text-[var(--color-muted)] font-semibold">
              <tr>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Karakteristik Stok</th>
                <th className="py-3 px-4">Stok Tersedia</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--color-muted)]">
                    Tidak ada produk consumable yang terdaftar.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const thumbnail = item.media[0]?.mediaUrl;
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                            {thumbnail ? (
                              <Image
                                src={thumbnail}
                                alt={item.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                <HugeiconsIcon icon={Package01Icon} className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-800">{item.name}</p>
                            <p className="text-[11px] text-[var(--color-muted)]">
                              ID: {item.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-600 font-medium">
                        {item.category.name}
                      </td>
                      <td className="py-3 px-4">
                        {item.isReusable ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Dapat Digunakan Kembali (Returnable)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Sekali Pakai (Retail / Jual Putus)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-sm">
                        <span
                          className={
                            item.consumableStock <= 3
                              ? "text-red-600"
                              : item.consumableStock <= 10
                              ? "text-amber-600"
                              : "text-emerald-700"
                          }
                        >
                          {item.consumableStock} unit
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.isActive ? (
                          <span className="inline-flex items-center text-emerald-700 gap-1 text-[11px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-neutral-400 gap-1 text-[11px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                            Non-aktif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAdjust(item)}
                          className="h-7 text-[11px] px-2.5 text-[var(--color-primary)] border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5"
                        >
                          <HugeiconsIcon icon={RefreshIcon} className="w-3 h-3 mr-1" />
                          Sesuaikan Stok
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {targetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[var(--color-border)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-foreground)]">
                  Sesuaikan Stok Consumable
                </h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Produk: <span className="font-semibold text-neutral-800">{targetProduct.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTargetProduct(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Current stock and preview */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-[var(--color-border)] flex items-center justify-between text-xs">
                <div>
                  <p className="text-[var(--color-muted)]">Stok Saat Ini</p>
                  <p className="text-base font-bold text-neutral-800">{targetProduct.consumableStock}</p>
                </div>
                <div className="text-right">
                  <p className="text-[var(--color-muted)]">Estimasi Stok Baru</p>
                  <p
                    className={`text-base font-bold ${
                      targetProduct.consumableStock + delta < 0
                        ? "text-red-600"
                        : "text-[var(--color-primary)]"
                    }`}
                  >
                    {targetProduct.consumableStock + delta}
                  </p>
                </div>
              </div>

              {/* Delta Adjustment */}
              <div className="space-y-1.5">
                <Label htmlFor="deltaInput" className="text-xs font-semibold">
                  Jumlah Penyesuaian (+ Tambah Stok / - Kurangi Stok)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="deltaInput"
                    type="number"
                    value={delta}
                    onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
                    disabled={isPending}
                    className="text-sm font-semibold"
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setDelta((prev) => prev + 5)}
                      className="text-xs h-9 px-2"
                    >
                      +5
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setDelta((prev) => prev - 1)}
                      className="text-xs h-9 px-2"
                    >
                      -1
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--color-muted)]">
                  Gunakan angka positif untuk restock barang masuk, atau angka negatif untuk barang rusak/kedaluwarsa.
                </p>
              </div>

              {/* Mandatory Reason Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="adjustNotes" className="text-xs font-semibold">
                  Catatan Alasan Penyesuaian <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="adjustNotes"
                  rows={3}
                  placeholder="Contoh: Penerimaan restock 20 kaleng gas dari supplier..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isPending}
                  required
                  className="text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setTargetProduct(null)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || delta === 0 || !notes.trim()}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs flex items-center gap-1.5"
                >
                  {isPending && <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin" />}
                  Simpan Penyesuaian
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
