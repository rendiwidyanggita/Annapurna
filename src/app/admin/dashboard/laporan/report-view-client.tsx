"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileAttachmentIcon,
  Download01Icon,
  FilterIcon,
  MoneyBag02Icon,
  Invoice01Icon,
  AlertCircleIcon,
  Package01Icon,
  Clock01Icon,
  DeliveryBox01Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import type {
  getRevenueSummary,
  getRentalTransactionReport,
  getDpReport,
  getRemainingPaymentReport,
  getPenaltyReport,
  getProblematicUnitsReport,
  getConsumableUsageReport,
  getTopProductsReport,
} from "@/lib/services/report-service";

interface ReportViewClientProps {
  isOwner: boolean;
  activeTab: string;
  currentPreset: string;
  currentStartDate: string;
  currentEndDate: string;
  revenueData: Awaited<ReturnType<typeof getRevenueSummary>> | null;
  transactionsData: Awaited<ReturnType<typeof getRentalTransactionReport>> | null;
  dpData: Awaited<ReturnType<typeof getDpReport>> | null;
  remainingData: Awaited<ReturnType<typeof getRemainingPaymentReport>> | null;
  penaltyData: Awaited<ReturnType<typeof getPenaltyReport>> | null;
  unitsData: Awaited<ReturnType<typeof getProblematicUnitsReport>> | null;
  consumablesData: Awaited<ReturnType<typeof getConsumableUsageReport>> | null;
  topProductsData: Awaited<ReturnType<typeof getTopProductsReport>> | null;
}

