"use client";

import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Edit01Icon,
  Delete01Icon,
  RefreshIcon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { AdminFilterToolbar } from "@/components/molecules/admin-filter-toolbar";
import { UnitStatusBadge } from "@/components/atoms/status-badge";
import { UnitModal } from "./unit-modal";
import { ChangeStatusModal } from "./change-status-modal";
import { deleteInventoryUnit } from "./actions";

export interface InventoryUnitItem {
  id: string;
  inventoryCode: string;
  unitStatus: string;
  conditionNotes?: string | null;
  updatedAt: Date | string;
  variant: {
    id: string;
    variantName: string;
    size?: string | null;
    color?: string | null;
    product: {
      id: string;
      name: string;
    };
  };
}

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

interface UnitTableProps {
  units: InventoryUnitItem[];
  products: ProductOption[];
}

export function UnitTable({ units, products }: UnitTableProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Modal states
  const [isUnitModalOpen, setIsUnitModalOpen] = useState<boolean>(false);
  const [editingUnit, setEditingUnit] = useState<InventoryUnitItem | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [statusUnitTarget, setStatusUnitTarget] = useState<InventoryUnitItem | null>(null);

  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filtered units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchSearch =
        u.inventoryCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.variant.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.conditionNotes && u.conditionNotes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchProduct =
        selectedProductFilter === "ALL" || u.variant.product.id === selectedProductFilter;

      const matchStatus =
        selectedStatusFilter === "ALL" || u.unitStatus === selectedStatusFilter;

      return matchSearch && matchProduct && matchStatus;
    });
  }, [units, searchTerm, selectedProductFilter, selectedStatusFilter]);

  const isFiltered =
    searchTerm.trim().length > 0 ||
    selectedProductFilter !== "ALL" ||
    selectedStatusFilter !== "ALL";

  function handleReset() {
    setSearchTerm("");
    setSelectedProductFilter("ALL");
    setSelectedStatusFilter("ALL");
  }

  function handleDelete(id: string, code: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus unit fisik ${code}?`)) return;
    setDeleteError(null);

    startDeleteTransition(async () => {
      const res = await deleteInventoryUnit(id);
      if (!res.success) {
        setDeleteError(res.error || "Gagal menghapus unit fisik.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* ── Filter Toolbar ── */}
      <AdminFilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari kode unit, produk, atau catatan…"
        isFiltered={isFiltered}
        onReset={handleReset}
        primaryAction={{
          label: "Tambah Unit Fisik",
          icon: PlusSignIcon,
          onClick: () => {
            setEditingUnit(null);
            setIsUnitModalOpen(true);
          },
        }}
      >
        {/* Filter Produk */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Filter Produk Rental
          </label>
          <select
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-[#F9FAFB] text-xs font-medium text-gray-800 focus:outline-none focus:border-[#16624B]"
          >
            <option value="ALL">Semua Produk ({products.length})</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status Fisik */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Status Fisik Unit
          </label>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-[#F9FAFB] text-xs font-medium text-gray-800 focus:outline-none focus:border-[#16624B]"
          >
            <option value="ALL">Semua Status Unit</option>
            <option value="Available">Available (Tersedia)</option>
            <option value="Reserved">Reserved (Dipesan)</option>
            <option value="Rented">Rented (Sedang Disewa)</option>
            <option value="Returned">Returned (Transit Dikembalikan)</option>
            <option value="Maintenance">Maintenance (Perawatan)</option>
            <option value="Damaged">Damaged (Rusak)</option>
            <option value="Lost">Lost (Hilang)</option>
          </select>
        </div>
      </AdminFilterToolbar>

      {deleteError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0 text-red-600" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* ── Units Table (Archetype A & C) ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Kode Unit</th>
                <th className="py-3 px-4">Produk Rental</th>
                <th className="py-3 px-4">Varian & Spesifikasi</th>
                <th className="py-3 px-4">Status Fisik</th>
                <th className="py-3 px-4">Catatan Kondisi</th>
                <th className="py-3 px-4">Terakhir Diupdate</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <p className="font-semibold text-gray-700 mb-1">Tidak ada unit fisik inventaris</p>
                    <p className="text-[11px]">Coba sesuaikan kata kunci pencarian atau filter status Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Kode Unit - SalesSync style mono badge */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 tabular-nums">
                        {unit.inventoryCode}
                      </span>
                    </td>

                    {/* Nama Produk */}
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {unit.variant.product.name}
                    </td>

                    {/* Varian */}
                    <td className="py-3.5 px-4 text-gray-600">
                      <span className="font-medium text-gray-800">{unit.variant.variantName}</span>
                      {unit.variant.size && (
                        <span className="ml-1.5 inline-block text-[11px] px-1.5 py-0.2 bg-gray-100 rounded text-gray-600 border border-gray-200 tabular-nums">
                          {unit.variant.size}
                        </span>
                      )}
                      {unit.variant.color && (
                        <span className="ml-1 text-[11px] text-gray-500">
                          ({unit.variant.color})
                        </span>
                      )}
                    </td>

                    {/* Status Fisik Badge */}
                    <td className="py-3.5 px-4">
                      <UnitStatusBadge status={unit.unitStatus} size="sm" />
                    </td>

                    {/* Catatan Kondisi */}
                    <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate" title={unit.conditionNotes || ""}>
                      {unit.conditionNotes || <span className="text-gray-300">-</span>}
                    </td>

                    {/* Tanggal */}
                    <td className="py-3.5 px-4 text-gray-500 text-[11px] tabular-nums">
                      {new Date(unit.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setStatusUnitTarget(unit);
                            setIsStatusModalOpen(true);
                          }}
                          className="h-7 text-[11px] px-2.5 font-semibold text-[#16624B] border-[#16624B]/30 hover:bg-[#16624B]/10 transition-colors"
                          title="Ubah Status Fisik"
                        >
                          <HugeiconsIcon icon={RefreshIcon} size={13} className="mr-1" />
                          Status
                        </Button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingUnit(unit);
                            setIsUnitModalOpen(true);
                          }}
                          aria-label={`Edit unit fisik ${unit.inventoryCode}`}
                          className="p-1.5 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16624B]"
                          title="Edit Unit"
                        >
                          <HugeiconsIcon icon={Edit01Icon} size={15} aria-hidden="true" />
                          <span className="sr-only">Edit unit {unit.inventoryCode}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isPendingDelete}
                          onClick={() => handleDelete(unit.id, unit.inventoryCode)}
                          aria-label={`Hapus unit fisik ${unit.inventoryCode}`}
                          className="p-1.5 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          title="Hapus Unit"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={15} aria-hidden="true" />
                          <span className="sr-only">Hapus unit {unit.inventoryCode}</span>
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

      {/* Unit Form Modal */}
      {isUnitModalOpen && (
        <UnitModal
          isOpen={isUnitModalOpen}
          onClose={() => setIsUnitModalOpen(false)}
          products={products}
          initialData={
            editingUnit
              ? {
                  id: editingUnit.id,
                  productId: editingUnit.variant.product.id,
                  variantId: editingUnit.variant.id,
                  unitCode: editingUnit.inventoryCode,
                  notes: editingUnit.conditionNotes,
                }
              : undefined
          }
        />
      )}

      {/* Change Status Modal */}
      {isStatusModalOpen && statusUnitTarget && (
        <ChangeStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setStatusUnitTarget(null);
          }}
          unit={{
            id: statusUnitTarget.id,
            inventoryCode: statusUnitTarget.inventoryCode,
            productName: statusUnitTarget.variant.product.name,
            variantName: statusUnitTarget.variant.variantName,
            unitStatus: statusUnitTarget.unitStatus,
          }}
        />
      )}
    </div>
  );
}

