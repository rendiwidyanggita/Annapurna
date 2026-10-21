"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TransactionStatusBadge,
  PaymentStatusBadge,
  GuaranteeBadge,
} from "./status-badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  ShoppingBagIcon,
  Clock01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
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
}

const STATUS_TABS = [
  { key: "ALL", label: "Semua" },
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
}: TransactionTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [isPending, startTransition] = useTransition();

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/admin/dashboard/transaksi?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Summary Metric Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Transaksi</span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <HugeiconsIcon icon={ShoppingBagIcon} size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {metrics.total}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600">Siap Diambil (Pickup)</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-blue-700">
            {metrics.pickupReady}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-600">Sedang Disewa</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <HugeiconsIcon icon={Clock01Icon} size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-700">
            {metrics.rented}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-rose-600">Terlambat Kembali</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-rose-700">
            {metrics.late}
          </p>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tab buttons */}
        <div className="flex flex-wrap gap-1.5 rounded-lg bg-slate-100 p-1">
          {STATUS_TABS.map((tab) => {
            const isActive =
              (tab.key === "ALL" && !currentStatus) ||
              currentStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Input
              type="text"
              placeholder="Cari kode / nama / email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pr-8 text-sm h-9"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </button>
          </div>
          {currentSearch && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput("");
                const params = new URLSearchParams(searchParams.toString());
                params.delete("search");
                params.set("page", "1");
                startTransition(() => {
                  router.push(`/admin/dashboard/transaksi?${params.toString()}`);
                });
              }}
              className="text-xs h-9 px-2"
            >
              Reset
            </Button>
          )}
        </form>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[140px] font-semibold text-slate-700">Kode</TableHead>
              <TableHead className="font-semibold text-slate-700">Pelanggan</TableHead>
              <TableHead className="font-semibold text-slate-700">Jadwal Sewa</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700">Pembayaran</TableHead>
              <TableHead className="font-semibold text-slate-700">Jaminan</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-sm text-slate-500">
                  Tidak ada transaksi yang cocok dengan filter.
                </TableCell>
              </TableRow>
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
                  <TableRow key={tx.id} className="hover:bg-slate-50/70">
                    <TableCell className="font-mono text-xs font-semibold text-slate-900">
                      <Link
                        href={`/admin/dashboard/transaksi/${tx.id}`}
                        className="hover:underline text-primary"
                      >
                        {tx.transactionCode}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">
                          {customerName}
                        </span>
                        <span className="text-xs text-slate-500">{tx.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-slate-700">
                        <span>
                          {format(new Date(tx.startDate), "dd MMM yyyy", {
                            locale: localeId,
                          })}{" "}
                          -{" "}
                          {format(new Date(tx.endDate), "dd MMM yyyy", {
                            locale: localeId,
                          })}
                        </span>
                        <span className="text-slate-400">
                          {tx.totalDurationDays} hari • {tx.items.length} item
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TransactionStatusBadge status={tx.transactionStatus} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-slate-900">
                          Rp {tx.totalAmount.toLocaleString("id-ID")}
                        </span>
                        <PaymentStatusBadge status={tx.paymentStatus} />
                        {tx.remainingAmount > 0 && tx.paymentStatus !== PaymentStatus.Fully_Paid && (
                          <span className="text-amber-600 font-medium text-[11px]">
                            Sisa: Rp {tx.remainingAmount.toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <GuaranteeBadge
                        status={tx.guaranteeStatus}
                        docType={tx.guaranteeDocType}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isReadyPickup && (
                          <Button asChild size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
                            <Link href={`/admin/dashboard/transaksi/${tx.id}/pickup`}>
                              Pickup
                            </Link>
                          </Button>
                        )}
                        {isReadyReturn && (
                          <Button asChild size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
                            <Link href={`/admin/dashboard/transaksi/${tx.id}/return`}>
                              Pengembalian
                            </Link>
                          </Button>
                        )}
                        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                          <Link href={`/admin/dashboard/transaksi/${tx.id}`}>
                            Detail
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-6">
            <span className="text-xs text-slate-500">
              Menampilkan halaman <span className="font-medium">{page}</span> dari{" "}
              <span className="font-medium">{totalPages}</span> (Total {total} data)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isPending}
                onClick={() => handlePageChange(page - 1)}
                className="h-8 text-xs"
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isPending}
                onClick={() => handlePageChange(page + 1)}
                className="h-8 text-xs"
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
