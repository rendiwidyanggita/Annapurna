"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { startOfToday, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { DurationPricingCards } from "./duration-pricing-cards";
import { VariantSelector, type VariantItem } from "./variant-selector";
import {
  RentalDateGroup,
  type DurationScheme,
} from "@/components/molecules/rental-date-group";
import { QuantityStepper } from "@/components/atoms";
import { useCartStore } from "@/store/cart-store";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Message01Icon,
  Calendar01Icon,
  ShoppingBag01Icon,
  CheckmarkCircle01Icon,
  Loading01Icon,
} from "@hugeicons/core-free-icons";

interface ProductInteractivePanelProps {
  productId: string;
  productName: string;
  imageUrl?: string | null;
  itemType: "rental_unit" | "consumable";
  pricePermalam: number;
  pricePerkegiatan1: number;
  pricePerkegiatan2: number;
  consumableStock: number;
  availableUnitsCount: number;
  variants: VariantItem[];
}

export function ProductInteractivePanel({
  productId,
  productName,
  imageUrl,
  itemType,
  pricePermalam,
  pricePerkegiatan1,
  pricePerkegiatan2,
  consumableStock,
  availableUnitsCount,
  variants,
}: ProductInteractivePanelProps) {
  const router = useRouter();
  const addItemToCart = useCartStore((state) => state.addItem);

  const [selectedDuration, setSelectedDuration] = useState<DurationScheme>("permalam");
  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants[0]?.id || "");

  const today = startOfToday();
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(addDays(today, 1));
  const [durationDays, setDurationDays] = useState<number>(1);

  // Dynamic Quantity State (Convex Reactive Pattern)
  const [quantity, setQuantity] = useState<number>(1);

  // Real-time Availability State (AA-64, AA-66)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState<boolean>(false);
  const [availabilityState, setAvailabilityState] = useState<{
    isAvailable: boolean;
    availableCount: number;
    statusLevel: "available" | "limited" | "unavailable";
    message: string;
  }>({
    isAvailable: itemType === "consumable" ? consumableStock > 0 : availableUnitsCount > 0,
    availableCount: itemType === "consumable" ? consumableStock : availableUnitsCount,
    statusLevel: (itemType === "consumable" ? consumableStock : availableUnitsCount) > 0 ? "available" : "unavailable",
    message: "Verifikasi jadwal sewa Anda.",
  });

  // Reactive auto-clamping when available unit count changes
  useEffect(() => {
    if (availabilityState.availableCount > 0) {
      setQuantity((prev) => Math.min(Math.max(1, prev), availabilityState.availableCount));
    } else {
      setQuantity(1);
    }
  }, [availabilityState.availableCount]);

  const [addedToCartSuccess, setAddedToCartSuccess] = useState<boolean>(false);

  const handleDateChange = useCallback(
    (start: Date, end: Date, days: number) => {
      setStartDate(start);
      setEndDate(end);
      setDurationDays(days);
    },
    []
  );

  const queryKey = `${productId}-${selectedVariantId}-${startDate.toISOString()}-${endDate.toISOString()}`;
  const [prevQueryKey, setPrevQueryKey] = useState(queryKey);
  if (queryKey !== prevQueryKey) {
    setPrevQueryKey(queryKey);
    setIsCheckingAvailability(true);
  }

  // Check availability whenever dates, duration, or variant changes
  useEffect(() => {
    let ignore = false;

    const query = new URLSearchParams({
      productId,
      quantity: "1",
    });

    if (selectedVariantId) {
      query.set("variantId", selectedVariantId);
    }

    if (itemType === "rental_unit") {
      query.set("startDate", startDate.toISOString());
      query.set("endDate", endDate.toISOString());
    }

    fetch(`/api/availability?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.success && data.data) {
          setAvailabilityState({
            isAvailable: data.data.isAvailable,
            availableCount: data.data.availableCount,
            statusLevel: data.data.statusLevel,
            message: data.data.message,
          });
        }
      })
      .catch(() => {
        // Fallback to initial count on network error
      })
      .finally(() => {
        if (!ignore) {
          setIsCheckingAvailability(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [productId, selectedVariantId, startDate, endDate, itemType]);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  // Calculate current unit price based on selected duration
  const currentUnitPrice =
    selectedDuration === "permalam"
      ? pricePermalam
      : selectedDuration === "perkegiatan1"
      ? pricePerkegiatan1
      : pricePerkegiatan2;

  // Add to cart helper
  const handleAddToCart = (redirectAfter: boolean = false) => {
    if (!availabilityState.isAvailable) return;

    addItemToCart({
      productId,
      productName,
      imageUrl,
      itemType,
      variantId: selectedVariantId || undefined,
      variantName:
        selectedVariant && selectedVariant.variantName.toLowerCase() !== "default"
          ? selectedVariant.variantName
          : undefined,
      durationScheme: selectedDuration,
      durationDays,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      unitPrice: currentUnitPrice,
      quantity,
    });

    if (redirectAfter) {
      router.push("/checkout");
    } else {
      setAddedToCartSuccess(true);
      setTimeout(() => setAddedToCartSuccess(false), 2500);
    }
  };

  // WhatsApp Pre-filled message generator
  const durationLabel =
    selectedDuration === "permalam"
      ? "Permalam (1 Malam)"
      : selectedDuration === "perkegiatan1"
      ? "Perkegiatan I (3 Hari 3 Malam)"
      : "Perkegiatan II (5 Hari 5 Malam)";

  const variantLabel =
    selectedVariant && selectedVariant.variantName.toLowerCase() !== "default"
      ? ` varian (${selectedVariant.variantName})`
      : "";

  const waText = encodeURIComponent(
    `Halo Annapurna Adventure, saya tertarik ingin menyewa produk "${productName}"${variantLabel} sebanyak ${quantity} unit untuk paket durasi ${durationLabel} tanggal ${startDate.toLocaleDateString("id-ID")}. Apakah unit tersedia?`
  );

  const waUrl = `https://wa.me/6281234567890?text=${waText}`;

  return (
    <div className="space-y-6">
      {/* Realtime Availability Status Banner (AA-64, AA-66) */}
      <div
        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
          availabilityState.statusLevel === "available"
            ? "border-emerald-200 bg-emerald-50/60"
            : availabilityState.statusLevel === "limited"
            ? "border-amber-200 bg-amber-50/70"
            : "border-red-200 bg-red-50/60"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isCheckingAvailability ? (
            <HugeiconsIcon icon={Loading01Icon} size={16} className="text-emerald-700 animate-spin" />
          ) : (
            <div
              className={`w-3 h-3 rounded-full ${
                availabilityState.statusLevel === "available"
                  ? "bg-emerald-500 animate-pulse"
                  : availabilityState.statusLevel === "limited"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
          )}
          <span className="text-xs font-semibold text-gray-800">
            {availabilityState.message}
          </span>
        </div>
        <span className="text-[10px] text-[var(--color-muted)] font-mono uppercase tracking-wider">
          Live Check
        </span>
      </div>

      {/* 1. Duration Pricing Selection (AA-54 & AA-61) */}
      <DurationPricingCards
        pricePermalam={pricePermalam}
        pricePerkegiatan1={pricePerkegiatan1}
        pricePerkegiatan2={pricePerkegiatan2}
        selectedDuration={selectedDuration}
        onDurationChange={setSelectedDuration}
      />

      {/* 2. Rental Date & Schedule Group (AA-62, AA-63) */}
      {itemType === "rental_unit" && (
        <RentalDateGroup
          durationScheme={selectedDuration}
          startDate={startDate}
          onDateChange={handleDateChange}
        />
      )}

      {/* 3. Variant Selector (AA-46) */}
      {variants.length > 0 && !(variants.length === 1 && variants[0].variantName.toLowerCase() === "default") && (
        <VariantSelector
          variants={variants}
          selectedVariantId={selectedVariantId}
          onVariantChange={setSelectedVariantId}
        />
      )}

      {/* Success Notification on Added to Cart */}
      {addedToCartSuccess && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
            <span>Berhasil ditambahkan ke keranjang sewa!</span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="underline text-[11px] hover:text-emerald-100"
          >
            Lihat Keranjang
          </button>
        </div>
      )}

      {/* 4. Quantity Stepper (Dynamic schedule-aware) */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/70">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-gray-800">Jumlah Unit Sewa</div>
          <div className="text-[11px] text-[var(--color-muted)]">
            {availabilityState.availableCount > 0 ? (
              <span>Maksimal {availabilityState.availableCount} unit untuk jadwal ini</span>
            ) : (
              <span className="text-red-500">Unit tidak tersedia</span>
            )}
          </div>
        </div>
        <QuantityStepper
          value={quantity}
          min={1}
          max={availabilityState.availableCount}
          disabled={!availabilityState.isAvailable || isCheckingAvailability}
          onChange={setQuantity}
          label=""
        />
      </div>

      {/* Action Buttons: Sewa Sekarang, Tambah ke Keranjang, & WhatsApp */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={!availabilityState.isAvailable || isCheckingAvailability}
            onClick={() => handleAddToCart(false)}
            className="w-full border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-emerald-50 font-bold h-12 text-xs gap-2 rounded-xl"
          >
            <HugeiconsIcon icon={ShoppingBag01Icon} size={17} />
            + Keranjang
          </Button>

          <Button
            type="button"
            size="lg"
            disabled={!availabilityState.isAvailable || isCheckingAvailability}
            onClick={() => handleAddToCart(true)}
            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold h-12 shadow-sm text-xs gap-2 rounded-xl"
          >
            <HugeiconsIcon icon={Calendar01Icon} size={17} />
            {availabilityState.isAvailable ? "Sewa Sekarang" : "Tidak Tersedia"}
          </Button>
        </div>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full block"
        >
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="w-full text-emerald-700 hover:bg-emerald-50 font-semibold h-10 text-xs gap-2 rounded-xl"
          >
            <HugeiconsIcon icon={Message01Icon} size={16} className="text-emerald-600" />
            Tanya Stok / Konsultasi via WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}
