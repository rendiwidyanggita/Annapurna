"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  PlusSignIcon,
  Delete01Icon,
  ShoppingBag01Icon,
  DollarCircleIcon,
  Layers01Icon,
  Image01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { createProduct, updateProduct, type ProductActionState } from "./actions";

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductVariantItem {
  variantName: string;
  size?: string;
  color?: string;
  brand?: string;
}

interface ProductFormProps {
  categories: CategoryOption[];
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    categoryId: string;
    itemType: "rental_unit" | "consumable";
    pricePermalam: number;
    pricePerkegiatan1: number;
    pricePerkegiatan2: number;
    consumableStock: number;
    isActive: boolean;
    imageUrl?: string | null;
    variants: ProductVariantItem[];
  };
}

const initialState: ProductActionState = {};

export function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  // Form action binding
  const actionToUse = isEditing
    ? updateProduct.bind(null, initialData!.id)
    : createProduct;

  const [state, formAction, isPending] = useActionState(actionToUse, initialState);

  // Form States
  const [itemType, setItemType] = useState<"rental_unit" | "consumable">(
    initialData?.itemType || "rental_unit"
  );
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);
  const [previewUrl, setPreviewUrl] = useState<string>(initialData?.imageUrl || "");
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [fileError, setFileError] = useState<string | null>(null);

  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB
  const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25 MB

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = file.type.toLowerCase();
    const isImg = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(mime);
    const isVid = ["video/mp4", "video/webm"].includes(mime);

    if (!isImg && !isVid) {
      setFileError("Format file tidak didukung. Format yang diperbolehkan: JPG, PNG, WEBP, MP4, WEBM.");
      e.target.value = "";
      return;
    }

    const maxSize = isVid ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      setFileError(
        `Ukuran file melebihi batas maksimal (${isVid ? "25 MB untuk video" : "2 MB untuk gambar"}).`
      );
      e.target.value = "";
      return;
    }

    setSelectedFileName(file.name);
    const objUrl = URL.createObjectURL(file);
    setPreviewUrl(objUrl);
    setIsVideo(isVid);
  }

  // Duration Prices (raw number states)
  const [pricePermalam, setPricePermalam] = useState<number>(
    initialData?.pricePermalam || 0
  );
  const [pricePerkegiatan1, setPricePerkegiatan1] = useState<number>(
    initialData?.pricePerkegiatan1 || 0
  );
  const [pricePerkegiatan2, setPricePerkegiatan2] = useState<number>(
    initialData?.pricePerkegiatan2 || 0
  );

  // Variants Toggle & Items (AA-46)
  const [hasVariants, setHasVariants] = useState<boolean>(
    Boolean(
      initialData?.variants &&
        initialData.variants.length > 0 &&
        !initialData.variants.some((v) => v.variantName.toLowerCase() === "default")
    )
  );

  const [variants, setVariants] = useState<ProductVariantItem[]>(
    initialData?.variants &&
      initialData.variants.length > 0 &&
      !initialData.variants.some((v) => v.variantName.toLowerCase() === "default")
      ? initialData.variants
      : [{ variantName: "", size: "", color: "", brand: "" }]
  );

  // Redirect on successful creation or update
  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        router.push("/admin/dashboard/produk");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  // Variant handlers
  function handleAddVariant() {
    setVariants((prev) => [
      ...prev,
      { variantName: "", size: "", color: "", brand: "" },
    ]);
  }

  function handleRemoveVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function handleVariantChange(
    index: number,
    field: keyof ProductVariantItem,
    value: string
  ) {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  // Savings calculation helper
  function calculateSavings(durationDays: number, packagePrice: number) {
    if (pricePermalam <= 0 || packagePrice <= 0) return null;
    const standardCost = pricePermalam * durationDays;
    const diff = standardCost - packagePrice;
    if (diff <= 0) return null;
    const percentage = Math.round((diff / standardCost) * 100);
    return { diff, percentage };
  }

  const savingsK1 = calculateSavings(3, pricePerkegiatan1);
  const savingsK2 = calculateSavings(5, pricePerkegiatan2);

  return (
    <form action={formAction} className="space-y-8 max-w-4xl pb-16">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
        <Link
          href="/admin/dashboard/produk"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          Kembali ke Daftar Produk
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard/produk">
            <Button type="button" variant="outline" disabled={isPending}>
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-sm font-medium px-6"
          >
            {isPending
              ? isEditing
                ? "Menyimpan..."
                : "Menambahkan..."
              : isEditing
              ? "Simpan Perubahan"
              : "Tambah Produk"}
          </Button>
        </div>
      </div>

      {/* Global Notification Banners */}
      {state.error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700 flex items-start gap-2.5">
          <HugeiconsIcon icon={AlertCircleIcon} size={20} className="shrink-0 text-red-500 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {state.success && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-800">
          {state.success} Mengalihkan ke daftar produk...
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: Informasi Dasar (AA-44) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border-soft)]">
          <div className="p-2 rounded-md bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <HugeiconsIcon icon={ShoppingBag01Icon} size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--color-primary)]">
              1. Informasi Dasar Produk
            </h2>
            <p className="text-xs text-[var(--color-muted)]">
              Nama alat, kategori katalog, tipe item, dan status publikasi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nama Produk */}
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="name" className="text-sm font-semibold">
              Nama Produk <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Contoh: Tenda Dome Mountain Inn 4 Person"
              defaultValue={initialData?.name}
              required
              minLength={3}
              maxLength={100}
              className="bg-[var(--color-surface)]"
            />
          </div>

          {/* Kategori Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="categoryId" className="text-sm font-semibold">
              Kategori <span className="text-red-500">*</span>
            </Label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={initialData?.categoryId || ""}
              required
              className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="" disabled>
                -- Pilih Kategori --
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tipe Item */}
          <div className="space-y-1.5">
            <Label htmlFor="itemType" className="text-sm font-semibold">
              Tipe Item <span className="text-red-500">*</span>
            </Label>
            <select
              id="itemType"
              name="itemType"
              value={itemType}
              onChange={(e) => setItemType(e.target.value as "rental_unit" | "consumable")}
              className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="rental_unit">Rental Unit (Barang Sewa dengan Unit Fisik)</option>
              <option value="consumable">Consumable (Barang Habis Pakai / Sekali Beli)</option>
            </select>
          </div>

          {/* Kondisional: Stok Consumable */}
          {/* Kondisional: Stok Consumable & Karakteristik Reusable */}
          {itemType === "consumable" && (
            <div className="space-y-4 md:col-span-2 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="space-y-1.5">
                <Label htmlFor="consumableStock" className="text-sm font-semibold text-amber-900">
                  Stok Awal Barang Habis Pakai <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="consumableStock"
                  name="consumableStock"
                  type="number"
                  min="0"
                  max="9999"
                  defaultValue={initialData?.consumableStock || 0}
                  required={itemType === "consumable"}
                  placeholder="0"
                  className="bg-white max-w-xs mt-1"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-amber-200">
                <Label className="text-xs font-semibold text-amber-900 block">
                  Karakteristik Pengembalian (is_reusable) <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <label className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-amber-300 cursor-pointer hover:bg-amber-50/50">
                    <input
                      type="radio"
                      name="isReusable"
                      value="true"
                      defaultChecked={true}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">
                        Dapat Digunakan Kembali (Returnable)
                      </span>
                      <span className="text-[11px] text-neutral-500 block leading-tight mt-0.5">
                        Stok dikembalikan saat pengembalian barang (contoh: matras busa sewaan, jas hujan).
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-amber-300 cursor-pointer hover:bg-amber-50/50">
                    <input
                      type="radio"
                      name="isReusable"
                      value="false"
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">
                        Sekali Pakai (Retail / Jual Putus)
                      </span>
                      <span className="text-[11px] text-neutral-500 block leading-tight mt-0.5">
                        Stok berkurang permanen & tidak dikembalikan (contoh: gas kaleng, spirtus).
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Deskripsi */}
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="description" className="text-sm font-semibold">
              Deskripsi Produk
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Jelaskan spesifikasi, kapasitas, kelengkapan, dan tips penggunaan perlengkapan..."
              defaultValue={initialData?.description || ""}
              rows={4}
              maxLength={1000}
              className="bg-[var(--color-surface)]"
            />
          </div>

          {/* Status Aktif */}
          <div className="md:col-span-2 flex items-center justify-between p-3.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-soft)]">
            <div>
              <span className="text-sm font-semibold text-[var(--color-foreground)] block">
                Status Publikasi Produk
              </span>
              <span className="text-xs text-[var(--color-muted)]">
                Produk aktif akan langsung tampil di halaman katalog untuk customer.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                aria-label="Toggle status aktif"
              />
              <span className={`text-xs font-semibold ${isActive ? "text-emerald-700" : "text-gray-500"}`}>
                {isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: Harga per Durasi Sewa (AA-54) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border-soft)]">
          <div className="p-2 rounded-md bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <HugeiconsIcon icon={DollarCircleIcon} size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--color-primary)]">
              2. Skema Tarif per Durasi Sewa
            </h2>
            <p className="text-xs text-[var(--color-muted)]">
              Wajib mengisi 3 skema durasi: Permalam, Perkegiatan I (3H2M), dan Perkegiatan II (5H4M).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Permalam */}
          <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pricePermalam" className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Permalam (1 Malam) <span className="text-red-500">*</span>
              </Label>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-gray-200 font-medium text-gray-600">
                24 Jam
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                Rp
              </span>
              <Input
                id="pricePermalam"
                name="pricePermalam"
                type="number"
                min="1000"
                max="10000000"
                step="500"
                value={pricePermalam || ""}
                onChange={(e) => setPricePermalam(parseInt(e.target.value) || 0)}
                placeholder="50000"
                required
                className="pl-9 bg-white font-semibold text-gray-900"
              />
            </div>
            <p className="text-[11px] text-gray-500">Tarif sewa harian standar.</p>
          </div>

          {/* Perkegiatan I (3H2M) */}
          <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pricePerkegiatan1" className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Perkegiatan I <span className="text-red-500">*</span>
              </Label>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                3 Hari 2 Malam
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                Rp
              </span>
              <Input
                id="pricePerkegiatan1"
                name="pricePerkegiatan1"
                type="number"
                min="1000"
                max="50000000"
                step="500"
                value={pricePerkegiatan1 || ""}
                onChange={(e) => setPricePerkegiatan1(parseInt(e.target.value) || 0)}
                placeholder="120000"
                required
                className="pl-9 bg-white font-semibold text-gray-900"
              />
            </div>
            {savingsK1 ? (
              <p className="text-[11px] text-emerald-600 font-medium">
                Hemat {savingsK1.percentage}% (Hemat Rp {savingsK1.diff.toLocaleString("id-ID")}) vs harian
              </p>
            ) : (
              <p className="text-[11px] text-gray-500">Standar pendakian akhir pekan.</p>
            )}
          </div>

          {/* Perkegiatan II (5H4M) */}
          <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pricePerkegiatan2" className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Perkegiatan II <span className="text-red-500">*</span>
              </Label>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                5 Hari 4 Malam
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                Rp
              </span>
              <Input
                id="pricePerkegiatan2"
                name="pricePerkegiatan2"
                type="number"
                min="1000"
                max="100000000"
                step="500"
                value={pricePerkegiatan2 || ""}
                onChange={(e) => setPricePerkegiatan2(parseInt(e.target.value) || 0)}
                placeholder="180000"
                required
                className="pl-9 bg-white font-semibold text-gray-900"
              />
            </div>
            {savingsK2 ? (
              <p className="text-[11px] text-emerald-600 font-medium">
                Hemat {savingsK2.percentage}% (Hemat Rp {savingsK2.diff.toLocaleString("id-ID")}) vs harian
              </p>
            ) : (
              <p className="text-[11px] text-gray-500">Ekspedisi panjang & libur luar kota.</p>
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 3: Variasi Produk Dinamis (AA-46) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-soft)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <HugeiconsIcon icon={Layers01Icon} size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-primary)]">
                3. Variasi Produk (Ukuran / Warna / Merek)
              </h2>
              <p className="text-xs text-[var(--color-muted)]">
                Aktifkan jika produk memiliki beberapa varian opsi fisik.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={hasVariants}
              onCheckedChange={setHasVariants}
              aria-label="Toggle variasi produk"
            />
            <span className="text-xs font-semibold text-gray-700">
              {hasVariants ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>

        {/* Hidden Input serialization for server action */}
        <input
          type="hidden"
          name="variants"
          value={hasVariants ? JSON.stringify(variants.filter((v) => v.variantName.trim())) : "[]"}
        />

        {hasVariants ? (
          <div className="space-y-4">
            <div className="space-y-3">
              {variants.map((v, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] items-end"
                >
                  <div className="md:col-span-4 space-y-1">
                    <Label className="text-xs font-semibold">
                      Nama Variasi <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Contoh: Merah - Size L"
                      value={v.variantName}
                      onChange={(e) =>
                        handleVariantChange(index, "variantName", e.target.value)
                      }
                      required={hasVariants}
                      className="bg-white text-xs h-9"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs font-semibold">Ukuran</Label>
                    <Input
                      placeholder="L / 42 / 60L"
                      value={v.size || ""}
                      onChange={(e) =>
                        handleVariantChange(index, "size", e.target.value)
                      }
                      className="bg-white text-xs h-9"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs font-semibold">Warna</Label>
                    <Input
                      placeholder="Merah / Army"
                      value={v.color || ""}
                      onChange={(e) =>
                        handleVariantChange(index, "color", e.target.value)
                      }
                      className="bg-white text-xs h-9"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-xs font-semibold">Merek</Label>
                    <Input
                      placeholder="Eiger / Consina"
                      value={v.brand || ""}
                      onChange={(e) =>
                        handleVariantChange(index, "brand", e.target.value)
                      }
                      className="bg-white text-xs h-9"
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveVariant(index)}
                      disabled={variants.length === 1}
                      className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Hapus variasi ini"
                    >
                      <HugeiconsIcon icon={Delete01Icon} size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVariant}
              className="text-xs gap-1.5 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-primary)]"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={15} />
              Tambah Baris Variasi
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] text-xs text-[var(--color-muted)] flex items-center gap-3">
            <HugeiconsIcon icon={Layers01Icon} size={24} className="opacity-40 shrink-0" />
            <div>
              <p className="font-semibold text-gray-700">Produk Tunggal Tanpa Variasi</p>
              <p>
                Sistem secara otomatis akan membuat 1 variasi default di background agar unit inventaris fisik dapat ditautkan dengan benar.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 4: Media Foto / Video Produk */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border-soft)]">
          <div className="p-2 rounded-md bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <HugeiconsIcon icon={Image01Icon} size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--color-primary)]">
              4. Media & Foto / Video Produk
            </h2>
            <p className="text-xs text-[var(--color-muted)]">
              Unggah berkas foto atau video utama produk untuk ditampilkan di katalog dan galeri (opsional).
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <input type="hidden" name="imageUrl" value={initialData?.imageUrl || ""} />

          <div className="space-y-2">
            <Label htmlFor="mediaFile" className="text-sm font-semibold">
              Pilih Berkas Media (Opsional)
            </Label>
            <input
              id="mediaFile"
              name="mediaFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              onChange={handleFileChange}
              className="block w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-primary-soft)] file:text-[var(--color-primary)] hover:file:bg-emerald-100 cursor-pointer border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]"
            />
            <p className="text-xs text-[var(--color-muted)]">
              Format yang didukung: JPG, PNG, WEBP (maks. 2MB) atau MP4, WEBM (maks. 25MB). Bersifat opsional.
            </p>

            {fileError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700 mt-2">
                <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-red-600 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* Live Media Preview */}
          {previewUrl && (
            <div className="p-3.5 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-soft)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative w-28 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                {isVideo ? (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewUrl}
                    alt="Preview Media Produk"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="text-xs text-gray-600 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">
                    {selectedFileName ? "Berkas Baru Terpilih:" : "Media Saat Ini:"}
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium border border-emerald-200">
                    {isVideo ? "Video MP4/WEBM" : "Foto (Rasio 4:3)"}
                  </span>
                </div>
                <p className="text-gray-500 mt-1 truncate">
                  {selectedFileName || previewUrl}
                </p>
                {selectedFileName && (
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("mediaFile") as HTMLInputElement;
                      if (input) input.value = "";
                      setSelectedFileName("");
                      setPreviewUrl(initialData?.imageUrl || "");
                      setIsVideo(false);
                      setFileError(null);
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
                  >
                    Batal Pilih / Gunakan Semula
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-[var(--color-border)] shadow-lg flex items-center justify-between">
        <span className="text-xs text-[var(--color-muted)]">
          Pastikan semua informasi harga dan kategori telah terisi dengan benar.
        </span>

        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard/produk">
            <Button type="button" variant="outline" size="sm" disabled={isPending}>
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-sm font-semibold px-6 text-sm"
          >
            {isPending
              ? isEditing
                ? "Menyimpan..."
                : "Menambahkan..."
              : isEditing
              ? "Simpan Perubahan"
              : "Tambah Produk"}
          </Button>
        </div>
      </div>
    </form>
  );
}
