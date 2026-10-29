"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

interface DurationPricingCardsProps {
  pricePermalam: number;
  pricePerkegiatan1: number;
  pricePerkegiatan2: number;
  selectedDuration: "permalam" | "perkegiatan1" | "perkegiatan2";
  onDurationChange: (duration: "permalam" | "perkegiatan1" | "perkegiatan2") => void;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DurationPricingCards({
  pricePermalam,
  pricePerkegiatan1,
  pricePerkegiatan2,
  selectedDuration,
  onDurationChange,
}: DurationPricingCardsProps) {
  // Savings calculations
  const savingsK1 =
    pricePermalam * 3 > pricePerkegiatan1
      ? Math.round((1 - pricePerkegiatan1 / (pricePermalam * 3)) * 100)
      : null;

  const savingsK2 =
    pricePermalam * 5 > pricePerkegiatan2
      ? Math.round((1 - pricePerkegiatan2 / (pricePermalam * 5)) * 100)
      : null;

  const durations = [
    {
      id: "permalam" as const,
      title: "Permalam",
      duration: "1 Malam (24 Jam)",
      price: pricePermalam,
      badge: null,
      subtext: "Sewa harian fleksibel",
    },
    {
      id: "perkegiatan1" as const,
      title: "Perkegiatan I",
      duration: "3 Hari 3 Malam",
      price: pricePerkegiatan1,
      badge: savingsK1 ? `Hemat ${savingsK1}%` : "Populer",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      subtext: "Standar pendakian akhir pekan",
      isPopular: true,
    },
    {
      id: "perkegiatan2" as const,
      title: "Perkegiatan II",
      duration: "5 Hari 5 Malam",
      price: pricePerkegiatan2,
      badge: savingsK2 ? `Hemat ${savingsK2}%` : "Ekspedisi",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      subtext: "Ekspedisi panjang & luar kota",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
          Pilihan Paket Durasi Sewa
        </h3>
        <span className="text-[11px] text-[var(--color-muted)]">
          Klik untuk memilih durasi
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {durations.map((item) => {
          const isSelected = selectedDuration === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onDurationChange(item.id)}
              className={`relative text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]/40 shadow-sm"
                  : "border-[var(--color-border)] bg-white hover:border-gray-300"
              }`}
            >
              {/* Badge if available */}
              {item.badge && (
                <span
                  className={`absolute -top-2.5 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs ${
                    item.badgeColor || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">
                    {item.title}
                  </span>
                  {isSelected && (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      size={16}
                      className="text-[var(--color-primary)] shrink-0"
                    />
                  )}
                </div>
                <span className="text-[11px] text-[var(--color-muted)] block mt-0.5">
                  {item.duration}
                </span>
              </div>

              <div className="mt-3 pt-2 border-t border-[var(--color-border-soft)]">
                <span className="text-sm font-extrabold text-[var(--color-primary)] block">
                  {formatRupiah(item.price)}
                </span>
                <span className="text-[10px] text-gray-500 block">
                  {item.subtext}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