export function ReportViewClient({
  isOwner,
  activeTab,
  currentPreset,
  currentStartDate,
  currentEndDate,
  revenueData,
  transactionsData,
  dpData,
  remainingData,
  penaltyData,
  unitsData,
  consumablesData,
  topProductsData,
}: ReportViewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [presetInput, setPresetInput] = useState(currentPreset);
  const [startInput, setStartInput] = useState(currentStartDate);
  const [endInput, setEndInput] = useState(currentEndDate);

  const tabs = [
    ...(isOwner
      ? [
          { key: "revenue", label: "Ringkasan Finansial" },
          { key: "dp", label: "DP Midtrans (AA-88)" },
          { key: "remaining", label: "Pelunasan Kasir (AA-89)" },
          { key: "penalties", label: "Denda & Klaim (AA-90)" },
        ]
      : []),
    { key: "transactions", label: "Transaksi Sewa (AA-87)" },
    { key: "units", label: "Unit Bermasalah (AA-91)" },
    { key: "consumables", label: "Barang Konsumsi (AA-92)" },
    { key: "top_products", label: "Produk Terpopuler (AA-93)" },
  ];

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    startTransition(() => {
      router.push(`/admin/dashboard/laporan?${params.toString()}`);
    });
  };

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", presetInput);
    if (presetInput === "custom") {
      if (startInput) params.set("startDate", startInput);
      if (endInput) params.set("endDate", endInput);
    } else {
      params.delete("startDate");
      params.delete("endDate");
    }
    startTransition(() => {
      router.push(`/admin/dashboard/laporan?${params.toString()}`);
    });
  };

  const exportQueryString = new URLSearchParams({
    type: activeTab,
    preset: presetInput,
    ...(presetInput === "custom" && startInput ? { startDate: startInput } : {}),
    ...(presetInput === "custom" && endInput ? { endDate: endInput } : {}),
  }).toString();

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header & Export CTAs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Laporan & Rekapitulasi Operasional
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Ekspor data keuangan, operasional unit sewa, dan statistik performa katalog toko.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/admin/reports/export/pdf?${exportQueryString}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs border-[#E5E7EB] text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-semibold flex items-center gap-2"
            >
              <HugeiconsIcon icon={Download01Icon} size={15} className="text-rose-600" />
              <span>Export PDF</span>
            </Button>
          </a>

          <a
            href={`/api/admin/reports/export/excel?${exportQueryString}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs border-[#16624B] text-[#16624B] hover:bg-[#E7F3EE] font-semibold flex items-center gap-2"
            >
              <HugeiconsIcon icon={FileAttachmentIcon} size={15} />
              <span>Export Excel</span>
            </Button>
          </a>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex border-b border-[#E5E7EB] overflow-x-auto gap-2 sm:gap-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`pb-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                isActive
                  ? "border-[#16624B] text-[#16624B]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Filter Toolbar ── */}
      <form
        onSubmit={handleApplyFilter}
        className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Rentang Waktu Laporan (WIB)
          </label>
          <select
            value={presetInput}
            onChange={(e) => setPresetInput(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#16624B] bg-white"
          >
            <option value="today">Hari Ini (WIB)</option>
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
            <option value="this_month">Bulan Ini</option>
            <option value="last_month">Bulan Lalu</option>
            <option value="custom">Kustom (Pilih Tanggal)</option>
          </select>
        </div>

        {presetInput === "custom" && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Tanggal Dari
              </label>
              <DatePicker
                value={startInput}
                onChange={setStartInput}
                placeholder="Pilih tanggal dari"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Tanggal Sampai
              </label>
              <DatePicker
                value={endInput}
                onChange={setEndInput}
                placeholder="Pilih tanggal sampai"
              />
            </div>
          </>
        )}

        <div>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-8 text-xs bg-[#16624B] hover:bg-[#0F4F3C] text-white font-medium flex items-center justify-center gap-1.5"
          >
            <HugeiconsIcon icon={FilterIcon} size={14} />
            <span>{isPending ? "Memuat..." : "Terapkan Filter"}</span>
          </Button>
        </div>
      </form>

      {/* ── TAB 1: Ringkasan Finansial Toko (Owner Only) ── */}
      {activeTab === "revenue" && revenueData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminKpiCard
              label="Pemasukan Bersih (Net)"
              value={`Rp ${revenueData.netRevenue.toLocaleString("id-ID")}`}
              icon={MoneyBag02Icon}
              iconColorVariant="emerald"
              subtext="Kas Masuk + Pelunasan - Refund"
            />
            <AdminKpiCard
              label="Pemasukan Online / DP"
              value={`Rp ${revenueData.grossInflows.toLocaleString("id-ID")}`}
              icon={Invoice01Icon}
              iconColorVariant="blue"
              subtext={`${revenueData.paymentCount} transaksi Midtrans`}
            />
            <AdminKpiCard
              label="Pelunasan Kasir Toko"
              value={`Rp ${revenueData.cashierRemaining.toLocaleString("id-ID")}`}
              icon={DeliveryBox01Icon}
              iconColorVariant="amber"
              subtext={`${revenueData.remainingCount} pesanan selesai pelunasan`}
            />
            <AdminKpiCard
              label="Pengembalian Dana (Refund)"
              value={`Rp ${revenueData.totalRefunded.toLocaleString("id-ID")}`}
              icon={AlertCircleIcon}
              iconColorVariant="rose"
              subtext={`${revenueData.refundCount} pembatalan toko terverifikasi`}
            />
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-gray-900 border-b border-[#E5E7EB] pb-3">
              Rincian Rekapitulasi Kas & Denda
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-gray-500 font-medium">Total Denda Terkumpul</span>
                <p className="text-lg font-bold text-gray-900 tabular-nums mt-1">
                  Rp {revenueData.totalPenalties.toLocaleString("id-ID")}
                </p>
                <span className="text-[11px] text-gray-500">{revenueData.penaltyCount} denda tercatat</span>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200">
                <span className="text-emerald-800 font-medium">Batas Tanggal Laporan (WIB)</span>
                <p className="text-sm font-mono font-semibold text-[#16624B] mt-1 tabular-nums">
                  {revenueData.dateRange.startDateStr} s/d {revenueData.dateRange.endDateStr}
                </p>
                <span className="text-[11px] text-emerald-700">Zona Waktu GMT+7</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Transaksi Sewa (AA-87) ── */}
      {activeTab === "transactions" && transactionsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AdminKpiCard
              label="Total Transaksi Sewa"
              value={transactionsData.summary.totalTransactions}
              icon={Invoice01Icon}
              iconColorVariant="neutral"
              subtext={`Rata-rata sewa: ${transactionsData.summary.averageDurationDays} hari`}
            />
            <AdminKpiCard
              label="Total Nilai Sewa (Kotor)"
              value={`Rp ${transactionsData.summary.totalGrossAmount.toLocaleString("id-ID")}`}
              icon={MoneyBag02Icon}
              iconColorVariant="emerald"
              subtext="Akumulasi tagihan pelanggan"
            />
            <AdminKpiCard
              label="Total DP Masuk"
              value={`Rp ${transactionsData.summary.totalDpAmount.toLocaleString("id-ID")}`}
              icon={Package01Icon}
              iconColorVariant="blue"
              subtext="Uang muka terkonfirmasi"
            />
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Kode Transaksi</th>
                    <th className="py-3 px-4">Penyewa</th>
                    <th className="py-3 px-4">Jadwal Sewa</th>
                    <th className="py-3 px-4">Durasi</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Total Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {transactionsData.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-gray-900">{tx.transactionCode}</td>
                      <td className="py-3 px-4 text-gray-700">{tx.user.profile?.fullName || tx.user.email}</td>
                      <td className="py-3 px-4 tabular-nums text-gray-600">
                        {new Date(tx.startDate).toLocaleDateString("id-ID")} - {new Date(tx.endDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3 px-4 tabular-nums text-gray-600">{tx.totalDurationDays} hari</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{tx.transactionStatus}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                        Rp {tx.totalAmount.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: DP Midtrans (AA-88) ── */}
      {activeTab === "dp" && dpData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminKpiCard
              label="Total Transaksi DP"
              value={dpData.summary.totalDpCount}
              icon={Invoice01Icon}
              iconColorVariant="neutral"
              subtext="Berhasil dibayar via Midtrans"
            />
            <AdminKpiCard
              label="Total Uang Muka (DP)"
              value={`Rp ${dpData.summary.totalDpAmount.toLocaleString("id-ID")}`}
              icon={MoneyBag02Icon}
              iconColorVariant="emerald"
              subtext="Settlement terverifikasi"
            />
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Order ID Midtrans</th>
                    <th className="py-3 px-4">Kode Transaksi</th>
                    <th className="py-3 px-4">Penyewa</th>
                    <th className="py-3 px-4">Metode</th>
                    <th className="py-3 px-4">Waktu Bayar</th>
                    <th className="py-3 px-4 text-right">Nominal DP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {dpData.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-gray-900">{p.midtransOrderId}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-gray-900">{p.transaction?.transactionCode || "-"}</td>
                      <td className="py-3 px-4 text-gray-700">{p.transaction?.user.profile?.fullName || "-"}</td>
                      <td className="py-3 px-4 capitalize text-gray-600">{p.paymentType || "-"}</td>
                      <td className="py-3 px-4 tabular-nums text-gray-600">
                        {p.paidAt ? new Date(p.paidAt).toLocaleString("id-ID") : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                        Rp {p.grossAmount.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Pelunasan Kasir (AA-89) ── */}
      {activeTab === "remaining" && remainingData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminKpiCard
              label="Pesanan Lunas Kasir"
              value={remainingData.summary.totalRemainingCount}
              icon={DeliveryBox01Icon}
              iconColorVariant="neutral"
              subtext="Pelunasan tunai / QRIS toko"
            />
            <AdminKpiCard
              label="Total Pelunasan Kasir"
              value={`Rp ${remainingData.summary.totalRemainingAmount.toLocaleString("id-ID")}`}
              icon={MoneyBag02Icon}
              iconColorVariant="emerald"
              subtext="Diterima langsung saat pickup"
            />
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Kode Transaksi</th>
                    <th className="py-3 px-4">Penyewa</th>
                    <th className="py-3 px-4">Kontak Telepon</th>
                    <th className="py-3 px-4 text-right">Pelunasan Diterima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {remainingData.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-gray-900">{tx.transactionCode}</td>
                      <td className="py-3 px-4 text-gray-700">{tx.user.profile?.fullName || tx.user.email}</td>
                      <td className="py-3 px-4 text-gray-600 tabular-nums">{tx.user.profile?.phoneNumber || "-"}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                        Rp {tx.remainingAmount.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: Denda & Klaim (AA-90) ── */}
      {activeTab === "penalties" && penaltyData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminKpiCard
              label="Total Insiden Denda"
              value={penaltyData.summary.totalPenaltyCount}
              icon={AlertCircleIcon}
              iconColorVariant="rose"
              subtext="Terlambat, rusak, atau hilang"
            />
            <AdminKpiCard
              label="Total Denda Dikenakan"
              value={`Rp ${penaltyData.summary.totalPenaltyAmount.toLocaleString("id-ID")}`}
              icon={MoneyBag02Icon}
              iconColorVariant="amber"
              subtext="Klaim penalti kasir"
            />
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Kode Transaksi</th>
                    <th className="py-3 px-4">Tipe Denda</th>
                    <th className="py-3 px-4">Alasan & Rincian</th>
                    <th className="py-3 px-4 text-right">Nominal Denda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {penaltyData.penalties.map((pen) => (
                    <tr key={pen.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                        {pen.transaction?.transactionCode || "-"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-rose-700">{pen.penaltyType}</td>
                      <td className="py-3 px-4 text-gray-700">{pen.reason}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                        Rp {pen.amount.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: Unit Bermasalah (AA-91) ── */}
      {activeTab === "units" && unitsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AdminKpiCard
              label="Unit Dalam Pembersihan"
              value={unitsData.summary.maintenanceCount}
              icon={Clock01Icon}
              iconColorVariant="amber"
              subtext="Maintenance / cuci"
            />
            <AdminKpiCard
              label="Unit Rusak"
              value={unitsData.summary.damagedCount}
              icon={AlertCircleIcon}
              iconColorVariant="rose"
              subtext="Perlu reparasi / penggantian"
            />
            <AdminKpiCard
              label="Unit Hilang"
              value={unitsData.summary.lostCount}
              icon={Package01Icon}
              iconColorVariant="neutral"
              subtext="Klaim penggantian pelanggan"
            />
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Kode Unit</th>
                    <th className="py-3 px-4">Produk & Variasi</th>
                    <th className="py-3 px-4">Status Fisik</th>
                    <th className="py-3 px-4">Catatan Kondisi Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {unitsData.units.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-gray-900">{u.inventoryCode}</td>
                      <td className="py-3 px-4 text-gray-800">
                        {u.variant.product.name} ({u.variant.variantName})
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            u.unitStatus === "Maintenance"
                              ? "bg-amber-100 text-amber-700"
                              : u.unitStatus === "Damaged"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {u.unitStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{u.conditionNotes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: Barang Konsumsi (AA-92) ── */}
      {activeTab === "consumables" && consumablesData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminKpiCard
              label="Barang Reusable"
              value={consumablesData.summary.reusableCount}
              icon={Package01Icon}
              iconColorVariant="emerald"
              subtext="Jeriken, mantol, dll (kembali)"
            />
            <AdminKpiCard
              label="Barang Habis Pakai"
              value={consumablesData.summary.nonReusableCount}
              icon={ShoppingBag01Icon}
              iconColorVariant="blue"
              subtext="Gas kaleng, trash bag (habis)"
            />
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Klasifikasi</th>
                    <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                    <th className="py-3 px-4 text-right">Total Disewa/Dipakai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {[...consumablesData.nonReusable, ...consumablesData.reusable].map((c) => (
                    <tr key={c.productId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">{c.name}</td>
                      <td className="py-3 px-4 text-gray-600">{c.category}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            c.isReusable ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {c.isReusable ? "Reusable" : "Habis Pakai"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-gray-900 tabular-nums">
                        {c.currentStock} unit
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#16624B] tabular-nums">
                        {c.rentedQty} unit
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: Produk Terpopuler (AA-93) ── */}
      {activeTab === "top_products" && topProductsData && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-16">Peringkat</th>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Tipe Item</th>
                    <th className="py-3 px-4 text-center">Unit Disewa</th>
                    <th className="py-3 px-4 text-right">Kontribusi Omzet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {topProductsData.topProducts.map((p) => (
                    <tr key={p.productId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900 tabular-nums">
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                          {p.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{p.name}</td>
                      <td className="py-3 px-4 text-gray-600">{p.category}</td>
                      <td className="py-3 px-4 capitalize text-gray-600">{p.itemType.replace("_", " ")}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#16624B] tabular-nums">
                        {p.totalRentedUnits} unit
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                        Rp {p.totalRevenue.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
