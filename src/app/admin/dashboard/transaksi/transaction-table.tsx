"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  TransactionStatusBadge,
  PaymentStatusBadge,
  GuaranteeStatusBadge,
} from "@/components/atoms/status-badge";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import { AdminFilterToolbar } from "@/components/molecules/admin-filter-toolbar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Invoice01Icon,
  Package01Icon,
  Time02Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  EyeIcon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { TransactionStatus, PaymentStatus, GuaranteeStatus } from "@prisma/client";

export interface TransactionListItem {
  id: string;
  transactionCode: string;
  startDate: Date | string;
  endDate: Date | string;
  totalDurationDays: number;
  totalAmount: number;
  dpAmount: number;
  remainingAmount: number;
  transactionStatus: TransactionStatus;
  paymentStatus: PaymentStatus;
  guaranteeStatus: GuaranteeStatus;
  guaranteeDocType?: string | null;
  createdAt: Date | string;
  user: {
    email: string;
    profile?: {
      fullName?: string | null;
      phoneNumber?: string | null;
    } | null;
  };
  items: Array<{
    id: string;
    productNameSnap: string;
    quantity: number;
  }>;
}

interface TransactionMetrics {
  total: number;
  pickupReady: number;
  rented: number;
  late: number;
}

interface TransactionTableProps {
  transactions: TransactionListItem[];
  total: number;
  page: number;
  totalPages: number;
  metrics: TransactionMetrics;
  currentStatus: string;
  currentSearch: string;
  currentStartDate?: string;
  currentEndDate?: string;
  currentProductId?: string;
  availableProducts?: Array<{ id: string; name: string }>;
}
const STATUS_TABS = [
  { key: "ALL", label: "Semua Transaksi" },
  { key: "DP_Dibayar", label: "Siap Pickup" },
  { key: "Sedang_Disewa", label: "Sedang Disewa" },
  { key: "Terlambat", label: "Terlambat" },
  { key: "Selesai", label: "Selesai" },
  { key: "Dibatalkan", label: "Dibatalkan" },
];

