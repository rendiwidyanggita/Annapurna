"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Layers01Icon,
  Image01Icon,
  AlertCircleIcon,
  Loading03Icon,
  CheckmarkCircle02Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { createProduct, updateProduct, type ProductActionState } from "./actions";
import { cn } from "@/lib/utils";

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

  const actionToUse = isEditing
    ? updateProduct.bind(null, initialData!.id)
    : createProduct;

  const [state, formAction, isPending] = useActionState(actionToUse, initialState);

  // Form State
  const [itemType, setItemType] = useState<"rental_unit" | "consumable">(
    initialData?.itemType || "rental_unit"
  );
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);
  const [isReusable, setIsReusable] = useState<boolean>(true);
  const [previewUrl, setPreviewUrl] = useState<string>(initialData?.imageUrl || "");
  const [isVideo, setIsVideo] = useState<boolean>(false);
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

    const objUrl = URL.createObjectURL(file);
    setPreviewUrl(objUrl);
    setIsVideo(isVid);
  }

  // Duration Prices
  const [pricePermalam, setPricePermalam] = useState<number>(
    initialData?.pricePermalam || 35000
  );
  const [pricePerkegiatan1, setPricePerkegiatan1] = useState<number>(
    initialData?.pricePerkegiatan1 || 85000
  );
  const [pricePerkegiatan2, setPricePerkegiatan2] = useState<number>(
    initialData?.pricePerkegiatan2 || 130000
  );

  // Variants state
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
      : [{ variantName: "Standar", size: "", color: "", brand: "" }]
  );

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        router.push("/admin/dashboard/produk");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  function handleAddVariant() {
    setVariants((prev) => [
      ...prev,
      { variantName: "", size: "", color: "", brand: "" },
    ]);
  }

  function handleRemoveVariant(index: number) {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdateVariant(
    index: number,
    field: keyof ProductVariantItem,
    value: string
  ) {
    setVariants((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* ── Top Header Navigation Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard/produk"
            className="p-2 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-gray-50 transition-colors"
            title="Kembali ke katalog produk"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#111827]">
              {isEditing ? `Edit Produk: ${initialData?.name}` : "Tambah Produk Rental Baru"}
            </h1>
            <p className="text-xs text-[#6B7280]">
              Format formulir modular 12-kolom (Archetype B)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard/produk">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className="text-xs font-semibold h-9 border-[#E5E7EB]"
            >
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#16624B] hover:bg-[#0F4F3C] text-white text-xs font-semibold h-9 px-5 shadow-2xs gap-1.5"
          >
            {isPending && <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />}
            <span>
              {isPending
                ? isEditing
                  ? "Menyimpan..."
                  : "Menambahkan..."
                : isEditing
                ? "Simpan Perubahan"
                : "Simpan Produk"}
            </span>
          </Button>
        </div>
      </div>

      {/* ── Feedback Banners ── */}
      {state.error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-700 flex items-start gap-2.5">
          <HugeiconsIcon icon={AlertCircleIcon} size={20} className="shrink-0 text-red-500 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {state.success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-800 flex items-start gap-2.5">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} className="shrink-0 text-emerald-600 mt-0.5" />
          <span>{state.success} Mengalihkan ke katalog produk...</span>
        </div>
      )}

      {/* ── Archetype B Grid (8 Columns Left, 4 Columns Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ═══════════════════════════════════════════════════════════════
            LEFT COLUMN (8 Columns): General Info, Duration Pricing, Variants
           ═══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Informasi Umum Produk */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-5">
            <div className="border-b border-[#E5E7EB] pb-3">
              <h2 className="text-base font-bold text-[#111827]">
                Informasi Umum Produk
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Masukkan nama alat outdoor dan deskripsi spesifikasi yang disewakan.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="block text-xs font-bold text-[#111827] mb-1.5">
                  Nama Produk <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Contoh: Tenda Dome Eiger Shira 4P Double Layer"
                  defaultValue={initialData?.name}
                  required
                  minLength={3}
                  maxLength={100}
                  className="bg-[#F9FAFB] border-gray-200 text-sm text-[#111827] focus-visible:ring-[#16624B]/30"
                />
              </div>

              <div>
                <Label htmlFor="description" className="block text-xs font-bold text-[#111827] mb-1.5">
                  Deskripsi & Kelengkapan Alat
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Jelaskan kapasitas, bahan, kelengkapan alat (misal: frame alloy, pasak 10 pcs, raincover bawaan)..."
                  defaultValue={initialData?.description || ""}
                  className="bg-[#F9FAFB] border-gray-200 text-sm text-[#111827] resize-y focus-visible:ring-[#16624B]/30"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Skema Harga Berdasarkan Durasi Sewa (FR-06, AA-54) */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#111827]">
                  Harga Sewa Berdasarkan Durasi
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  DP 50% dihitung otomatis saat checkout sesuai durasi sewa yang dipilih customer.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E7F3EE] text-[#16624B] uppercase tracking-wider">
                Wajib Diisi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Permalam */}
              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2">
                <Label
                  htmlFor="pricePermalam"
                  className="block text-xs font-bold uppercase tracking-wider text-[#16624B]"
                >
                  1. Permalam <span className="text-red-500">*</span>
                </Label>
                <p className="text-[11px] text-[#6B7280]">
                  Pengembalian esok hari (+1 hari)
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6B7280]">
                    Rp
                  </span>
                  <Input
                    id="pricePermalam"
                    name="pricePermalam"
                    type="number"
                    min="1000"
                    step="1000"
                    value={pricePermalam}
                    onChange={(e) => setPricePermalam(parseInt(e.target.value) || 0)}
                    required
                    className="pl-9 bg-white border-gray-200 text-sm font-bold text-[#111827] tabular-nums"
                  />
                </div>
              </div>

              {/* Perkegiatan I */}
              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2">
                <Label
                  htmlFor="pricePerkegiatan1"
                  className="block text-xs font-bold uppercase tracking-wider text-[#16624B]"
                >
                  2. Perkegiatan I <span className="text-red-500">*</span>
                </Label>
                <p className="text-[11px] text-[#6B7280]">
                  Sewa 3 Hari 3 Malam (+3 hari)
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6B7280]">
                    Rp
                  </span>
                  <Input
                    id="pricePerkegiatan1"
                    name="pricePerkegiatan1"
                    type="number"
                    min="1000"
                    step="1000"
                    value={pricePerkegiatan1}
                    onChange={(e) => setPricePerkegiatan1(parseInt(e.target.value) || 0)}
                    required
                    className="pl-9 bg-white border-gray-200 text-sm font-bold text-[#111827] tabular-nums"
                  />
                </div>
              </div>

              {/* Perkegiatan II */}
              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2">
                <Label
                  htmlFor="pricePerkegiatan2"
                  className="block text-xs font-bold uppercase tracking-wider text-[#16624B]"
                >
                  3. Perkegiatan II <span className="text-red-500">*</span>
                </Label>
                <p className="text-[11px] text-[#6B7280]">
                  Sewa 5 Hari 5 Malam (+5 hari)
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6B7280]">
                    Rp
                  </span>
                  <Input
                    id="pricePerkegiatan2"
                    name="pricePerkegiatan2"
                    type="number"
                    min="1000"
                    step="1000"
                    value={pricePerkegiatan2}
                    onChange={(e) => setPricePerkegiatan2(parseInt(e.target.value) || 0)}
                    required
                    className="pl-9 bg-white border-gray-200 text-sm font-bold text-[#111827] tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Variasi & Stok (AA-46) */}
          {itemType === "rental_unit" ? (
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                <div>
                  <h2 className="text-base font-bold text-[#111827]">
                    Variasi Produk & Unit Fisik
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Produk sewa memiliki variasi spesifik (ukuran, warna, merek) untuk pelacakan fisik.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="hasVariantsToggle"
                    checked={hasVariants}
                    onCheckedChange={(checked) => {
                      setHasVariants(checked);
                      if (!checked) {
                        setVariants([{ variantName: "Standar", size: "", color: "", brand: "" }]);
                      }
                    }}
                  />
                  <Label htmlFor="hasVariantsToggle" className="text-xs font-semibold text-[#111827] cursor-pointer">
                    Ada Multi-Variasi
                  </Label>
                </div>
              </div>

              {hasVariants ? (
                <div className="space-y-4">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]/70 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#16624B]">
                          Variasi #{idx + 1}
                        </span>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 text-xs font-medium"
                            title="Hapus variasi ini"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={15} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px] font-semibold text-[#111827]">
                            Nama Variasi <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="Contoh: Ukuran L - Hijau"
                            value={v.variantName}
                            onChange={(e) => handleUpdateVariant(idx, "variantName", e.target.value)}
                            required
                            className="h-9 text-xs bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-[#111827]">
                            Ukuran (Size)
                          </Label>
                          <Input
                            placeholder="Contoh: L / 65L"
                            value={v.size || ""}
                            onChange={(e) => handleUpdateVariant(idx, "size", e.target.value)}
                            className="h-9 text-xs bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-[#111827]">
                            Warna Dominan
                          </Label>
                          <Input
                            placeholder="Contoh: Hijau Forest"
                            value={v.color || ""}
                            onChange={(e) => handleUpdateVariant(idx, "color", e.target.value)}
                            className="h-9 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddVariant}
                    className="w-full text-xs font-semibold h-9 border-dashed border-[#16624B] text-[#16624B] hover:bg-[#E7F3EE]"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={15} className="mr-1" />
                    + Tambah Variasi Produk
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]/50 text-xs text-[#6B7280]">
                  Produk menggunakan variasi tunggal bawaan (<strong>Standar</strong>). Unit fisik dapat didaftarkan di halaman Manajemen Unit setelah produk disimpan.
                </div>
              )}

              {/* Hidden serialized variants input */}
              <input
                type="hidden"
                name="variants"
                value={JSON.stringify(variants)}
              />
            </div>
          ) : (
            /* Consumable Stock & Reusable Settings */
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-4">
              <div className="border-b border-[#E5E7EB] pb-3">
                <h2 className="text-base font-bold text-[#111827]">
                  Pengaturan Stok Consumable
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Barang habis pakai atau stok massal tanpa pelacakan kode nomor fisik.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 max-w-xs">
                  <Label htmlFor="consumableStock" className="text-xs font-bold text-[#111827]">
                    Stok Awal Kuantitas <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="consumableStock"
                    name="consumableStock"
                    type="number"
                    min="0"
                    max="9999"
                    defaultValue={initialData?.consumableStock || 0}
                    required={itemType === "consumable"}
                    className="bg-[#F9FAFB] border-gray-200 text-sm font-bold tabular-nums"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between">
                  <div className="pr-3">
                    <p className="text-xs font-bold text-[#111827]">
                      Dapat Digunakan Kembali (is_reusable)
                    </p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      Matikan jika barang sekali pakai habis (seperti tabung gas portable).
                    </p>
                  </div>
                  <Switch
                    checked={isReusable}
                    onCheckedChange={setIsReusable}
                    aria-label="Apakah barang bisa dipakai ulang"
                  />
                  <input type="hidden" name="isReusable" value={isReusable ? "true" : "false"} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT COLUMN (4 Columns): Media, Category & Item Type Classification
           ═══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 4: Media Uploader (FR-53, FR-54) */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-4">
            <div className="border-b border-[#E5E7EB] pb-3">
              <h2 className="text-base font-bold text-[#111827]">
                Media Produk (Foto / Video)
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Foto cover utama yang tampil di katalog dan kartu produk.
              </p>
            </div>

            {/* Media Preview Box */}
            {previewUrl ? (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-[#16624B] bg-black">
                  {isVideo ? (
                    <video
                      src={previewUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Image
                      src={previewUrl}
                      alt="Pratinjau media produk"
                      fill
                      className="object-cover"
                    />
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#16624B] text-white text-[10px] font-bold uppercase tracking-wider">
                    Cover Utama
                  </span>
                </div>

                <p className="text-[11px] text-[#6B7280] text-center">
                  Ganti media dengan memilih berkas baru di bawah ini.
                </p>
              </div>
            ) : null}

            {/* Dropzone Upload */}
            <div className="relative border-2 border-dashed border-[#E5E7EB] hover:border-[#16624B] rounded-xl p-5 text-center transition bg-[#F9FAFB]">
              <HugeiconsIcon icon={Upload01Icon} size={28} className="mx-auto text-[#16624B] mb-2" />
              <p className="text-xs font-bold text-[#111827]">
                Pilih Berkas Media
              </p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                WEBP, JPG, PNG, MP4 (Maks. 25MB)
              </p>

              <input
                type="file"
                name="mediaFile"
                id="mediaFile"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {fileError && (
              <p className="text-xs text-red-600 font-medium">{fileError}</p>
            )}

            <input type="hidden" name="imageUrl" value={initialData?.imageUrl || ""} />
          </div>

          {/* Card 5: Kategori & Klasifikasi Item Type */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-5">
            <div className="border-b border-[#E5E7EB] pb-3">
              <h2 className="text-base font-bold text-[#111827]">
                Kategori & Klasifikasi
              </h2>
            </div>

            {/* Kategori Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="categoryId" className="block text-xs font-bold text-[#111827]">
                Kategori Produk <span className="text-red-500">*</span>
              </Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={initialData?.categoryId || ""}
                required
                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-[#F9FAFB] text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16624B]/30"
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

            {/* Tipe Item Radio Selection */}
            <div className="space-y-2 pt-2">
              <Label className="block text-xs font-bold text-[#111827]">
                Tipe Item (item_type) <span className="text-red-500">*</span>
              </Label>

              <label
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  itemType === "rental_unit"
                    ? "border-[#16624B] bg-[#E7F3EE]/50"
                    : "border-gray-200 hover:bg-gray-50"
                )}
              >
                <input
                  type="radio"
                  name="itemType"
                  value="rental_unit"
                  checked={itemType === "rental_unit"}
                  onChange={() => setItemType("rental_unit")}
                  className="mt-0.5 text-[#16624B]"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#111827] block">
                    Rental Unit (Wajib Kembali)
                  </span>
                  <span className="text-[#6B7280] leading-tight block mt-0.5">
                    Dilacak per kode inventaris fisik, wajib proses Handover & Return.
                  </span>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  itemType === "consumable"
                    ? "border-[#16624B] bg-[#E7F3EE]/50"
                    : "border-gray-200 hover:bg-gray-50"
                )}
              >
                <input
                  type="radio"
                  name="itemType"
                  value="consumable"
                  checked={itemType === "consumable"}
                  onChange={() => setItemType("consumable")}
                  className="mt-0.5 text-[#16624B]"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#111827] block">
                    Consumable (Habis Pakai)
                  </span>
                  <span className="text-[#6B7280] leading-tight block mt-0.5">
                    Stok kuantitas massal tanpa pelacakan nomor inventaris fisik.
                  </span>
                </div>
              </label>
            </div>

            {/* Status Aktif Switch */}
            <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#111827]">
                  Status Tampil di Katalog
                </p>
                <p className="text-[11px] text-[#6B7280]">
                  Produk aktif dapat disewa customer
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                aria-label="Status aktif katalog"
              />
              <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />
            </div>
          </div>

          {/* Card 6: Submit Button */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-3">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#16624B] hover:bg-[#0F4F3C] text-white font-bold text-xs h-10 shadow-2xs gap-2"
            >
              {isPending && <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />}
              <span>
                {isPending
                  ? isEditing
                    ? "Menyimpan Perubahan..."
                    : "Menambahkan Produk..."
                  : isEditing
                  ? "Simpan Perubahan Produk"
                  : "Tambahkan Produk Baru"}
              </span>
            </Button>
            <Link href="/admin/dashboard/produk" className="block">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                className="w-full text-xs font-semibold h-9 border-[#E5E7EB]"
              >
                Batal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
