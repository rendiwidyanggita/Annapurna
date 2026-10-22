"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  PlusSignIcon,
  Delete01Icon,
  Package01Icon,
  DollarCircleIcon,
  Image01Icon,
  AlertCircleIcon,
  Loading01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";
import { MediaUploader, type MediaItem } from "@/components/organisms/MediaUploader";
import { createRentalPackage, updateRentalPackage } from "./actions";

interface ProductOption {
  id: string;
  name: string;
  itemType: string;
  pricePermalam: number;
  category?: { name: string } | null;
  media?: Array<{ mediaUrl: string; isPrimary: boolean }>;
}

export interface PackageCompositionItem {
  productId: string;
  productName: string;
  itemType: string;
  quantity: number;
  pricePermalam: number;
  thumbnailUrl?: string;
}

interface PackageFormProps {
  products: ProductOption[];
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    pricePermalam: number;
    pricePerkegiatan1: number;
    pricePerkegiatan2: number;
    isActive: boolean;
    items: PackageCompositionItem[];
    media: MediaItem[];
  };
}

export function PackageForm({ products, initialData }: PackageFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [name, setName] = useState<string>(initialData?.name || "");
  const [description, setDescription] = useState<string>(initialData?.description || "");
  const [pricePermalam, setPricePermalam] = useState<number>(initialData?.pricePermalam || 0);
  const [pricePerkegiatan1, setPricePerkegiatan1] = useState<number>(initialData?.pricePerkegiatan1 || 0);
  const [pricePerkegiatan2, setPricePerkegiatan2] = useState<number>(initialData?.pricePerkegiatan2 || 0);
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);

  // Composition items state (AA-51)
  const [packageItems, setPackageItems] = useState<PackageCompositionItem[]>(
    initialData?.items || []
  );

  // Media state (AA-52)
  const [mediaList, setMediaList] = useState<MediaItem[]>(initialData?.media || []);

  // Modal item selector state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const [itemQuantity, setItemQuantity] = useState<number>(1);

  // Errors
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  // Calculations for bundle economy preview
  const individualTotalPermalam = packageItems.reduce(
    (acc, curr) => acc + curr.pricePermalam * curr.quantity,
    0
  );
  const totalItemPieces = packageItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const savingsPermalam = individualTotalPermalam > pricePermalam ? individualTotalPermalam - pricePermalam : 0;
  const savingsPercent = individualTotalPermalam > 0 ? Math.round((savingsPermalam / individualTotalPermalam) * 100) : 0;

  function handleAddItem() {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const existingIndex = packageItems.findIndex((i) => i.productId === prod.id);
    if (existingIndex >= 0) {
      const copy = [...packageItems];
      copy[existingIndex].quantity += itemQuantity;
      setPackageItems(copy);
    } else {
      const thumb = prod.media?.find((m) => m.isPrimary)?.mediaUrl || prod.media?.[0]?.mediaUrl;
      setPackageItems([
        ...packageItems,
        {
          productId: prod.id,
          productName: prod.name,
          itemType: prod.itemType,
          quantity: itemQuantity,
          pricePermalam: prod.pricePermalam,
          thumbnailUrl: thumb,
        },
      ]);
    }

    setIsAddItemModalOpen(false);
    setItemQuantity(1);
    setFieldErrors((prev) => ({ ...prev, items: undefined }));
  }

  function handleRemoveItem(productId: string) {
    setPackageItems(packageItems.filter((i) => i.productId !== productId));
  }

  function handleQuantityChange(productId: string, newQty: number) {
    if (newQty < 1) return;
    setPackageItems(
      packageItems.map((item) =>
        item.productId === productId ? { ...item, quantity: newQty } : item
      )
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (packageItems.length === 0) {
      setErrorMessage("Paket wajib memiliki minimal 1 item produk pembentuk.");
      setFieldErrors({ items: ["Paket wajib memiliki minimal 1 item produk pembentuk."] });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      if (initialData?.id) {
        formData.append("id", initialData.id);
      }
      formData.append("name", name);
      formData.append("description", description);
      formData.append("pricePermalam", String(pricePermalam));
      formData.append("pricePerkegiatan1", String(pricePerkegiatan1));
      formData.append("pricePerkegiatan2", String(pricePerkegiatan2));
      formData.append("isActive", String(isActive));

      const itemsPayload = packageItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      formData.append("items", JSON.stringify(itemsPayload));
      formData.append("media", JSON.stringify(mediaList));

      const res = isEditing
        ? await updateRentalPackage(initialData!.id, formData)
        : await createRentalPackage(formData);

      if (res.success) {
        router.push("/admin/dashboard/paket");
        router.refresh();
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
    <div className="space-y-6 pb-20">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard/paket"
            className="p-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-2xs"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {isEditing ? `Edit Paket: ${initialData?.name}` : "Tambah Paket Sewa Baru"}
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#16624B]/10 text-[#16624B]">
                {isEditing ? "Mode Edit" : "Paket Baru"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Konfigurasikan komposisi alat outdoor hemat, tarif 3 durasi sewa, dan galeri paket.
            </p>
          </div>
        </div>

        {/* Top Action Quick Buttons */}
        <div className="flex items-center gap-2">
          <Link href="/admin/dashboard/paket">
            <Button type="button" variant="outline" size="sm" disabled={isPending} className="text-xs h-9">
              Batal
            </Button>
          </Link>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isPending || packageItems.length === 0 || !name.trim()}
            className="bg-[#16624B] hover:bg-[#0F4F3C] text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-2xs"
          >
            {isPending ? (
              <HugeiconsIcon icon={Loading01Icon} size={15} className="animate-spin" />
            ) : (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
            )}
            <span>{isEditing ? "Perbarui Paket" : "Simpan Paket"}</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <HugeiconsIcon icon={AlertCircleIcon} size={18} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Archetype B: 12-Column Responsive Layout ── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ═══════════ LEFT COLUMN (8 COLS): Main Content ═══════════ */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Informasi Dasar Paket */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <HugeiconsIcon icon={Package01Icon} size={18} className="text-[#16624B]" />
              <h2 className="text-sm font-bold text-gray-900">
                1. Informasi Dasar Paket Sewa
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="packageName" className="text-xs font-semibold text-gray-700">
                  Nama Paket Sewa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="packageName"
                  placeholder="Contoh: Paket Camping 2 Orang Komplit, Paket Pendaki Rinjani..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  required
                  className="text-xs sm:text-sm font-medium"
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-600 font-medium">{fieldErrors.name[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="packageDesc" className="text-xs font-semibold text-gray-700">
                  Deskripsi & Peruntukan Paket
                </Label>
                <Textarea
                  id="packageDesc"
                  rows={3}
                  placeholder="Jelaskan kapasitas orang, cocok untuk gunung apa, dan benefit sewa paket..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  className="text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Card 2: 3 Tingkat Tarif Durasi Sewa */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={DollarCircleIcon} size={18} className="text-[#16624B]" />
                <h2 className="text-sm font-bold text-gray-900">
                  2. Snapshot Harga per Durasi Sewa
                </h2>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">Wajib diisi lengkap</span>
            </div>

            {/* Benchmark Estimasi Satuan */}
            <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-gray-600">
                Estimasi total harga sewa satuan produk pembentuk (Permalam):
              </span>
              <span className="font-bold text-gray-900 tabular-nums">
                Rp {individualTotalPermalam.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Permalam */}
              <div className="space-y-1.5">
                <Label htmlFor="pricePermalam" className="text-xs font-semibold text-gray-700">
                  Permalam (1 malam) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    Rp
                  </span>
                  <Input
                    id="pricePermalam"
                    type="number"
                    min="0"
                    value={pricePermalam || ""}
                    onChange={(e) => setPricePermalam(parseInt(e.target.value) || 0)}
                    disabled={isPending}
                    required
                    className="pl-9 text-xs sm:text-sm font-bold tabular-nums"
                  />
                </div>
                {fieldErrors.pricePermalam && (
                  <p className="text-xs text-red-600 font-medium">{fieldErrors.pricePermalam[0]}</p>
                )}
              </div>

              {/* 3H3M */}
              <div className="space-y-1.5">
                <Label htmlFor="pricePerkegiatan1" className="text-xs font-semibold text-gray-700">
                  Perkegiatan I (3H3M) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    Rp
                  </span>
                  <Input
                    id="pricePerkegiatan1"
                    type="number"
                    min="0"
                    value={pricePerkegiatan1 || ""}
                    onChange={(e) => setPricePerkegiatan1(parseInt(e.target.value) || 0)}
                    disabled={isPending}
                    required
                    className="pl-9 text-xs sm:text-sm font-bold tabular-nums"
                  />
                </div>
                {fieldErrors.pricePerkegiatan1 && (
                  <p className="text-xs text-red-600 font-medium">{fieldErrors.pricePerkegiatan1[0]}</p>
                )}
              </div>

              {/* 5H5M */}
              <div className="space-y-1.5">
                <Label htmlFor="pricePerkegiatan2" className="text-xs font-semibold text-gray-700">
                  Perkegiatan II (5H5M) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    Rp
                  </span>
                  <Input
                    id="pricePerkegiatan2"
                    type="number"
                    min="0"
                    value={pricePerkegiatan2 || ""}
                    onChange={(e) => setPricePerkegiatan2(parseInt(e.target.value) || 0)}
                    disabled={isPending}
                    required
                    className="pl-9 text-xs sm:text-sm font-bold tabular-nums"
                  />
                </div>
                {fieldErrors.pricePerkegiatan2 && (
                  <p className="text-xs text-red-600 font-medium">{fieldErrors.pricePerkegiatan2[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Komposisi Produk Pembentuk Paket (AA-51) */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Layers01Icon} size={18} className="text-[#16624B]" />
                <h2 className="text-sm font-bold text-gray-900">
                  3. Komposisi Isi Produk dalam Paket <span className="text-red-500">*</span>
                </h2>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsAddItemModalOpen(true)}
                disabled={isPending}
                className="bg-[#16624B] hover:bg-[#0F4F3C] text-white text-xs font-semibold h-8 px-3 flex items-center gap-1.5 shadow-2xs"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={14} />
                <span>Tambah Produk</span>
              </Button>
            </div>

            {fieldErrors.items && (
              <p className="text-xs text-red-600 font-medium">{fieldErrors.items[0]}</p>
            )}

            {packageItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl space-y-2">
                <HugeiconsIcon icon={Package01Icon} size={28} className="mx-auto text-gray-300" />
                <p className="font-semibold text-gray-700">Belum ada produk yang dimasukkan</p>
                <p className="text-[11px] text-gray-400">
                  Klik tombol &ldquo;Tambah Produk&rdquo; di atas untuk memilih item pembentuk paket ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F9FAFB] text-gray-600 font-semibold border-b border-[#E5E7EB] text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Produk</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3">Harga Satuan (Permalam)</th>
                      <th className="py-2.5 px-3">Kuantitas</th>
                      <th className="py-2.5 px-3">Subtotal Acuan</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {packageItems.map((item) => (
                      <tr key={item.productId} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            {item.thumbnailUrl ? (
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                <Image
                                  src={item.thumbnailUrl}
                                  alt={item.productName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-400 border border-gray-200">
                                <HugeiconsIcon icon={Package01Icon} size={15} />
                              </div>
                            )}
                            <span className="font-semibold text-gray-900">{item.productName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[11px] font-medium text-gray-500">
                            {item.itemType === "rental_unit" ? "Rental Unit" : "Consumable"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-700 font-medium tabular-nums">
                          Rp {item.pricePermalam.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isPending}
                              className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 text-xs font-bold transition-colors"
                            >
                              -
                            </button>
                            <span className="w-7 text-center font-bold tabular-nums text-gray-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                              disabled={isPending}
                              className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-xs font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900 tabular-nums">
                          Rp {(item.pricePermalam * item.quantity).toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            disabled={isPending}
                            className="p-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                            title="Hapus dari paket"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════ RIGHT COLUMN (4 COLS): Sidebar & Media ═══════════ */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Galeri & Banner Media Paket */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <HugeiconsIcon icon={Image01Icon} size={18} className="text-[#16624B]" />
              <h2 className="text-sm font-bold text-gray-900">Media Paket</h2>
            </div>
            <p className="text-[11px] text-gray-500">
              Unggah foto banner representatif paket. Foto pertama otomatis menjadi cover utama.
            </p>

            <MediaUploader
              initialMedia={mediaList}
              folder="packages"
              disabled={isPending}
              onChange={(items) => setMediaList(items)}
            />
          </div>

          {/* Card 2: Pengaturan Status Publikasi */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <span className="text-sm font-bold text-gray-900">Status Visibilitas</span>
              <Switch
                id="isActiveSwitch"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isPending}
              />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {isActive
                ? "Paket ini aktif dan akan ditampilkan di katalog booking website untuk disewa pelanggan."
                : "Paket ini nonaktif dan disembunyikan sementara dari katalog booking pelanggan."}
            </p>
          </div>

          {/* Card 3: Ringkasan Nilai Paket (Bundle Economics) */}
          <div className="bg-[#16624B]/5 rounded-xl border border-[#16624B]/20 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#16624B]">
              Ringkasan Bundle Hemat
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>Total Macam Produk:</span>
                <span className="font-semibold text-gray-900 tabular-nums">{packageItems.length} macam</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Total Jumlah Fisik Alat:</span>
                <span className="font-semibold text-gray-900 tabular-nums">{totalItemPieces} unit</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Harga Satuan Normal:</span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  Rp {individualTotalPermalam.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Harga Paket Ditawarkan:</span>
                <span className="font-bold text-[#16624B] tabular-nums">
                  Rp {pricePermalam.toLocaleString("id-ID")}
                </span>
              </div>
              {savingsPermalam > 0 && (
                <div className="pt-2 border-t border-[#16624B]/20 flex items-center justify-between text-emerald-800 font-semibold">
                  <span>Hemat Pelanggan:</span>
                  <span className="tabular-nums">
                    Rp {savingsPermalam.toLocaleString("id-ID")} ({savingsPercent}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Action Footer */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
            <Button
              type="submit"
              disabled={isPending || packageItems.length === 0 || !name.trim()}
              className="w-full bg-[#16624B] hover:bg-[#0F4F3C] text-white text-xs font-semibold h-10 gap-2 shadow-2xs"
            >
              {isPending && <HugeiconsIcon icon={Loading01Icon} size={15} className="animate-spin" />}
              <span>{isEditing ? "Perbarui Paket Sewa" : "Simpan Paket Sewa"}</span>
            </Button>
            <Link href="/admin/dashboard/paket" className="block">
              <Button type="button" variant="outline" disabled={isPending} className="w-full text-xs h-9">
                Batal & Kembali
              </Button>
            </Link>
          </div>
        </div>
      </form>

      {/* ── Add Item to Package Modal ── */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#E5E7EB] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-bold text-gray-900">
                Tambah Produk ke Komposisi Paket
              </h3>
              <button
                type="button"
                onClick={() => setIsAddItemModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="selectProduct" className="text-xs font-semibold text-gray-700">
                  Pilih Produk Rental / Consumable
                </Label>
                <select
                  id="selectProduct"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-medium bg-[#F9FAFB] border-gray-200 text-gray-800 focus:outline-none focus:border-[#16624B]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.itemType === "rental_unit" ? "Rental" : "Consumable"}) — Rp{" "}
                      {p.pricePermalam.toLocaleString("id-ID")}/malam
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="itemQty" className="text-xs font-semibold text-gray-700">
                  Jumlah / Kuantitas dalam Paket
                </Label>
                <Input
                  id="itemQty"
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-xs sm:text-sm font-semibold tabular-nums"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="text-xs h-9"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-[#16624B] hover:bg-[#0F4F3C] text-white text-xs font-semibold h-9 px-4 shadow-2xs"
                >
                  Tambahkan ke Paket
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

