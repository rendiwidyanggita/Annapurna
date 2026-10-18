"use client";

import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Search01Icon,
  Edit01Icon,
  Delete01Icon,
  RefreshIcon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
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

  function getStatusBadge(status: string) {
    switch (status) {
      case "Available":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Reserved":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Rented":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Returned":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "Maintenance":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Damaged":
        return "bg-red-100 text-red-800 border-red-300";
      case "Lost":
        return "bg-red-950 text-red-100 border-red-900";
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300";
    }
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
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
          />
          <Input
            placeholder="Cari kode unit atau nama produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Filters and Add button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Product Filter */}
          <select
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-xs bg-white border-[var(--color-border)] focus:outline-none"
          >
            <option value="ALL">Semua Produk</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-xs bg-white border-[var(--color-border)] focus:outline-none font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="Available">Available (Tersedia)</option>
            <option value="Reserved">Reserved (Dipesan)</option>
            <option value="Rented">Rented (Disewa)</option>
            <option value="Returned">Returned (Transit)</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Damaged">Damaged (Rusak)</option>
            <option value="Lost">Lost (Hilang)</option>
          </select>

          <Button
            type="button"
            onClick={() => {
              setEditingUnit(null);
              setIsUnitModalOpen(true);
            }}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs flex items-center gap-1.5"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
            Tambah Unit
          </Button>
        </div>
      </div>

      {deleteError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Units Table */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-[var(--color-border)] text-[var(--color-muted)] font-semibold">
              <tr>
                <th className="py-3 px-4">Kode Unit</th>
                <th className="py-3 px-4">Produk Rental</th>
                <th className="py-3 px-4">Varian</th>
                <th className="py-3 px-4">Status Fisik</th>
                <th className="py-3 px-4">Catatan Kondisi</th>
                <th className="py-3 px-4">Terakhir Diupdate</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--color-muted)]">
                    Tidak ada unit fisik inventaris yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-neutral-800">
                      {unit.inventoryCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--color-foreground)]">
                      {unit.variant.product.name}
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {unit.variant.variantName}
                      {unit.variant.size ? ` (${unit.variant.size})` : ""}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                          unit.unitStatus
                        )}`}
                      >
                        {unit.unitStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 max-w-xs truncate">
                      {unit.conditionNotes || "-"}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 text-[11px]">
                      {new Date(unit.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setStatusUnitTarget(unit);
                            setIsStatusModalOpen(true);
                          }}
                          className="h-7 text-[11px] px-2 text-[var(--color-primary)] border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5"
                          title="Ubah Status Fisik"
                        >
                          <HugeiconsIcon icon={RefreshIcon} className="w-3 h-3 mr-1" />
                          Status
                        </Button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingUnit(unit);
                            setIsUnitModalOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-600"
                          title="Edit Unit"
                        >
                          <HugeiconsIcon icon={Edit01Icon} className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={isPendingDelete}
                          onClick={() => handleDelete(unit.id, unit.inventoryCode)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600"
                          title="Hapus Unit"
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
