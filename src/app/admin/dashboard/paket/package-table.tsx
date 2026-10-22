"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Edit01Icon,
  Delete01Icon,
  Package01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { AdminFilterToolbar } from "@/components/molecules/admin-filter-toolbar";
import { StatusBadge } from "@/components/atoms/status-badge";
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
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return packages.filter((pkg) => {
      const matchSearch =
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pkg.description && pkg.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && pkg.isActive) ||
        (statusFilter === "INACTIVE" && !pkg.isActive);

      return matchSearch && matchStatus;
    });
  }, [packages, searchTerm, statusFilter]);

  const isFiltered = searchTerm.trim().length > 0 || statusFilter !== "ALL";

  function handleReset() {
    setSearchTerm("");
    setStatusFilter("ALL");
  }

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
      {/* ── Filter Toolbar ── */}
      <AdminFilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari nama atau deskripsi paket sewa…"
        isFiltered={isFiltered}
        onReset={handleReset}
        primaryAction={{
          label: "Tambah Paket Baru",
          href: "/admin/dashboard/paket/baru",
          icon: PlusSignIcon,
        }}
      >
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Status Publikasi
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-[#F9FAFB] text-xs font-medium text-gray-800 focus:outline-none focus:border-[#16624B]"
          >
            <option value="ALL">Semua Status Paket ({packages.length})</option>
            <option value="ACTIVE">Paket Aktif Saja</option>
            <option value="INACTIVE">Paket Nonaktif Saja</option>
          </select>
        </div>
      </AdminFilterToolbar>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Table (Archetype A) ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Paket Sewa</th>
                <th className="py-3 px-4">Komposisi Item</th>
                <th className="py-3 px-4">Permalam (1 Malam)</th>
                <th className="py-3 px-4">3H3M (Paket Hemat)</th>
                <th className="py-3 px-4">5H5M (Paket Panjang)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <p className="font-semibold text-gray-700 mb-1">Tidak ada paket sewa yang sesuai</p>
                    <p className="text-[11px]">Coba sesuaikan kata kunci pencarian atau filter status Anda.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                          {pkg.bannerUrl ? (
                            <Image
                              src={pkg.bannerUrl}
                              alt={pkg.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <HugeiconsIcon icon={Package01Icon} size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{pkg.name}</p>
                          <p className="text-[11px] text-gray-500 line-clamp-1 max-w-xs mt-0.5">
                            {pkg.description || "Tidak ada deskripsi"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-800 border border-gray-200 tabular-nums">
                        {pkg.items.length} macam produk
                      </span>
                      <p className="text-[11px] text-gray-500 line-clamp-1 max-w-xs mt-1">
                        {pkg.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", ")}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 tabular-nums">
                      Rp {pkg.pricePermalam.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700 tabular-nums">
                      Rp {pkg.pricePerkegiatan1.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700 tabular-nums">
                      Rp {pkg.pricePerkegiatan2.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <Switch
                          checked={pkg.isActive}
                          onCheckedChange={() => handleToggle(pkg.id, pkg.isActive)}
                          disabled={isPending}
                        />
                        <StatusBadge
                          variant={pkg.isActive ? "active" : "inactive"}
                          size="sm"
                          dot
                        >
                          {pkg.isActive ? "Aktif" : "Nonaktif"}
                        </StatusBadge>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/dashboard/paket/${pkg.id}/edit`}>
                          <button
                            type="button"
                            aria-label={`Edit paket sewa ${pkg.name}`}
                            className="p-1.5 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16624B]"
                            title="Edit Paket"
                          >
                            <HugeiconsIcon icon={Edit01Icon} size={15} aria-hidden="true" />
                            <span className="sr-only">Edit paket sewa {pkg.name}</span>
                          </button>
                        </Link>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(pkg.id, pkg.name)}
                          aria-label={`Hapus paket sewa ${pkg.name}`}
                          className="p-1.5 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          title="Hapus Paket"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={15} aria-hidden="true" />
                          <span className="sr-only">Hapus paket sewa {pkg.name}</span>
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

