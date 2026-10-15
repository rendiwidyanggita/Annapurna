import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CategoryTable } from "./category-table";
import { CategoryFormModal } from "./category-form-modal";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

export default async function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategori Produk</h1>
          <p className="text-sm text-gray-600 mt-1">
            Kelola kategori untuk mengorganisir produk penyewaan
          </p>
        </div>
        <CategoryFormModal>
          <Button className="gap-2">
            <HugeiconsIcon icon={Add01Icon} size={16} />
            Tambah Kategori
          </Button>
        </CategoryFormModal>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Suspense
          fallback={
            <div className="p-8 text-center text-gray-500">
              Memuat data kategori...
            </div>
          }
        >
          <CategoriesTableWrapper />
        </Suspense>
      </div>
    </div>
  );
}

async function CategoriesTableWrapper() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      products: {
        where: { deletedAt: null },
        select: { id: true },
      },
    },
  });

  const categoriesWithProductCount = categories.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description || "",
    isActive: category.isActive,
    productCount: category.products.length,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  }));

  return <CategoryTable categories={categoriesWithProductCount} />;
}
