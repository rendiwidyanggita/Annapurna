"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Search01Icon,
  Edit01Icon,
  Delete01Icon,
  Package01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { deleteRentalPackage, togglePackageStatus } from "./actions";

export interface PackageListItem {
  id: string;
  name: string;
  description?: string | null;
  bannerUrl?: string | null;
  pricePermalam: number;
  pricePerkegiatan1: number;
  pricePerkegiatan2: number;
  isActive: boolean;
  updatedAt: Date | string;
  items: Array<{
    id: string;
    quantity: number;
    product: {
      name: string;
    };
  }>;
}

interface PackageTableProps {
  packages: PackageListItem[];
}

export function PackageTable({ packages }: PackageTableProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filtered = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pkg.description && pkg.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  function handleToggle(id: string, currentActive: boolean) {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await togglePackageStatus(id, !currentActive);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal mengubah status paket.");
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus paket sewa "${name}"?`)) return;
    setErrorMessage(null);
    startTransition(async () => {
      const res = await deleteRentalPackage(id);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal menghapus paket sewa.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
          />
          <Input
            placeholder="Cari nama paket sewa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Link href="/admin/dashboard/paket/baru">
          <Button
            type="button"
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs flex items-center gap-1.5 w-full sm:w-auto"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
            Tambah Paket Baru
          </Button>
        </Link>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-[var(--color-border)] text-[var(--color-muted)] font-semibold">
              <tr>
                <th className="py-3 px-4">Paket Sewa</th>
                <th className="py-3 px-4">Komposisi Item</th>
                <th className="py-3 px-4">Harga Permalam</th>
                <th className="py-3 px-4">Harga 3H3M</th>
                <th className="py-3 px-4">Harga 5H5M</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--color-muted)]">
                    Tidak ada paket sewa yang terdaftar.
                  </td>
                </tr>
              ) : (
                filtered.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                          {pkg.bannerUrl ? (
                            <Image
                              src={pkg.bannerUrl}
                              alt={pkg.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <HugeiconsIcon icon={Package01Icon} className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-800">{pkg.name}</p>
                          <p className="text-[11px] text-[var(--color-muted)] line-clamp-1 max-w-xs">
                            {pkg.description || "Tidak ada deskripsi"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-neutral-800">
                        {pkg.items.length} macam produk
                      </span>
                      <p className="text-[11px] text-neutral-500 line-clamp-1 max-w-xs">
                        {pkg.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", ")}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-800">
                      Rp {pkg.pricePermalam.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-600">
                      Rp {pkg.pricePerkegiatan1.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-600">
                      Rp {pkg.pricePerkegiatan2.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Switch
                        checked={pkg.isActive}
                        onCheckedChange={() => handleToggle(pkg.id, pkg.isActive)}
                        disabled={isPending}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/dashboard/paket/${pkg.id}/edit`}>
                          <button
                            type="button"
                            className="p-1.5 rounded hover:bg-neutral-100 text-neutral-600"
                            title="Edit Paket"
                          >
                            <HugeiconsIcon icon={Edit01Icon} className="w-3.5 h-3.5" />
                          </button>
                        </Link>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(pkg.id, pkg.name)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600"
                          title="Hapus Paket"
                        >
                          <HugeiconsIcon icon={Delete01Icon} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
