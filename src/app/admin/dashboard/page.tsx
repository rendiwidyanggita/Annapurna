import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import {
  TransactionStatusBadge,
  PaymentStatusBadge,
} from "@/components/atoms/status-badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Invoice01Icon,
  Clock01Icon,
  Package01Icon,
  MoneyBag02Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  ArrowRight01Icon,
  ShoppingBag01Icon,
  Calendar03Icon,
  PlusSignIcon,
  EyeIcon,
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { TransactionStatus, UnitStatus, PaymentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Ringkasan — Admin ANNAPURNA",
};

export default async function AdminDashboardPage() {
  const today = new Date();

  // Parallel database queries to prevent waterfalls
  const [
    totalTransactions,
    activeTransactions,
    settledPayments,
    rentedUnitsCount,
    availableUnitsCount,
    maintenanceUnitsCount,
    damagedUnitsCount,
    recentTransactions,
    lowStockConsumables,
  ] = await Promise.all([
    // 1. Total Transactions
    prisma.rentalTransaction.count(),

    // 2. Active Transactions
    prisma.rentalTransaction.count({
      where: {
        transactionStatus: {
          in: [
            TransactionStatus.DP_Dibayar,
            TransactionStatus.Siap_Diambil,
            TransactionStatus.Dikonfirmasi,
            TransactionStatus.Sedang_Disewa,
            TransactionStatus.Terlambat,
          ],
        },
      },
    }),

    // 3. Settled Payments (Midtrans)
    prisma.payment.aggregate({
      where: {
        paymentStatus: {
          in: [
            PaymentStatus.DP_Paid,
            PaymentStatus.Remaining_Paid,
            PaymentStatus.Fully_Paid,
          ],
        },
      },
      _sum: { grossAmount: true },
    }),

    // 4. Units by physical status
    prisma.inventoryUnit.count({
      where: { unitStatus: UnitStatus.Rented, deletedAt: null },
    }),
    prisma.inventoryUnit.count({
      where: { unitStatus: UnitStatus.Available, deletedAt: null },
    }),
    prisma.inventoryUnit.count({
      where: { unitStatus: UnitStatus.Maintenance, deletedAt: null },
    }),
    prisma.inventoryUnit.count({
      where: {
        unitStatus: { in: [UnitStatus.Damaged, UnitStatus.Lost] },
        deletedAt: null,
      },
    }),

    // 5. Recent 5 Transactions
    prisma.rentalTransaction.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        items: true,
      },
    }),

    // 6. Critical Consumable Stock (<= 3)
    prisma.product.findMany({
      where: {
        itemType: "consumable",
        consumableStock: { lte: 3 },
        deletedAt: null,
      },
      take: 4,
      select: {
        id: true,
        name: true,
        consumableStock: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  const totalRevenue = settledPayments._sum.grossAmount ?? 0;
  const totalPhysicalUnits =
    availableUnitsCount +
    rentedUnitsCount +
    maintenanceUnitsCount +
    damagedUnitsCount;

  const unitUtilizationPercent =
    totalPhysicalUnits > 0
      ? Math.round((rentedUnitsCount / totalPhysicalUnits) * 100)
      : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard Ringkasan Operasional
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Monitor transaksi aktif, kelola serah terima kasir, dan pantau ketersediaan unit inventaris toko.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white shadow-2xs text-xs font-semibold text-gray-700">
          <HugeiconsIcon icon={Calendar03Icon} size={15} className="text-[#16624B]" />
          <span className="capitalize tabular-nums">
            {format(today, "EEEE, dd MMMM yyyy", { locale: localeId })}
          </span>
        </div>
      </div>

      {/* ── 4 KPI Metric Cards (Archetype A & Design System) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          label="Total Transaksi Toko"
          value={totalTransactions}
          icon={Invoice01Icon}
          iconColorVariant="neutral"
          subtext="Seluruh pesanan tercatat"
        />
        <AdminKpiCard
          label="Transaksi Sedang Berjalan"
          value={activeTransactions}
          icon={Clock01Icon}
          iconColorVariant="emerald"
          subtext="DP terbayar hingga disewa"
        />
        <AdminKpiCard
          label="Unit Fisik Sedang Disewa"
          value={rentedUnitsCount}
          icon={Package01Icon}
          iconColorVariant="blue"
          subtext={`${unitUtilizationPercent}% utilisasi inventaris`}
        />
        <AdminKpiCard
          label="Pemasukan Terverifikasi"
          value={`Rp ${totalRevenue.toLocaleString("id-ID")}`}
          icon={MoneyBag02Icon}
          iconColorVariant="amber"
          subtext="Total settlement Midtrans"
        />
      </div>

      {/* ── Main Content Grid (2 Columns on Large Screens) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions Card */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Invoice01Icon} size={18} className="text-[#16624B]" />
                <h2 className="text-sm font-bold text-gray-900">
                  Transaksi Operasional Terkini
                </h2>
              </div>
              <Link
                href="/admin/dashboard/transaksi"
                className="text-xs font-semibold text-[#16624B] hover:text-[#0F4F3C] inline-flex items-center gap-1 transition-colors"
              >
                <span>Lihat Semua</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Kode Transaksi</th>
                    <th className="py-3 px-4">Penyewa</th>
                    <th className="py-3 px-4">Jadwal Sewa</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Total Biaya</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        <p className="font-semibold text-gray-700 mb-1">
                          Belum ada transaksi operasional
                        </p>
                        <p className="text-[11px]">
                          Pesanan sewa baru dari pelanggan akan otomatis tampil di sini.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((tx) => {
                      const customerName =
                        tx.user.profile?.fullName || tx.user.email;
                      const isReadyPickup =
                        tx.transactionStatus === TransactionStatus.DP_Dibayar ||
                        tx.transactionStatus === TransactionStatus.Siap_Diambil;
                      const isReadyReturn =
                        tx.transactionStatus === TransactionStatus.Sedang_Disewa ||
                        tx.transactionStatus === TransactionStatus.Terlambat;

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-gray-50/80 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <Link
                              href={`/admin/dashboard/transaksi/${tx.id}`}
                              className="font-mono font-bold text-gray-900 hover:text-[#16624B] tabular-nums"
                            >
                              {tx.transactionCode}
                            </Link>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-gray-900 truncate max-w-[140px]">
                              {customerName}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[140px]">
                              {tx.user.email}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-gray-600 tabular-nums">
                            {format(new Date(tx.startDate), "dd/MM")} -{" "}
                            {format(new Date(tx.endDate), "dd/MM/yy")}
                          </td>
                          <td className="py-3 px-4">
                            <TransactionStatusBadge
                              status={tx.transactionStatus}
                              size="sm"
                            />
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900 tabular-nums">
                            Rp {tx.totalAmount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isReadyPickup && (
                                <Link
                                  href={`/admin/dashboard/transaksi/${tx.id}/pickup`}
                                >
                                  <Button
                                    size="sm"
                                    className="h-7 text-[11px] px-2 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    Pickup
                                  </Button>
                                </Link>
                              )}
                              {isReadyReturn && (
                                <Link
                                  href={`/admin/dashboard/transaksi/${tx.id}/return`}
                                >
                                  <Button
                                    size="sm"
                                    className="h-7 text-[11px] px-2 font-semibold bg-[#16624B] hover:bg-[#0F4F3C] text-white"
                                  >
                                    Return
                                  </Button>
                                </Link>
                              )}
                              <Link
                                href={`/admin/dashboard/transaksi/${tx.id}`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900 border-gray-200"
                                  title="Lihat Detail Transaksi"
                                  aria-label={`Detail transaksi ${tx.transactionCode}`}
                                >
                                  <HugeiconsIcon icon={EyeIcon} size={14} />
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
          </div>

          {/* Unit Inventory Status Distribution */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Package01Icon} size={18} className="text-[#16624B]" />
                <h2 className="text-sm font-bold text-gray-900">
                  Status Distribusi Unit Fisik Inventaris
                </h2>
              </div>
              <Link
                href="/admin/dashboard/unit"
                className="text-xs font-semibold text-[#16624B] hover:text-[#0F4F3C] inline-flex items-center gap-1 transition-colors"
              >
                <span>Kelola Unit</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-[#E7F3EE]/50">
                <span className="text-[11px] font-semibold text-emerald-800">
                  Available (Siap)
                </span>
                <p className="text-2xl font-bold font-mono text-[#16624B] mt-1 tabular-nums">
                  {availableUnitsCount}
                </p>
                <span className="text-[10px] text-emerald-700">Tersedia disewa</span>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
                <span className="text-[11px] font-semibold text-blue-800">
                  Rented (Disewa)
                </span>
                <p className="text-2xl font-bold font-mono text-blue-700 mt-1 tabular-nums">
                  {rentedUnitsCount}
                </p>
                <span className="text-[10px] text-blue-600">Aktif di pelanggan</span>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
                <span className="text-[11px] font-semibold text-amber-800">
                  Maintenance (Cuci)
                </span>
                <p className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                  {maintenanceUnitsCount}
                </p>
                <span className="text-[10px] text-amber-600">Pembersihan / servis</span>
              </div>

              <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/50">
                <span className="text-[11px] font-semibold text-red-800">
                  Damaged / Lost
                </span>
                <p className="text-2xl font-bold font-mono text-red-700 mt-1 tabular-nums">
                  {damagedUnitsCount}
                </p>
                <span className="text-[10px] text-red-600">Perlu penanganan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Quick Operational Shortcuts */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-gray-900 border-b border-[#E5E7EB] pb-3">
              Aksi Cepat Operasional
            </h2>

            <div className="space-y-2">
              <Link
                href="/admin/dashboard/transaksi?status=DP_Dibayar"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                      Proses Serah Terima (Pickup)
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Verifikasi jaminan & unit sewa
                    </p>
                  </div>
                </div>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-gray-400 group-hover:text-blue-700" />
              </Link>

              <Link
                href="/admin/dashboard/transaksi?status=Sedang_Disewa"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#16624B] flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Package01Icon} size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 group-hover:text-[#16624B] transition-colors">
                      Pemeriksaan Return & Denda
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Cek kondisi & kembalikan jaminan
                    </p>
                  </div>
                </div>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-gray-400 group-hover:text-[#16624B]" />
              </Link>

              <Link
                href="/admin/dashboard/produk/baru"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={PlusSignIcon} size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      Tambah Produk Baru
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Katalog sewa atau consumable
                    </p>
                  </div>
                </div>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-gray-400" />
              </Link>

              <Link
                href="/admin/dashboard/unit"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={ShoppingBag01Icon} size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      Kelola Unit Fisik & Stok
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Inventaris barcode / kode unit
                    </p>
                  </div>
                </div>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Consumable Stock Alert */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={AlertCircleIcon} size={18} className="text-amber-600" />
                <h2 className="text-sm font-bold text-gray-900">
                  Peringatan Stok Habis Pakai
                </h2>
              </div>
              <Link
                href="/admin/dashboard/unit"
                className="text-xs font-semibold text-[#16624B] hover:text-[#0F4F3C]"
              >
                Lihat
              </Link>
            </div>

            {lowStockConsumables.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-emerald-600 shrink-0" />
                <span>Seluruh stok produk consumable dalam batas aman.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockConsumables.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-red-200 bg-red-50/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">{item.name}</p>
                      <p className="text-[10px] text-gray-500">{item.category.name}</p>
                    </div>
                    <span className="text-xs font-bold font-mono text-red-600 bg-white px-2 py-0.5 rounded border border-red-200 tabular-nums">
                      {item.consumableStock} unit
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
