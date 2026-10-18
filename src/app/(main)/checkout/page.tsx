"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Shield01Icon,
  ShoppingBag01Icon,
  AlertCircleIcon,
  Loading01Icon,
  CheckmarkCircle01Icon,
  LockIcon,
} from "@hugeicons/core-free-icons";
import { getDurationLabel } from "@/components/molecules/rental-date-group";

export default function CheckoutPage() {
  const router = useRouter();
  const mounted = useIsMounted();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    items,
    clearCart,
    getTotalPrice,
    getDpAmount,
    getRemainingAmount,
  } = useCartStore();

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-surface)]">
        <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-3xl border border-[var(--color-border)] shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <HugeiconsIcon icon={ShoppingBag01Icon} size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Tidak Ada Item untuk Di-Checkout
          </h1>
          <p className="text-xs text-gray-500">
            Keranjang Anda saat ini kosong. Silakan tambahkan alat outdoor terlebih dahulu.
          </p>
          <div className="pt-2">
            <Link href="/katalog">
              <Button className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-semibold h-11 text-xs rounded-xl">
                Jelajahi Katalog Alat
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = getTotalPrice();
  const dpAmount = getDpAmount();
  const remainingAmount = getRemainingAmount();

  async function handleCheckout() {
    if (!termsAccepted) {
      setErrorMessage("Anda wajib menyetujui Syarat & Ketentuan sewa sebelum melanjutkan.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || null,
          productName: i.productName,
          itemType: i.itemType,
          durationScheme: i.durationScheme,
          startDate: i.startDate,
          endDate: i.endDate,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
        termsAccepted: true,
        notes: notes.trim() || undefined,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          // Redirect to login with return url
          router.push(`/login?redirect=${encodeURIComponent("/checkout")}`);
          return;
        }

        if (res.status === 409) {
          // Conflict / Overbooking detected!
          setErrorMessage(
            data.error?.message ||
              "Terjadi bentrok jadwal sewa! Unit fisik yang Anda pilih telah dipesan oleh pengguna lain. Silakan periksa kembali keranjang Anda."
          );
          setIsSubmitting(false);
          return;
        }

        setErrorMessage(data.error?.message || "Gagal memproses checkout reservasi.");
        setIsSubmitting(false);
        return;
      }

      // Success! Clear cart and route to invoice / pending payment page
      clearCart();
      const transactionId = data.data.transactionId;
      router.push(`/pesanan/${transactionId}`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan jaringan saat memproses reservasi."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/cart"
            className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] inline-flex items-center gap-1 transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            Kembali ke Keranjang
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)] mt-2">
            Konfirmasi Reservasi & Checkout
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            Periksa kembali detail jadwal sewa, syarat ketentuan, dan pembayaran DP Anda.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-3 shadow-xs animate-shake">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              size={18}
              className="text-red-600 shrink-0 mt-0.5"
            />
            <div className="space-y-1">
              <span className="font-bold block">Pemberitahuan Ketersediaan / Validasi:</span>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (2 cols): Summary of Items & S&K Checkbox */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Breakdown Card */}
            <div className="bg-white rounded-3xl border border-[var(--color-border)] p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-gray-900 pb-3 border-b border-[var(--color-border)]">
                Daftar Barang yang Disewa ({items.length} item)
              </h2>

              <div className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden relative shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <HugeiconsIcon icon={ShoppingBag01Icon} size={18} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 block truncate">
                          {item.productName}
                        </span>
                        <div className="text-[11px] text-neutral-500 flex flex-wrap items-center gap-2 mt-0.5">
                          {item.variantName && <span>{item.variantName}</span>}
                          <span>•</span>
                          <span>{getDurationLabel(item.durationScheme)}</span>
                          <span>•</span>
                          <span>Jml: {item.quantity}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">
                          {format(new Date(item.startDate), "dd/MM/yy", { locale: localeId })} –{" "}
                          {format(new Date(item.endDate), "dd/MM/yy", { locale: localeId })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-800">
                        Rp {(item.unitPrice * item.quantity).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Catatan untuk Toko */}
            <div className="bg-white rounded-3xl border border-[var(--color-border)] p-6 shadow-xs space-y-3">
              <label htmlFor="notes" className="text-xs font-bold text-gray-900 block">
                Catatan Tambahan untuk Toko (Opsional)
              </label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Perkiraan jam pengambilan sore hari, konfirmasi tenda warna hijau..."
                className="text-xs bg-neutral-50 border-neutral-300 rounded-xl"
              />
            </div>

            {/* Checkbox Syarat & Ketentuan (AA-59) */}
            <div className="bg-white rounded-3xl border border-[var(--color-border)] p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                <HugeiconsIcon icon={Shield01Icon} size={18} className="text-emerald-700" />
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Persetujuan Syarat & Ketentuan (Wajib)
                </h2>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                <input
                  id="termsCheckbox"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="termsCheckbox"
                  className="text-xs text-neutral-700 leading-relaxed cursor-pointer select-none"
                >
                  Saya telah membaca, memahami, dan menyetujui seluruh{" "}
                  <Link
                    href="/syarat-ketentuan"
                    target="_blank"
                    className="font-bold text-emerald-700 underline hover:text-emerald-800"
                  >
                    Syarat & Ketentuan Sewa
                  </Link>{" "}
                  di Annapurna Adventure, termasuk kewajiban menyerahkan identitas asli (KTP/SIM) dan aturan denda keterlambatan/kerusakan.
                </label>
              </div>
            </div>
          </div>

          {/* Right Column (1 col): Payment Summary & CTA */}
          <div className="bg-white rounded-3xl border border-[var(--color-border)] p-6 shadow-sm space-y-6 sticky top-24">
            <h2 className="text-base font-bold text-gray-900 pb-3 border-b border-[var(--color-border)]">
              Rincian Pembayaran
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Total Tarif Sewa</span>
                <span className="font-semibold text-gray-900">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                <div>
                  <span className="block font-bold">DP Wajib (50%)</span>
                  <span className="text-[10px] text-emerald-600 font-normal">
                    Dibayar sekarang secara online
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-800">
                  Rp {dpAmount.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex justify-between text-neutral-600 pt-1">
                <div>
                  <span>Sisa Pelunasan</span>
                  <span className="text-[10px] text-neutral-400 block">
                    Dibayar di outlet saat ambil alat
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  Rp {remainingAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600 flex items-start gap-2">
              <HugeiconsIcon icon={LockIcon} size={15} className="text-neutral-500 shrink-0 mt-0.5" />
              <p>
                Setelah klik tombol di bawah, jadwal unit fisik akan dikunci sementara (soft-hold) untuk Anda.
              </p>
            </div>

            <Button
              type="button"
              disabled={!termsAccepted || isSubmitting}
              onClick={handleCheckout}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold h-12 rounded-xl text-xs sm:text-sm shadow-md gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <HugeiconsIcon icon={Loading01Icon} size={16} className="animate-spin" />
                  Mengunci Unit & Memproses...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                  Konfirmasi & Bayar DP
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
