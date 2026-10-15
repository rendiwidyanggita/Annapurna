"use client";

export interface VariantItem {
  id: string;
  variantName: string;
  size?: string | null;
  color?: string | null;
  brand?: string | null;
}

interface VariantSelectorProps {
  variants: VariantItem[];
  selectedVariantId: string;
  onVariantChange: (variantId: string) => void;
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
}: VariantSelectorProps) {
  // If only 1 variant or default, no need for complex selector
  const isDefaultOnly =
    variants.length === 1 &&
    variants[0].variantName.toLowerCase() === "default";

  if (variants.length <= 1 || isDefaultOnly) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
          Pilihan Variasi / Ukuran
        </h3>
        <span className="text-[11px] text-[var(--color-muted)]">
          {variants.length} variasi tersedia
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const isSelected = selectedVariantId === v.id;

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onVariantChange(v.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border-2 transition-all flex items-center gap-1.5 ${
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-xs"
                  : "border-[var(--color-border)] bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <span>{v.variantName}</span>
              {v.size && (
                <span className="text-[10px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                  {v.size}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
