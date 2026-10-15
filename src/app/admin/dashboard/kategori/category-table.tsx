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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  Delete01Icon,
  Search01Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { CategoryFormModal } from "./category-form-modal";
import { DeleteCategoryDialog } from "./delete-category-dialog";

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

export function CategoryTable({ categories }: CategoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = categories.filter((cat) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    return (
      cat.name.toLowerCase().includes(query) ||
      cat.description.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <Input
            placeholder="Cari kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Menampilkan{" "}
          <span className="font-semibold text-foreground">
            {filteredCategories.length}
          </span>{" "}
          dari{" "}
          <span className="font-semibold text-foreground">
            {categories.length}
          </span>{" "}
          kategori
        </div>
      </div>

      {/* Table Content */}
      {filteredCategories.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <HugeiconsIcon icon={Tag01Icon} size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {searchTerm ? "Kategori tidak ditemukan" : "Belum ada kategori"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? `Tidak ada kategori yang cocok dengan pencarian "${searchTerm}". Silakan periksa ejaan atau gunakan kata kunci lain.`
                : "Mulai tambahkan kategori pertama untuk mengorganisir produk penyewaan alat outdoor Anda."}
            </p>
          </div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
              <TableHead className="font-semibold text-gray-700">
                Nama Kategori
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Status
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Jumlah Produk
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Tanggal Dibuat
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-right pr-6">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((category) => (
              <TableRow key={category.id} className="hover:bg-gray-50/50">
                <TableCell className="align-middle">
                  <div>
                    <span className="font-medium text-gray-900">
                      {category.name}
                    </span>
                    {category.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-md">
                        {category.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="align-middle">
                  {category.isActive ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-normal">
                      Aktif
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-gray-500 bg-gray-50 border-gray-200 font-normal"
                    >
                      Nonaktif
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="align-middle">
                  <Badge
                    variant="secondary"
                    className="font-mono text-xs font-normal"
                  >
                    {category.productCount} Produk
                  </Badge>
                </TableCell>
                <TableCell className="align-middle text-xs text-gray-500">
                  {formatDate(category.createdAt)}
                </TableCell>
                <TableCell className="align-middle text-right pr-6">
                  <div className="flex items-center justify-end gap-1">
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
                        className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        title="Edit Kategori"
                      >
                        <HugeiconsIcon icon={Edit01Icon} size={15} />
                        <span className="sr-only">Edit</span>
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
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Hapus Kategori"
                      >
                        <HugeiconsIcon icon={Delete01Icon} size={15} />
                        <span className="sr-only">Hapus</span>
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
  );
}