export function TransactionTable({
  transactions,
  total,
  page,
  totalPages,
  metrics,
  currentStatus,
  currentSearch,
  currentStartDate = "",
  currentEndDate = "",
  currentProductId = "",
  availableProducts = [],
}: TransactionTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [startDateInput, setStartDateInput] = useState(currentStartDate);
  const [endDateInput, setEndDateInput] = useState(currentEndDate);
  const [productInput, setProductInput] = useState(currentProductId);
  const [isPending, startTransition] = useTransition();

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
        params.set("search", searchInput.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      startTransition(() => {
        router.push(`/admin/dashboard/transaksi?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, currentSearch, router, searchParams]);

  const handleTabChange = (statusKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (statusKey === "ALL") {
      params.delete("status");
    } else {
      params.set("status", statusKey);
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/admin/dashboard/transaksi?${params.toString()}`);
    });
  };

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
  };

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (startDateInput) params.set("startDate", startDateInput);
    else params.delete("startDate");
    if (endDateInput) params.set("endDate", endDateInput);
    else params.delete("endDate");
    if (productInput) params.set("productId", productInput);
    else params.delete("productId");
    params.set("page", "1");
    startTransition(() => {
      router.push(`/admin/dashboard/transaksi?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setSearchInput("");
    setStartDateInput("");
    setEndDateInput("");
    setProductInput("");
    const params = new URLSearchParams();
    startTransition(() => {
      router.push(`/admin/dashboard/transaksi?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/admin/dashboard/transaksi?${params.toString()}`);
    });
  };

  const isFiltered = Boolean(
    currentSearch.trim().length > 0 ||
    (currentStatus && currentStatus !== "ALL") ||
    currentStartDate ||
    currentEndDate ||
    currentProductId
  );
  return (
    <div className="space-y-6">
      {/* ── Summary KPI Strip (Archetype A) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          label="Total Transaksi Toko"
          value={metrics.total}
          icon={Invoice01Icon}
          iconColorVariant="neutral"
          subtext="Seluruh siklus rental tercatat"
        />
        <AdminKpiCard
          label="Siap Diambil (Pickup)"
          value={metrics.pickupReady}
          icon={Package01Icon}
          iconColorVariant="blue"
          subtext="DP lunas & menunggu serah terima"
        />
        <AdminKpiCard
          label="Sedang Disewa"
          value={metrics.rented}
          icon={Time02Icon}
          iconColorVariant="emerald"
          subtext="Unit aktif di tangan pelanggan"
        />
        <AdminKpiCard
          label="Terlambat Kembali"
          value={metrics.late}
          icon={AlertCircleIcon}
          iconColorVariant={metrics.late > 0 ? "rose" : "neutral"}
          subtext="Melewati tanggal jatuh tempo"
        />
      </div>

      {/* ── Status Tab Switcher ── */}
      <div className="flex border-b border-[#E5E7EB] overflow-x-auto gap-2 sm:gap-6">
        {STATUS_TABS.map((tab) => {
          const isActive =
            (tab.key === "ALL" && (!currentStatus || currentStatus === "ALL")) ||
            currentStatus === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`pb-3 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-all ${
                isActive
                  ? "border-[#16624B] text-[#16624B]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <span>{tab.label}</span>
              {tab.key === "DP_Dibayar" && metrics.pickupReady > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 tabular-nums">
                  {metrics.pickupReady}
                </span>
              )}
              {tab.key === "Terlambat" && metrics.late > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 tabular-nums">
                  {metrics.late}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="space-y-3 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
        <AdminFilterToolbar
          searchValue={searchInput}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Cari kode transaksi, nama penyewa, atau email…"
          isFiltered={isFiltered}
          onReset={handleReset}
        />

        {/* Secondary Filter Row: Date Range & Product */}
        <form
          onSubmit={handleApplyFilter}
          className="pt-3 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Tanggal Mulai (Dari)
            </label>
            <DatePicker
              value={startDateInput}
              onChange={setStartDateInput}
              placeholder="Pilih tanggal mulai"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Tanggal Akhir (Sampai)
            </label>
            <DatePicker
              value={endDateInput}
              onChange={setEndDateInput}
              placeholder="Pilih tanggal akhir"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Filter Berdasarkan Produk
            </label>
            <select
              value={productInput}
              onChange={(e) => setProductInput(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#16624B] bg-white"
            >
              <option value="">Semua Produk</option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 h-8 text-xs bg-[#16624B] hover:bg-[#0F4F3C] text-white font-medium"
            >
              {isPending ? "Menyaring..." : "Terapkan Filter"}
            </Button>
            {isFiltered && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="h-8 text-xs text-gray-600 hover:text-gray-900 border-gray-300"
              >
                Reset
              </Button>
            )}
            <a
              href={`/api/admin/reports/export/pdf?type=transactions${startDateInput ? `&startDate=${startDateInput}` : ""}${endDateInput ? `&endDate=${endDateInput}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                type="button"
                variant="outline"
                className="h-8 text-xs border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-semibold flex items-center gap-1.5"
                title="Unduh Laporan Transaksi Sewa (PDF)"
              >
                <HugeiconsIcon icon={Download01Icon} size={14} className="text-rose-600" />
                <span>PDF</span>
              </Button>
            </a>
          </div>
        </form>
      </div>
      {/* ── Table (Archetype A) ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Kode Transaksi</th>
                <th className="py-3 px-4">Penyewa</th>
                <th className="py-3 px-4">Jadwal Sewa</th>
                <th className="py-3 px-4">Status Pesanan</th>
                <th className="py-3 px-4">Biaya & Pembayaran</th>
                <th className="py-3 px-4">Jaminan Identitas</th>
                <th className="py-3 px-4 text-right">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <p className="font-semibold text-gray-700 mb-1">Tidak ada transaksi yang cocok</p>
                    <p className="text-[11px]">Coba ubah status tab atau sesuaikan kata kunci pencarian Anda.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const customerName = tx.user.profile?.fullName || tx.user.email.split("@")[0];
                  const isReadyPickup =
                    tx.transactionStatus === TransactionStatus.DP_Dibayar ||
                    tx.transactionStatus === TransactionStatus.Siap_Diambil ||
                    tx.transactionStatus === TransactionStatus.Dikonfirmasi;
                  const isReadyReturn =
                    tx.transactionStatus === TransactionStatus.Sedang_Disewa ||
                    tx.transactionStatus === TransactionStatus.Terlambat;

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Kode Transaksi */}
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900 tabular-nums">
                        <Link
                          href={`/admin/dashboard/transaksi/${tx.id}`}
                          className="hover:text-[#16624B] underline decoration-[#16624B]/30 hover:decoration-[#16624B]"
                        >
                          {tx.transactionCode}
                        </Link>
                      </td>

                      {/* Penyewa */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{customerName}</span>
                          <span className="text-[11px] text-gray-400">{tx.user.email}</span>
                        </div>
                      </td>

                      {/* Jadwal Sewa */}
                      <td className="py-3.5 px-4 text-gray-700">
                        <div className="flex flex-col text-xs">
                          <span className="font-medium tabular-nums">
                            {format(new Date(tx.startDate), "dd MMM yyyy", { locale: localeId })}
                            {" - "}
                            {format(new Date(tx.endDate), "dd MMM yyyy", { locale: localeId })}
                          </span>
                          <span className="text-[11px] text-gray-400 tabular-nums">
                            {tx.totalDurationDays} hari • {tx.items.length} item
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <TransactionStatusBadge status={tx.transactionStatus} size="sm" />
                      </td>

                      {/* Pembayaran */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-gray-900 tabular-nums">
                            Rp {tx.totalAmount.toLocaleString("id-ID")}
                          </span>
                          <PaymentStatusBadge status={tx.paymentStatus} size="sm" />
                          {tx.remainingAmount > 0 && tx.paymentStatus !== PaymentStatus.Fully_Paid && (
                            <span className="text-amber-700 font-semibold text-[10px] tabular-nums">
                              Sisa Toko: Rp {tx.remainingAmount.toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Jaminan Identitas */}
                      <td className="py-3.5 px-4">
                        <GuaranteeStatusBadge
                          status={tx.guaranteeStatus}
                          docType={tx.guaranteeDocType}
                          size="sm"
                        />
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isReadyPickup && (
                            <Link href={`/admin/dashboard/transaksi/${tx.id}/pickup`}>
                              <Button
                                size="sm"
                                className="h-7 text-[11px] px-2.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs gap-1"
                              >
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />
                                Pickup
                              </Button>
                            </Link>
                          )}

                          {isReadyReturn && (
                            <Link href={`/admin/dashboard/transaksi/${tx.id}/return`}>
                              <Button
                                size="sm"
                                className="h-7 text-[11px] px-2.5 font-semibold bg-[#16624B] hover:bg-[#0F4F3C] text-white shadow-2xs gap-1"
                              >
                                <HugeiconsIcon icon={Package01Icon} size={13} />
                                Return
                              </Button>
                            </Link>
                          )}

                          <Link href={`/admin/dashboard/transaksi/${tx.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] px-2.5 font-semibold text-gray-700 border-gray-200 hover:bg-gray-100"
                            >
                              <HugeiconsIcon icon={EyeIcon} size={13} className="mr-1" />
                              Detail
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#E5E7EB] px-4 py-3 bg-[#F9FAFB]">
            <span className="text-xs text-gray-500 tabular-nums">
              Halaman <span className="font-semibold text-gray-800">{page}</span> dari{" "}
              <span className="font-semibold text-gray-800">{totalPages}</span> (Total {total} transaksi)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                aria-label="Halaman sebelumnya"
                disabled={page <= 1 || isPending}
                onClick={() => handlePageChange(page - 1)}
                className="h-8 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#16624B]"
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-label="Halaman selanjutnya"
                disabled={page >= totalPages || isPending}
                onClick={() => handlePageChange(page + 1)}
                className="h-8 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#16624B]"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

