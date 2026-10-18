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

  // Calculate sum of individual items permalam price for reference
  const individualTotalPermalam = packageItems.reduce(
    (acc, curr) => acc + curr.pricePermalam * curr.quantity,
    0
  );

  function handleAddItem() {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Check if already in package
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

    // Client affordance check (backend will also strictly enforce via Zod)
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

      // Items composition payload
      const itemsPayload = packageItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      formData.append("items", JSON.stringify(itemsPayload));

      // Media gallery payload
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
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard/paket"
            className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-neutral-100 text-neutral-600 transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-foreground)]">
              {isEditing ? `Edit Paket: ${initialData?.name}` : "Buat Paket Sewa Baru"}
            </h1>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Atur komposisi produk, snapshot harga durasi sewa, dan galeri media paket.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <HugeiconsIcon icon={AlertCircleIcon} className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Informasi Dasar Paket */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Package01Icon} className="w-4 h-4 text-[var(--color-primary)]" />
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                1. Informasi Dasar Paket
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="isActiveSwitch" className="text-xs text-neutral-600 cursor-pointer">
                Status Aktif
              </Label>
              <Switch
                id="isActiveSwitch"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="packageName" className="text-xs font-semibold">
                Nama Paket Sewa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="packageName"
                placeholder="Contoh: Paket Camping 2 Orang Komplit, Paket Pendaki Rinjani"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                required
                className="text-sm"
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-600">{fieldErrors.name[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="packageDesc" className="text-xs font-semibold">
                Deskripsi Paket
              </Label>
              <Textarea
                id="packageDesc"
                rows={3}
                placeholder="Jelaskan peruntukan paket, keunggulan, dan kecukupan kapasitas..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Galeri Media (AA-52 & AA-53) */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
            <HugeiconsIcon icon={Image01Icon} className="w-4 h-4 text-[var(--color-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
              2. Galeri Media Paket
            </h2>
          </div>
          <p className="text-xs text-[var(--color-muted)]">
            Unggah foto/video representatif paket sewa. Foto pertama otomatis menjadi banner utama.
          </p>

          <MediaUploader
            initialMedia={mediaList}
            folder="packages"
            disabled={isPending}
            onChange={(items) => setMediaList(items)}
          />
        </div>

        {/* Section 3: Snapshot Harga per Durasi Sewa (AA-50) */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
            <HugeiconsIcon icon={DollarCircleIcon} className="w-4 h-4 text-[var(--color-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
              3. Snapshot Harga per Durasi Sewa (Wajib diisi)
            </h2>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg text-xs text-[var(--color-muted)] flex items-center justify-between">
            <span>Estimasi total harga satuan produk pembentuk (Permalam):</span>
            <span className="font-bold text-neutral-800">
              Rp {individualTotalPermalam.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pricePermalam" className="text-xs font-semibold">
                Permalam (1 malam) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
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
                  className="pl-9 text-sm font-semibold"
                />
              </div>
              {fieldErrors.pricePermalam && (
                <p className="text-xs text-red-600">{fieldErrors.pricePermalam[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pricePerkegiatan1" className="text-xs font-semibold">
                Perkegiatan I (3 hari 3 malam) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
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
                  className="pl-9 text-sm font-semibold"
                />
              </div>
              {fieldErrors.pricePerkegiatan1 && (
                <p className="text-xs text-red-600">{fieldErrors.pricePerkegiatan1[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pricePerkegiatan2" className="text-xs font-semibold">
                Perkegiatan II (5 hari 5 malam) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
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
                  className="pl-9 text-sm font-semibold"
                />
              </div>
              {fieldErrors.pricePerkegiatan2 && (
                <p className="text-xs text-red-600">{fieldErrors.pricePerkegiatan2[0]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Komposisi Isi Paket (AA-51) */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Package01Icon} className="w-4 h-4 text-[var(--color-primary)]" />
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                4. Komposisi Isi Produk dalam Paket <span className="text-red-500">*</span>
              </h2>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddItemModalOpen(true)}
              disabled={isPending}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs flex items-center gap-1"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="w-3.5 h-3.5" />
              Tambah Produk
            </Button>
          </div>

          {fieldErrors.items && (
            <p className="text-xs text-red-600 font-medium">{fieldErrors.items[0]}</p>
          )}

          {packageItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--color-muted)] border-2 border-dashed rounded-lg">
              Belum ada produk yang dimasukkan ke dalam paket ini. Klik &ldquo;Tambah Produk&rdquo; di atas untuk menambahkan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-[var(--color-muted)] font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Produk</th>
                    <th className="py-2.5 px-3">Tipe Item</th>
                    <th className="py-2.5 px-3">Harga Satuan (Permalam)</th>
                    <th className="py-2.5 px-3">Kuantitas</th>
                    <th className="py-2.5 px-3">Subtotal Acuan</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {packageItems.map((item) => (
                    <tr key={item.productId} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {item.thumbnailUrl ? (
                            <div className="relative w-7 h-7 rounded overflow-hidden bg-neutral-100 shrink-0 border">
                              <Image
                                src={item.thumbnailUrl}
                                alt={item.productName}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded bg-neutral-100 flex items-center justify-center shrink-0">
                              <HugeiconsIcon icon={Package01Icon} className="w-3.5 h-3.5 text-neutral-400" />
                            </div>
                          )}
                          <span className="font-semibold text-neutral-800">{item.productName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-neutral-500">
                          {item.itemType === "rental_unit" ? "Rental Unit" : "Consumable"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600">
                        Rp {item.pricePermalam.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isPending}
                            className="w-5 h-5 rounded border flex items-center justify-center hover:bg-neutral-100 disabled:opacity-30"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                            disabled={isPending}
                            className="w-5 h-5 rounded border flex items-center justify-center hover:bg-neutral-100"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-700">
                        Rp {(item.pricePermalam * item.quantity).toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          disabled={isPending}
                          className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                          title="Hapus dari paket"
                        >
                          <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <Link href="/admin/dashboard/paket">
            <Button type="button" variant="outline" disabled={isPending} className="text-xs">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending || packageItems.length === 0 || !name.trim()}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs px-6 flex items-center gap-2"
          >
            {isPending && <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin" />}
            {isEditing ? "Perbarui Paket Sewa" : "Simpan Paket Sewa"}
          </Button>
        </div>
      </form>

      {/* Add Item to Package Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[var(--color-border)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                Tambah Produk ke Komposisi Paket
              </h3>
              <button
                type="button"
                onClick={() => setIsAddItemModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="selectProduct" className="text-xs font-semibold">
                  Pilih Produk
                </Label>
                <select
                  id="selectProduct"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                <Label htmlFor="itemQty" className="text-xs font-semibold">
                  Jumlah / Kuantitas dalam Paket
                </Label>
                <Input
                  id="itemQty"
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-sm font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs"
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
