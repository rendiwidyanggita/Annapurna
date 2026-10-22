"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/atoms/status-badge";
import { AdminFilterToolbar } from "@/components/molecules/admin-filter-toolbar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  Delete01Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { CategoryFormModal } from "./category-form-modal";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  productCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface CategoryTableProps {
  categories: CategoryItem[];
  addCategoryButton?: React.ReactNode;
}

function formatDate(date: Date | string): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "-";
  }
}

export function CategoryTable({
  categories,
  addCategoryButton,
}: CategoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isFiltered = searchTerm !== "" || statusFilter !== "all";

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      searchTerm === "" ||
      cat.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      cat.description.toLowerCase().includes(searchTerm.toLowerCase().trim());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && cat.isActive) ||
      (statusFilter === "inactive" && !cat.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* ── Archetype A Filter & Action Toolbar ── */}
      <AdminFilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari nama atau deskripsi kategori…"
        onReset={handleReset}
        isFiltered={isFiltered}
        customAction={addCategoryButton}
        segmentedSwitcher={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B7280]">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36 text-xs bg-[#F9FAFB] border-gray-200">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Kategori Aktif</SelectItem>
                <SelectItem value="inactive">Kategori Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* ── Table Container (Archetype A Compact View) ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <HugeiconsIcon icon={Tag01Icon} size={24} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {isFiltered
                  ? "Kategori tidak ditemukan"
                  : "Belum ada kategori"}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {isFiltered
                  ? "Tidak ada data kategori yang cocok dengan filter yang Anda gunakan."
                  : "Mulai tambahkan kategori master untuk mengorganisir produk penyewaan alat outdoor Anda."}
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-[#F9FAFB]">
              <TableRow className="border-b border-[#E5E7EB]">
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-[#6B7280] py-3.5 pl-6">
                  Nama Kategori
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-[#6B7280]">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-[#6B7280]">
                  Jumlah Produk Terkait
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-[#6B7280]">
                  Tanggal Dibuat
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-[#6B7280] text-right pr-6">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#E5E7EB]">
              {filteredCategories.map((category) => (
                <TableRow
                  key={category.id}
                  className="hover:bg-[#F9FAFB]/70 transition-colors"
                >
                  <TableCell className="align-middle pl-6 py-4">
                    <div>
                      <span className="font-bold text-sm text-[#111827]">
                        {category.name}
                      </span>
                      {category.description ? (
                        <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1 max-w-md">
                          {category.description}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#9CA3AF] italic mt-0.5">
                          Tanpa deskripsi
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle">
                    <StatusBadge
                      variant={category.isActive ? "active" : "inactive"}
                      dot
                      size="sm"
                    >
                      {category.isActive ? "Aktif" : "Nonaktif"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="align-middle tabular-nums">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-semibold text-[#111827]">
                      <span>{category.productCount}</span>
                      <span className="text-[#6B7280] font-normal text-[11px]">
                        produk
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="align-middle text-xs text-[#6B7280] tabular-nums">
                    {formatDate(category.createdAt)}
                  </TableCell>
                  <TableCell className="align-middle text-right pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Edit Modal */}
                      <CategoryFormModal
                        category={{
                          id: category.id,
                          name: category.name,
                          description: category.description,
                          isActive: category.isActive,
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-[#6B7280] hover:text-[#16624B] hover:bg-[#E7F3EE] rounded-lg focus-visible:ring-2 focus-visible:ring-[#16624B] focus-visible:outline-none"
                          title="Edit Kategori"
                          aria-label={`Edit kategori ${category.name}`}
                        >
                          <HugeiconsIcon icon={Edit01Icon} size={15} aria-hidden="true" />
                          <span className="sr-only">Edit kategori {category.name}</span>
                        </Button>
                      </CategoryFormModal>

                      {/* Delete Dialog */}
                      <DeleteCategoryDialog
                        categoryId={category.id}
                        categoryName={category.name}
                        productCount={category.productCount}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                          title="Hapus Kategori"
                          aria-label={`Hapus kategori ${category.name}`}
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={15} aria-hidden="true" />
                          <span className="sr-only">Hapus kategori {category.name}</span>
                        </Button>
                      </DeleteCategoryDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
