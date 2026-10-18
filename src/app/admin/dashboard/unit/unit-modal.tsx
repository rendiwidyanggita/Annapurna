"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  SparklesIcon,
  Loading01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { createInventoryUnit, updateInventoryUnit } from "./actions";

interface ProductOption {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    variantName: string;
    size?: string | null;
    color?: string | null;
  }>;
}

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductOption[];
  initialData?: {
    id: string;
    productId: string;
    variantId: string;
    unitCode: string;
    notes?: string | null;
  };
}

export function UnitModal({
  isOpen,
  onClose,
  products,
  initialData,
}: UnitModalProps) {
  const isEditing = Boolean(initialData);
  const [isPending, startTransition] = useTransition();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialData?.productId || (products[0]?.id ?? "")
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    initialData?.variantId || (products[0]?.variants[0]?.id ?? "")
  );
  const [unitCode, setUnitCode] = useState<string>(initialData?.unitCode || "");
  const [notes, setNotes] = useState<string>(initialData?.notes || "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const variants = currentProduct?.variants || [];

  function handleProductChange(productId: string) {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod && prod.variants.length > 0) {
      setSelectedVariantId(prod.variants[0].id);
    } else {
      setSelectedVariantId("");
    }
  }

  function handleAutoGenerateCode() {
    if (!currentProduct) return;
    // Generate clean abbreviation: e.g. "Tenda Dome 4P" -> "TD4P", "Carrier 60L" -> "CR60"
    const words = currentProduct.name.replace(/[^a-zA-Z0-9 ]/g, "").split(" ");
    let prefix = words
      .map((w) => w[0]?.toUpperCase())
      .join("")
      .slice(0, 4);
    if (prefix.length < 2) prefix = "UNT";
    const randNum = Math.floor(100 + Math.random() * 900); // 3 digit random e.g. 101..999
    setUnitCode(`${prefix}-${randNum}`);
    setFieldErrors((prev) => ({ ...prev, unitCode: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    startTransition(async () => {
      const formData = new FormData();
      if (initialData?.id) {
        formData.append("id", initialData.id);
      }
      formData.append("productId", selectedProductId);
      formData.append("variantId", selectedVariantId);
      formData.append("unitCode", unitCode);
      if (notes) formData.append("notes", notes);

      const res = isEditing
        ? await updateInventoryUnit(formData)
        : await createInventoryUnit(formData);

      if (res.success) {
        onClose();
      } else {
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        if (res.error) {
          setErrorMessage(res.error);
        }
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[var(--color-border)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <h2 className="text-base font-semibold text-[var(--color-foreground)]">
            {isEditing ? "Edit Unit Fisik" : "Tambah Unit Fisik Inventaris"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Produk selection */}
          <div className="space-y-1.5">
            <Label htmlFor="productId" className="text-xs font-semibold">
              Produk Rental <span className="text-red-500">*</span>
            </Label>
            <select
              id="productId"
              disabled={isPending}
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Varian selection */}
          <div className="space-y-1.5">
            <Label htmlFor="variantId" className="text-xs font-semibold">
              Varian Produk <span className="text-red-500">*</span>
            </Label>
            <select
              id="variantId"
              disabled={isPending || variants.length === 0}
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.variantName} {v.size ? `(${v.size})` : ""} {v.color ? `- ${v.color}` : ""}
                </option>
              ))}
            </select>
            {fieldErrors.variantId && (
              <p className="text-xs text-red-600">{fieldErrors.variantId[0]}</p>
            )}
          </div>

          {/* Kode Unit with Auto-Generate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="unitCode" className="text-xs font-semibold">
                Kode Unit Fisik <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={handleAutoGenerateCode}
                className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
              >
                <HugeiconsIcon icon={SparklesIcon} className="w-3.5 h-3.5" />
                Auto-Generate
              </button>
            </div>
            <Input
              id="unitCode"
              placeholder="Contoh: TND-001, CR-042"
              value={unitCode}
              onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
              disabled={isPending}
              className="font-mono uppercase text-sm"
            />
            {fieldErrors.unitCode && (
              <p className="text-xs text-red-600">{fieldErrors.unitCode[0]}</p>
            )}
            <p className="text-[11px] text-[var(--color-muted)]">
              Hanya boleh huruf kapital, angka, dan tanda hubung (-). Kode harus unik.
            </p>
          </div>

          {/* Catatan Kondisi */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold">
              Catatan Kondisi / Serial Number (Opsional)
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Catatan kondisi awal, nomor seri rangka/tag, atau kelengkapan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              className="text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onClose}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending || !unitCode.trim()}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs flex items-center gap-1.5"
            >
              {isPending && <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin" />}
              {isEditing ? "Simpan Perubahan" : "Tambah Unit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
