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
  AlertCircleIcon,
  Loading01Icon,
  Cancel01Icon,
  Package01Icon,
} from "@hugeicons/core-free-icons";
import { AdminFilterToolbar } from "@/components/molecules/admin-filter-toolbar";
import { StatusBadge } from "@/components/atoms/status-badge";
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
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>("ALL");
  const [targetProduct, setTargetProduct] = useState<ConsumableProductItem | null>(null);
  const [delta, setDelta] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filtered = consumables.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedStockFilter === "CRITICAL") return c.consumableStock <= 3;
    if (selectedStockFilter === "LOW") return c.consumableStock > 3 && c.consumableStock <= 10;
    if (selectedStockFilter === "SAFE") return c.consumableStock > 10;

    return true;
  });

  const isFiltered = searchTerm.trim().length > 0 || selectedStockFilter !== "ALL";

  function handleReset() {
    setSearchTerm("");
    setSelectedStockFilter("ALL");
  }

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
      {/* ── Filter Toolbar ── */}
      <AdminFilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari produk consumable atau kategori..."
        isFiltered={isFiltered}
        onReset={handleReset}
      >
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Filter Batas Stok
          </label>
          <select
            value={selectedStockFilter}
            onChange={(e) => setSelectedStockFilter(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-[#F9FAFB] text-xs font-medium text-gray-800 focus:outline-none focus:border-[#16624B]"
          >
            <option value="ALL">Semua Batas Stok ({consumables.length})</option>
            <option value="CRITICAL">Kritis / Menipis (≤ 3 Unit)</option>
            <option value="LOW">Waspada (4 - 10 Unit)</option>
            <option value="SAFE">Aman (&gt; 10 Unit)</option>
          </select>
        </div>
      </AdminFilterToolbar>

      {/* ── Table (Archetype A) ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Produk Habis Pakai</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Karakteristik Stok</th>
                <th className="py-3 px-4">Stok Tersedia</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <p className="font-semibold text-gray-700 mb-1">Tidak ada produk consumable ditemukan</p>
                    <p className="text-[11px]">Coba sesuaikan kata kunci pencarian Anda.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const thumbnail = item.media[0]?.mediaUrl;
                  const isCritical = item.consumableStock <= 3;
                  const isLow = item.consumableStock > 3 && item.consumableStock <= 10;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                            {thumbnail ? (
                              <Image
                                src={thumbnail}
                                alt={item.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <HugeiconsIcon icon={Package01Icon} size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono tabular-nums">
                              ID: {item.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-medium">
                        {item.category.name}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.isReusable ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Returnable (Bisa Kembali)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Jual Putus (Retail)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-[130px]">
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`font-bold tabular-nums ${
                                isCritical
                                  ? "text-red-600"
                                  : isLow
                                  ? "text-amber-600"
                                  : "text-[#16624B]"
                              }`}
                            >
                              {item.consumableStock} unit
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {isCritical ? "Kritis" : isLow ? "Waspada" : "Aman"}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isCritical
                                  ? "bg-red-500"
                                  : isLow
                                  ? "bg-amber-500"
                                  : "bg-[#16624B]"
                              }`}
                              style={{
                                width: `${Math.min(100, Math.max(12, item.consumableStock * 5))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          variant={item.isActive ? "active" : "inactive"}
                          size="sm"
                          dot
                        >
                          {item.isActive ? "Aktif" : "Nonaktif"}
                        </StatusBadge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAdjust(item)}
                          className="h-7 text-[11px] px-2.5 font-semibold text-[#16624B] border-[#16624B]/30 hover:bg-[#16624B]/10 transition-colors"
                        >
                          <HugeiconsIcon icon={RefreshIcon} size={13} className="mr-1" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#E5E7EB] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Sesuaikan Stok Consumable
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Produk: <span className="font-semibold text-gray-800">{targetProduct.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTargetProduct(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Current stock and preview */}
              <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs">
                <div>
                  <p className="text-gray-500 text-[11px] font-medium">Stok Saat Ini</p>
                  <p className="text-lg font-bold text-gray-900 tabular-nums">
                    {targetProduct.consumableStock} unit
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[11px] font-medium">Estimasi Stok Baru</p>
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      targetProduct.consumableStock + delta < 0
                        ? "text-red-600"
                        : "text-[#16624B]"
                    }`}
                  >
                    {targetProduct.consumableStock + delta} unit
                  </p>
                </div>
              </div>

              {/* Delta Adjustment */}
              <div className="space-y-1.5">
                <Label htmlFor="deltaInput" className="text-xs font-semibold text-gray-700">
                  Jumlah Penyesuaian (+ Tambah Stok / - Kurangi Stok)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="deltaInput"
                    type="number"
                    value={delta}
                    onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
                    disabled={isPending}
                    className="text-sm font-semibold tabular-nums"
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setDelta((prev) => prev + 5)}
                      className="text-xs h-9 px-2.5 font-semibold text-gray-700 tabular-nums"
                    >
                      +5
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setDelta((prev) => prev - 1)}
                      className="text-xs h-9 px-2.5 font-semibold text-gray-700 tabular-nums"
                    >
                      -1
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500">
                  Gunakan angka positif untuk restock barang masuk, atau angka negatif untuk barang rusak/kedaluwarsa.
                </p>
              </div>

              {/* Mandatory Reason Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="adjustNotes" className="text-xs font-semibold text-gray-700">
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
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setTargetProduct(null)}
                  className="text-xs h-9"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || delta === 0 || !notes.trim()}
                  className="bg-[#16624B] hover:bg-[#0F4F3C] text-white text-xs font-semibold h-9 px-4 flex items-center gap-1.5 shadow-2xs"
                >
                  {isPending && <HugeiconsIcon icon={Loading01Icon} size={15} className="animate-spin" />}
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

