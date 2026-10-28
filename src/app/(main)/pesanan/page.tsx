import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Prisma, TransactionStatus } from "@prisma/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Calendar03Icon,
  ShoppingBag01Icon,
  Invoice01Icon,
  Search01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  CreditCardIcon,
  Package01Icon,
} from "@hugeicons/core-free-icons";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/config/routes";
import {
  TransactionStatusBadge,
  PaymentStatusBadge,
} from "@/components/atoms/status-badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Riwayat Pesanan Saya | ANNAPURNA",
  description:
    "Lihat daftar transaksi dan status peminjaman alat outdoor Anda di ANNAPURNA Outdoor Equipment.",
};

const FILTER_TABS = [
  { key: "ALL", label: "Semua" },
  { key: "MENUNGGU_BAYAR", label: "Menunggu DP" },
  { key: "BERJALAN", label: "Sedang Berjalan" },
  { key: "SELESAI", label: "Selesai" },
  { key: "BATAL", label: "Batal / Expired" },
] as const;

type FilterTabKey = (typeof FILTER_TABS)[number]["key"];

interface PesananPageProps {
  searchParams: Promise<{
    tab?: string;
    search?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 10;

export default async function PesananPage({ searchParams }: PesananPageProps) {
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect(`${ROUTES.LOGIN}?redirect=${ROUTES.ORDERS}`);
  }

  // 2. Parse search parameters
  const resolved = await searchParams;
  const currentTab = (resolved.tab || "ALL") as FilterTabKey;
  const searchQuery = resolved.search?.trim() || "";
  const currentPage = Math.max(1, parseInt(resolved.page || "1", 10));

  // 3. Build Prisma where clause
  const where: Prisma.RentalTransactionWhereInput = {
    userId: authUser.id,
  };

  if (currentTab === "MENUNGGU_BAYAR") {
    where.transactionStatus = {
      in: [TransactionStatus.Pending, TransactionStatus.Menunggu_Pembayaran_DP],
    };
  } else if (currentTab === "BERJALAN") {
    where.transactionStatus = {
      in: [
        TransactionStatus.DP_Dibayar,
        TransactionStatus.Dikonfirmasi,
        TransactionStatus.Siap_Diambil,
        TransactionStatus.Sedang_Disewa,
        TransactionStatus.Terlambat,
      ],
    };
  } else if (currentTab === "SELESAI") {
    where.transactionStatus = {
      in: [TransactionStatus.Dikembalikan, TransactionStatus.Selesai],
    };
  } else if (currentTab === "BATAL") {
    where.transactionStatus = {
      in: [
        TransactionStatus.Dibatalkan,
        TransactionStatus.Ditolak,
        TransactionStatus.Expired,
      ],
    };
  }

  if (searchQuery) {
    where.OR = [
      { transactionCode: { contains: searchQuery, mode: "insensitive" } },
      {
        items: {
          some: {
            productNameSnap: { contains: searchQuery, mode: "insensitive" },
          },
        },
      },
    ];
  }

  // 4. Query total count and paginated items in parallel
  const [totalCount, transactions, statusCounts] = await Promise.all([
    prisma.rentalTransaction.count({ where }),
    prisma.rentalTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.rentalTransaction.groupBy({
      by: ["transactionStatus"],
      where: { userId: authUser.id },
      _count: { _all: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Calculate tab badge counts
  const tabCounts: Record<FilterTabKey, number> = {
    ALL: 0,
    MENUNGGU_BAYAR: 0,
    BERJALAN: 0,
    SELESAI: 0,
    BATAL: 0,
  };

  for (const item of statusCounts) {
    const count = item._count._all;
    tabCounts.ALL += count;

    if (
      item.transactionStatus === TransactionStatus.Pending ||
      item.transactionStatus === TransactionStatus.Menunggu_Pembayaran_DP
    ) {
      tabCounts.MENUNGGU_BAYAR += count;
    } else if (
      item.transactionStatus === TransactionStatus.DP_Dibayar ||
      item.transactionStatus === TransactionStatus.Dikonfirmasi ||
      item.transactionStatus === TransactionStatus.Siap_Diambil ||
      item.transactionStatus === TransactionStatus.Sedang_Disewa ||
      item.transactionStatus === TransactionStatus.Terlambat
    ) {
      tabCounts.BERJALAN += count;
    } else if (
      item.transactionStatus === TransactionStatus.Dikembalikan ||
      item.transactionStatus === TransactionStatus.Selesai
    ) {
      tabCounts.SELESAI += count;
    } else if (
      item.transactionStatus === TransactionStatus.Dibatalkan ||
      item.transactionStatus === TransactionStatus.Ditolak ||
      item.transactionStatus === TransactionStatus.Expired
    ) {
      tabCounts.BATAL += count;
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50/60 pb-20 pt-6 dark:bg-neutral-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            <span>Kembali ke Beranda</span>
          </Link>

          <Link
            href={ROUTES.PROFILE}
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            <span>Pengaturan Akun & Profil</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>
        </div>

        {/* Page Header */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-900/60">
                  <HugeiconsIcon icon={ShoppingBag01Icon} size={20} />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                  Riwayat Pesanan Saya
                </h1>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 pl-13">
                Pantau status pembayaran DP, jadwal pengambilan perlengkapan, dan riwayat sewa alat outdoor Anda.
              </p>
            </div>

            <Link
              href={ROUTES.CATALOG}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-700 active:scale-[0.99] self-start sm:self-auto"
            >
              <HugeiconsIcon icon={Package01Icon} size={16} />
              <span>Sewa Alat Baru</span>
            </Link>
          </div>
        </div>

        {/* Search & Status Filter Tabs */}
        <div className="space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {FILTER_TABS.map((tab) => {
              const isActive = currentTab === tab.key;
              const count = tabCounts[tab.key] || 0;
              const href =
                tab.key === "ALL"
                  ? searchQuery
                    ? `${ROUTES.ORDERS}?search=${encodeURIComponent(searchQuery)}`
                    : ROUTES.ORDERS
                  : `${ROUTES.ORDERS}?tab=${tab.key}${
                      searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
                    }`;

              return (
                <Link
                  key={tab.key}
                  href={href}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border ${
                    isActive
                      ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                      : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    }`}
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Search bar */}
          <form method="GET" action={ROUTES.ORDERS} className="relative">
            {currentTab !== "ALL" && (
              <input type="hidden" name="tab" value={currentTab} />
            )}
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Cari kode transaksi atau nama produk..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
              />
            </div>
          </form>
        </div>

        {/* Order Cards List or Empty State */}
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 mb-4">
              <HugeiconsIcon icon={ShoppingBag01Icon} size={32} />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {searchQuery || currentTab !== "ALL"
                ? "Tidak Ada Pesanan yang Cocok"
                : "Belum Ada Riwayat Pesanan"}
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              {searchQuery || currentTab !== "ALL"
                ? "Coba ubah kata kunci pencarian atau pilih tab status transaksi yang berbeda."
                : "Anda belum pernah menyewa perlengkapan outdoor di ANNAPURNA. Jelajahi katalog dan pesan peralatan camping untuk petualangan Anda sekarang!"}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {searchQuery || currentTab !== "ALL" ? (
                <Link
                  href={ROUTES.ORDERS}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <span>Reset Filter</span>
                </Link>
              ) : null}
              <Link
                href={ROUTES.CATALOG}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-brand-700 active:scale-[0.99] transition-colors"
              >
                <HugeiconsIcon icon={ShoppingBag01Icon} size={16} />
                <span>Mulai Sewa Sekarang</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const isPaymentPending =
                transaction.transactionStatus === TransactionStatus.Pending ||
                transaction.transactionStatus ===
                  TransactionStatus.Menunggu_Pembayaran_DP;

              return (
                <div
                  key={transaction.id}
                  className="rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-neutral-300 transition-all dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                >
                  {/* Card Header: Code + Dates + Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4 dark:border-neutral-800/80">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-mono text-xs font-bold tracking-tight text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200/60 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900/40">
                        {transaction.transactionCode}
                      </span>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                        •
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                        <HugeiconsIcon icon={Clock01Icon} size={13} />
                        Dipesan{" "}
                        {format(new Date(transaction.createdAt), "dd MMM yyyy, HH:mm", {
                          locale: localeId,
                        })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <TransactionStatusBadge
                        status={transaction.transactionStatus}
                        size="sm"
                      />
                      <PaymentStatusBadge
                        status={transaction.paymentStatus}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Card Middle: Rental Period + Items */}
                  <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Items List Preview */}
                    <div className="md:col-span-2 space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        Alat yang Disewa ({transaction.items.length} Barang)
                      </div>
                      <div className="space-y-1.5">
                        {transaction.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
                          >
                            <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate pr-2">
                              {item.productNameSnap}
                              {item.unitCodeSnap && (
                                <span className="ml-1 text-[11px] font-mono text-neutral-400">
                                  ({item.unitCodeSnap})
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 text-neutral-500 dark:text-neutral-400">
                              {item.quantity} unit × Rp{" "}
                              {item.priceSnap.toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))}
                        {transaction.items.length > 3 && (
                          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 pl-2">
                            +{transaction.items.length - 3} item lainnya...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Rental Period Info */}
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3.5 space-y-2 dark:border-neutral-800/60 dark:bg-neutral-800/40">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                        <HugeiconsIcon icon={Calendar03Icon} size={13} />
                        <span>Periode Sewa</span>
                      </div>
                      <div className="text-xs space-y-1 text-neutral-700 dark:text-neutral-300">
                        <div>
                          <span className="text-neutral-400">Ambil: </span>
                          <span className="font-semibold">
                            {format(
                              new Date(transaction.startDate),
                              "dd MMM yyyy",
                              { locale: localeId }
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-400">Kembali: </span>
                          <span className="font-semibold">
                            {format(
                              new Date(transaction.endDate),
                              "dd MMM yyyy",
                              { locale: localeId }
                            )}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-brand-700 dark:text-brand-300 pt-0.5">
                          Durasi: {transaction.totalDurationDays} Hari
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Financial Summary & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
                      <div>
                        <span className="text-neutral-400 dark:text-neutral-500">
                          Total Sewa:{" "}
                        </span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-white">
                          Rp {transaction.totalAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">
                        |
                      </span>
                      <div>
                        <span className="text-neutral-400 dark:text-neutral-500">
                          DP 50%:{" "}
                        </span>
                        <span className="font-semibold text-brand-600 dark:text-brand-400">
                          Rp {transaction.dpAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">
                        |
                      </span>
                      <div>
                        <span className="text-neutral-400 dark:text-neutral-500">
                          Sisa Toko:{" "}
                        </span>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          Rp {transaction.remainingAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isPaymentPending ? (
                        <Button
                          asChild
                          size="sm"
                          className="bg-brand-600 text-white hover:bg-brand-700 shadow-xs text-xs font-semibold"
                        >
                          <Link href={ROUTES.ORDER_DETAIL(transaction.id)}>
                            <HugeiconsIcon icon={CreditCardIcon} size={14} />
                            <span>Bayar DP Sekarang</span>
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 text-xs font-semibold"
                      >
                        <Link href={ROUTES.ORDER_DETAIL(transaction.id)}>
                          <HugeiconsIcon icon={Invoice01Icon} size={14} />
                          <span>Lihat Invoice</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Menampilkan {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
                  {Math.min(currentPage * PAGE_SIZE, totalCount)} dari {totalCount}{" "}
                  pesanan
                </p>
                <div className="flex items-center gap-1.5">
                  {currentPage > 1 ? (
                    <Link
                      href={`${ROUTES.ORDERS}?page=${currentPage - 1}${
                        currentTab !== "ALL" ? `&tab=${currentTab}` : ""
                      }${
                        searchQuery
                          ? `&search=${encodeURIComponent(searchQuery)}`
                          : ""
                      }`}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300"
                    >
                      Sebelumnya
                    </Link>
                  ) : null}
                  <span className="px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  {currentPage < totalPages ? (
                    <Link
                      href={`${ROUTES.ORDERS}?page=${currentPage + 1}${
                        currentTab !== "ALL" ? `&tab=${currentTab}` : ""
                      }${
                        searchQuery
                          ? `&search=${encodeURIComponent(searchQuery)}`
                          : ""
                      }`}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300"
                    >
                      Selanjutnya
                    </Link>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
