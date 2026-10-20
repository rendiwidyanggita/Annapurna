"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  Loading01Icon,
  AlertCircleIcon,
  Invoice01Icon,
  Calendar03Icon,
  ShoppingBag01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { CountdownTimer, PaymentSuccessBanner } from "@/components/molecules/countdown-timer";
import { TransactionStepper } from "@/components/organisms/transaction-stepper";
import { cn } from "@/lib/utils";
import { TransactionStatus, PaymentStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types (mirrors server-side query shape)
// ─────────────────────────────────────────────────────────────────────────────

interface TransactionItem {
  id: string;
  productNameSnap: string;
  unitCodeSnap: string | null;
  priceSnap: number;
  quantity: number;
  subtotal: number;
}

interface InvoiceTransaction {
  id: string;
  transactionCode: string;
  transactionStatus: TransactionStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  dpAmount: number;
  remainingAmount: number;
  pricingScheme: string;
  startDate: string;
  endDate: string;
  totalDurationDays: number;
  createdAt: string;
  notes: string | null;
  items: TransactionItem[];
}

interface InvoiceContentProps {
  transaction: InvoiceTransaction;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

const PAYMENT_SUCCESS_STATUSES: TransactionStatus[] = [
  TransactionStatus.DP_Dibayar,
  TransactionStatus.Dikonfirmasi,
  TransactionStatus.Siap_Diambil,
  TransactionStatus.Sedang_Disewa,
  TransactionStatus.Terlambat,
  TransactionStatus.Dikembalikan,
  TransactionStatus.Selesai,
];

const TERMINAL_FAILURE_STATUSES: TransactionStatus[] = [
  TransactionStatus.Expired,
  TransactionStatus.Dibatalkan,
  TransactionStatus.Ditolak,
];

function getPricingSchemeLabel(scheme: string): string {
  switch (scheme) {
    case "permalam":
      return "Permalam";
    case "perkegiatan1":
      return "Perkegiatan I (3 hari)";
    case "perkegiatan2":
      return "Perkegiatan II (5 hari)";
    default:
      return scheme;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * InvoiceContent — Client component for /pesanan/[id]
 *
 * Handles:
 * - AA-70: Invoice display (items, amounts, dates, notes)
 * - AA-71: Countdown timer for 60-min soft-hold window
 * - AA-72: "Bayar DP" button → calls create-snap API → opens Midtrans popup
 * - AA-76: TransactionStepper for visual status tracking
 * - Task 10: Auto-refresh polling on ?payment=success to catch webhook delay
 */
export function InvoiceContent({ transaction: initialTransaction }: InvoiceContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [transaction, setTransaction] = useState(initialTransaction);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Polling state — used after payment to catch webhook-driven status update
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingAttemptsRef = useRef(0);
  const MAX_POLL_ATTEMPTS = 10; // 10 × 3s = 30s max
  const POLL_INTERVAL_MS = 3000;

  const status = transaction.transactionStatus;
  const isAwaitingPayment = status === TransactionStatus.Menunggu_Pembayaran_DP;
  const isPaymentSuccess = PAYMENT_SUCCESS_STATUSES.includes(status);
  const isTerminalFailure = TERMINAL_FAILURE_STATUSES.includes(status);

  // Expiry date = transaction created + 60 minutes
  const expiryDate = new Date(
    new Date(transaction.createdAt).getTime() + 60 * 60 * 1000,
  );

  // ── Auto-refresh polling logic (Task 10) ──
  const fetchLatestStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${transaction.id}/status`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.data?.transactionStatus) {
        setTransaction((prev) => ({
          ...prev,
          transactionStatus: data.data.transactionStatus,
          paymentStatus: data.data.paymentStatus,
        }));
        // Stop polling once payment is confirmed
        if (PAYMENT_SUCCESS_STATUSES.includes(data.data.transactionStatus)) {
          return true; // signal to stop
        }
      }
    } catch {
      // silently ignore network errors during polling
    }
    return false;
  }, [transaction.id]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    pollingAttemptsRef.current = 0;
  }, []);

  const startPolling = useCallback(() => {
    setIsPolling(true);
    pollingAttemptsRef.current = 0;

    pollingIntervalRef.current = setInterval(async () => {
      pollingAttemptsRef.current += 1;
      const shouldStop = await fetchLatestStatus();

      if (
        shouldStop ||
        pollingAttemptsRef.current >= MAX_POLL_ATTEMPTS
      ) {
        stopPolling();
        // Final router refresh to revalidate server cache
        router.refresh();
      }
    }, POLL_INTERVAL_MS);
  }, [fetchLatestStatus, stopPolling, router]);

  // Trigger polling when arriving from payment success redirect
  useEffect(() => {
    const paymentParam = searchParams.get("payment");
    if (paymentParam === "success" && isAwaitingPayment) {
      startPolling();
    }
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Snap payment handler (Task 5) ──
  const handlePayDP = useCallback(async () => {
    setPaymentError(null);
    setIsPaymentLoading(true);

    try {
      // 1. Get Snap token from backend
      const res = await fetch("/api/payment/create-snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: transaction.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPaymentError(
          data.error?.message ||
            "Gagal membuat token pembayaran. Silakan coba lagi.",
        );
        setIsPaymentLoading(false);
        return;
      }

      const { snapToken } = data.data;

      // 2. Open Midtrans Snap popup
      if (typeof window !== "undefined" && window.snap) {
        setIsPaymentLoading(false);

        window.snap.pay(snapToken, {
          onSuccess: (result) => {
            console.log("[snap] Payment success:", result);
            // Start polling to wait for webhook to update status
            startPolling();
            router.push(`/pesanan/${transaction.id}?payment=success`);
          },
          onPending: (result) => {
            console.log("[snap] Payment pending:", result);
            router.refresh();
          },
          onError: (result) => {
            console.error("[snap] Payment error:", result);
            setPaymentError(
              "Pembayaran gagal diproses. Silakan coba kembali atau pilih metode pembayaran lain.",
            );
          },
          onClose: () => {
            console.log("[snap] Popup closed");
            router.refresh();
          },
        });
      } else {
        // Fallback: redirect to Snap page
        const { snapRedirectUrl } = data.data;
        if (snapRedirectUrl) {
          window.location.href = snapRedirectUrl;
        } else {
          setPaymentError(
            "Snap.js belum siap. Pastikan koneksi internet Anda aktif dan refresh halaman.",
          );
          setIsPaymentLoading(false);
        }
      }
    } catch (err) {
      console.error("[snap] Unexpected error:", err);
      setPaymentError("Terjadi kesalahan jaringan saat memproses pembayaran.");
      setIsPaymentLoading(false);
    }
  }, [transaction.id, startPolling, router]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(transaction.transactionCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [transaction.transactionCode]);

  // ── Render ──
  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Breadcrumb ── */}
        <div>
          <Link
            href="/pesanan"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            Kembali ke Pesanan Saya
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)] mt-2">
            Detail Pesanan
          </h1>
        </div>

        {/* ── Transaction Code + Status ── */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Invoice01Icon} size={20} className="text-emerald-700" />
            </div>
            <div>
              <p className="text-[11px] text-[var(--color-muted)]">Kode Pesanan</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-[var(--color-foreground)] font-mono tracking-wide">
                  {transaction.transactionCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="text-neutral-400 hover:text-emerald-600 transition-colors"
                  title="Salin kode pesanan"
                >
                  <HugeiconsIcon
                    icon={codeCopied ? CheckmarkCircle01Icon : Copy01Icon}
                    size={14}
                    className={codeCopied ? "text-emerald-600" : ""}
                  />
                </button>
              </div>
            </div>
          </div>
          <div className="text-xs text-[var(--color-muted)]">
            Dibuat{" "}
            {format(new Date(transaction.createdAt), "dd MMM yyyy, HH:mm", {
              locale: localeId,
            })}
          </div>
        </div>

        {/* ── TransactionStepper (AA-76) ── */}
        <TransactionStepper currentStatus={transaction.transactionStatus} />

        {/* ── Countdown Timer or Payment Banner (AA-71) ── */}
        {isAwaitingPayment && (
          <CountdownTimer
            expiryDate={expiryDate}
            onExpire={() => {
              // Reload page to show server-side Expired status
              setTimeout(() => router.refresh(), 2000);
            }}
          />
        )}

        {isPaymentSuccess && (
          <PaymentSuccessBanner />
        )}

        {/* ── Polling indicator ── */}
        {isPolling && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
            <HugeiconsIcon icon={Loading01Icon} size={14} className="animate-spin text-blue-600" />
            <span>Menunggu konfirmasi pembayaran dari server...</span>
          </div>
        )}

        {/* ── Payment Error Banner ── */}
        {paymentError && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              size={16}
              className="text-red-600 shrink-0 mt-0.5"
            />
            <div>
              <span className="font-bold block mb-0.5">Gagal memproses pembayaran:</span>
              <p>{paymentError}</p>
            </div>
          </div>
        )}

        {/* ── Main grid: items + payment summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── Column 1: Items + Rental Info (2/3 width) ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Rental Info */}
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-xs font-bold text-[var(--color-foreground)] uppercase tracking-wider mb-4">
                Info Sewa
              </h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-[var(--color-muted)]">Tanggal Mulai</p>
                  <div className="flex items-center gap-1.5 font-semibold text-[var(--color-foreground)]">
                    <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-emerald-600" />
                    {format(new Date(transaction.startDate), "EEE, dd MMM yyyy", {
                      locale: localeId,
                    })}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[var(--color-muted)]">Maks. Pengembalian</p>
                  <div className="flex items-center gap-1.5 font-semibold text-[var(--color-foreground)]">
                    <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-amber-600" />
                    {format(new Date(transaction.endDate), "EEE, dd MMM yyyy", {
                      locale: localeId,
                    })}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[var(--color-muted)]">Skema Durasi</p>
                  <p className="font-semibold text-[var(--color-foreground)]">
                    {getPricingSchemeLabel(transaction.pricingScheme)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[var(--color-muted)]">Total Durasi</p>
                  <p className="font-semibold text-[var(--color-foreground)]">
                    {transaction.totalDurationDays} hari
                  </p>
                </div>
              </div>

              {transaction.notes && (
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                  <p className="text-[11px] text-[var(--color-muted)] mb-1">Catatan untuk Toko:</p>
                  <p className="text-xs text-[var(--color-foreground)] leading-relaxed">
                    {transaction.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-xs font-bold text-[var(--color-foreground)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <HugeiconsIcon icon={ShoppingBag01Icon} size={14} className="text-[var(--color-primary)]" />
                Daftar Barang Sewa ({transaction.items.length} item)
              </h2>

              <div className="divide-y divide-[var(--color-border-soft)]">
                {transaction.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-foreground)] truncate">
                        {item.productNameSnap}
                      </p>
                      {item.unitCodeSnap && (
                        <p className="text-[11px] text-[var(--color-muted)] mt-0.5 font-mono">
                          Unit: {item.unitCodeSnap}
                        </p>
                      )}
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                          {item.quantity} × Rp {item.priceSnap.toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[var(--color-foreground)] shrink-0">
                      Rp {item.subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Column 2: Payment Summary + CTA (1/3 width) ── */}
          <div
            className={cn(
              "bg-white rounded-2xl border border-[var(--color-border)] p-6 shadow-[var(--shadow-card)] space-y-5 sticky top-24",
            )}
          >
            <h2 className="text-sm font-bold text-[var(--color-foreground)] pb-3 border-b border-[var(--color-border)]">
              Rincian Pembayaran
            </h2>

            <div className="space-y-3 text-xs">
              {/* Total */}
              <div className="flex justify-between text-[var(--color-muted)]">
                <span>Total Tarif Sewa</span>
                <span className="font-semibold text-[var(--color-foreground)]">
                  Rp {transaction.totalAmount.toLocaleString("id-ID")}
                </span>
              </div>

              {/* DP Amount */}
              <div
                className={cn(
                  "flex justify-between items-center p-3.5 rounded-2xl border",
                  isPaymentSuccess
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800",
                )}
              >
                <div>
                  <span className="block font-bold">DP 50%</span>
                  <span className="text-[10px] font-normal text-emerald-600">
                    {isPaymentSuccess ? "Sudah dibayar ✓" : "Dibayar sekarang secara online"}
                  </span>
                </div>
                <span className="text-sm font-bold">
                  Rp {transaction.dpAmount.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Remaining */}
              <div className="flex justify-between text-[var(--color-muted)] pt-1">
                <div>
                  <span>Sisa Pelunasan</span>
                  <span className="text-[10px] text-neutral-400 block">
                    Dibayar di toko saat ambil alat
                  </span>
                </div>
                <span className="font-semibold text-[var(--color-foreground)]">
                  Rp {transaction.remainingAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* CTA based on status */}
            {isAwaitingPayment && (
              <Button
                onClick={handlePayDP}
                disabled={isPaymentLoading}
                className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold h-12 rounded-xl text-xs sm:text-sm shadow-md gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPaymentLoading ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading01Icon}
                      size={16}
                      className="animate-spin"
                    />
                    Mempersiapkan Pembayaran...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                    Bayar DP Sekarang
                  </>
                )}
              </Button>
            )}

            {isPaymentSuccess && (
              <div className="space-y-2">
                <div className="text-center text-xs text-emerald-700 font-semibold py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  ✓ DP berhasil dibayar
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.refresh()}
                  className="w-full text-xs h-10 border-neutral-300 gap-1.5"
                >
                  <HugeiconsIcon icon={RefreshIcon} size={14} />
                  Perbarui Status
                </Button>
              </div>
            )}

            {isTerminalFailure && (
              <div className="text-center text-xs text-red-600 font-semibold py-2 bg-red-50 rounded-xl border border-red-200">
                Pesanan ini tidak aktif
              </div>
            )}

            <div className="pt-1">
              <Link href="/katalog">
                <Button
                  variant="ghost"
                  className="w-full text-xs h-9 text-[var(--color-muted)] hover:text-[var(--color-primary)]"
                >
                  Lihat Katalog Lainnya
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
