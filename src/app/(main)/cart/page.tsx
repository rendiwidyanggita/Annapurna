"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBag01Icon,
  Delete01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Calendar03Icon,
  Layers01Icon,
  Add01Icon,
  Remove01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { getDurationLabel } from "@/components/molecules/rental-date-group";

export default function CartPage() {
  const router = useRouter();
  const mounted = useIsMounted();

  const {
    items,
    removeItem,
    updateQuantity,
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

  const totalPrice = getTotalPrice();
  const dpAmount = getDpAmount();
  const remainingAmount = getRemainingAmount();

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-surface)]">
        <div className="max-w-md w-full text-center space-y-5 bg-white p-8 rounded-3xl border border-[var(--color-border)] shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <HugeiconsIcon icon={ShoppingBag01Icon} size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900">
              Keranjang Sewa Kosong
            </h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              Anda belum menambahkan alat outdoor maupun paket camping ke dalam daftar sewa.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/katalog">
              <Button className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-semibold h-11 text-xs gap-2 rounded-xl">
                <HugeiconsIcon icon={ShoppingBag01Icon} size={16} />
                Jelajahi Katalog Alat
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/katalog"
                className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] inline-flex items-center gap-1 transition-colors"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                Kembali ke Katalog
              </Link>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              Keranjang Sewa ({items.length} item)
            </h1>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 self-start sm:self-auto"
          >
            <HugeiconsIcon icon={Delete01Icon} size={14} />
            Kosongkan Keranjang
          </Button>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Column 1: Items List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const startDateFormatted = format(
                new Date(item.startDate),
                "dd MMM yyyy",
                { locale: localeId }
              );
              const endDateFormatted = format(
                new Date(item.endDate),
                "dd MMM yyyy",
                { locale: localeId }
              );

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[var(--color-border)] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:border-emerald-300"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden relative shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <HugeiconsIcon icon={ShoppingBag01Icon} size={24} />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-sm font-bold text-gray-900 truncate">
                        {item.productName}
                      </h2>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                        title="Hapus dari keranjang"
                      >
                        <HugeiconsIcon icon={Delete01Icon} size={16} />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-600">
                      {item.variantName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-medium">
                          <HugeiconsIcon icon={Layers01Icon} size={12} />
                          {item.variantName}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                        <HugeiconsIcon icon={Calendar03Icon} size={12} />
                        {getDurationLabel(item.durationScheme)}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                      <span>Jadwal:</span>
                      <span className="font-semibold text-neutral-800">
                        {startDateFormatted} – {endDateFormatted}
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      {/* Price per item */}
                      <div>
                        <span className="text-xs font-bold text-emerald-800">
                          Rp {(item.unitPrice * item.quantity).toLocaleString("id-ID")}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-neutral-400 block">
                            (Rp {item.unitPrice.toLocaleString("id-ID")} / item)
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden bg-neutral-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-neutral-200 text-neutral-600 transition-colors"
                        >
                          <HugeiconsIcon icon={Remove01Icon} size={13} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-neutral-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-neutral-200 text-neutral-600 transition-colors"
                        >
                          <HugeiconsIcon icon={Add01Icon} size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-2">
              <Link href="/katalog">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs font-semibold h-10 border-neutral-300 gap-1.5"
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} />
                  Tambah Alat Lainnya
                </Button>
              </Link>
            </div>
          </div>

          {/* Column 2: Order Summary Card (1 col) */}
          <div className="bg-white rounded-3xl border border-[var(--color-border)] p-6 shadow-sm space-y-6 sticky top-24">
            <h2 className="text-base font-bold text-gray-900 pb-3 border-b border-[var(--color-border)]">
              Ringkasan Pembayaran
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal Tarif Sewa</span>
                <span className="font-semibold text-gray-900">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-semibold">
                <div>
                  <span className="block font-bold">DP Wajib (50%)</span>
                  <span className="text-[10px] text-emerald-600 font-normal">
                    Dibayar sekarang secara online
                  </span>
                </div>
                <span className="text-sm font-bold">
                  Rp {dpAmount.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex justify-between text-neutral-600 pt-1">
                <div>
                  <span>Sisa Pelunasan</span>
                  <span className="text-[10px] text-neutral-400 block">
                    Dibayarkan di toko saat ambil alat
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  Rp {remainingAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={16}
                className="text-amber-700 shrink-0 mt-0.5"
              />
              <p>
                Ketersediaan unit fisik akan dikunci sementara (soft-hold) selama 60 menit saat Anda melanjutkan ke checkout.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => router.push("/checkout")}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold h-12 rounded-xl text-xs sm:text-sm shadow-md gap-2"
            >
              Lanjut ke Checkout
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
