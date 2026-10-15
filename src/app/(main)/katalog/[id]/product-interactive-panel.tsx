"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DurationPricingCards } from "./duration-pricing-cards";
import { VariantSelector, type VariantItem } from "./variant-selector";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Message01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";

interface ProductInteractivePanelProps {
  productId?: string;
  productName: string;
  itemType: "rental_unit" | "consumable";
  pricePermalam: number;
  pricePerkegiatan1: number;
  pricePerkegiatan2: number;
  consumableStock: number;
  availableUnitsCount: number;
  variants: VariantItem[];
}

export function ProductInteractivePanel({
  productName,
  itemType,
  pricePermalam,
  pricePerkegiatan1,
  pricePerkegiatan2,
  consumableStock,
  availableUnitsCount,
  variants,
}: ProductInteractivePanelProps) {
  const [selectedDuration, setSelectedDuration] = useState<
    "permalam" | "perkegiatan1" | "perkegiatan2"
  >("permalam");

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || ""
  );

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  // Availability calculation
  const isAvailable =
    itemType === "consumable" ? consumableStock > 0 : availableUnitsCount > 0;

  // WhatsApp Pre-filled message generator
  const durationLabel =
    selectedDuration === "permalam"
      ? "Permalam (1 Malam)"
      : selectedDuration === "perkegiatan1"
      ? "Perkegiatan I (3 Hari 2 Malam)"
      : "Perkegiatan II (5 Hari 4 Malam)";

  const variantLabel =
    selectedVariant && selectedVariant.variantName.toLowerCase() !== "default"
      ? ` varian (${selectedVariant.variantName})`
      : "";

  const waText = encodeURIComponent(
    `Halo Annapurna Adventure, saya tertarik ingin menyewa produk "${productName}"${variantLabel} untuk paket durasi ${durationLabel}. Apakah unit tersedia untuk tanggal yang saya butuhkan?`
  );

  const waUrl = `https://wa.me/6281234567890?text=${waText}`;

  return (
    <div className="space-y-6">
      {/* Realtime Availability Status Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full ${
              isAvailable ? "bg-emerald-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-xs font-semibold text-gray-800">
            {itemType === "consumable"
              ? isAvailable
                ? `Stok Tersedia (${consumableStock} unit habis pakai)`
                : "Stok Habis"
              : isAvailable
              ? `Unit Siap Sewa (${availableUnitsCount} unit ready di toko)`
              : "Saat ini seluruh unit sedang disewa / reservasi"}
          </span>
        </div>
        <span className="text-[11px] text-[var(--color-muted)] font-medium">
          Verifikasi Real-time
        </span>
      </div>

      {/* Duration Pricing Selection (AA-54 Presentation) */}
      <DurationPricingCards
        pricePermalam={pricePermalam}
        pricePerkegiatan1={pricePerkegiatan1}
        pricePerkegiatan2={pricePerkegiatan2}
        selectedDuration={selectedDuration}
        onDurationChange={setSelectedDuration}
      />

      {/* Variant Selector (AA-46 Presentation) */}
      <VariantSelector
        variants={variants}
        selectedVariantId={selectedVariantId}
        onVariantChange={setSelectedVariantId}
      />

      {/* Action Buttons: Sewa Sekarang & Tanya via WhatsApp */}
      <div className="space-y-3 pt-2">
        <Button
          size="lg"
          disabled={!isAvailable}
          className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold h-12 shadow-sm text-sm gap-2"
        >
          <HugeiconsIcon icon={Calendar01Icon} size={18} />
          {isAvailable ? "Sewa Sekarang" : "Unit Sedang Tidak Tersedia"}
        </Button>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full block"
        >
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold h-11 text-sm gap-2"
          >
            <HugeiconsIcon icon={Message01Icon} size={18} className="text-emerald-600" />
            Tanya via WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}
