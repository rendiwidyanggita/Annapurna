import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CategoryTable } from "./category-table";
import { CategoryFormModal } from "./category-form-modal";
import { Button } from "@/components/ui/button";
import { AdminKpiCard } from "@/components/molecules";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tag01Icon,
  CheckmarkCircle01Icon,
  Package01Icon,
  Chart01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";

export const metadata = {
  title: "Manajemen Kategori — Admin ANNAPURNA",
};

export default async function CategoriesPage() {
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

  // KPI calculations
  const totalCategories = categoriesWithProductCount.length;
  const activeCategories = categoriesWithProductCount.filter((c) => c.isActive).length;
  const totalProducts = categoriesWithProductCount.reduce((acc, c) => acc + c.productCount, 0);
  const avgProductsPerCategory =
    totalCategories > 0 ? (totalProducts / totalCategories).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* ── KPI Summary Strip (Archetype A) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          label="Total Kategori"
          value={totalCategories}
          icon={Tag01Icon}
          iconColorVariant="emerald"
          subtext="Seluruh kategori master"
        />
        <AdminKpiCard
          label="Kategori Aktif"
          value={activeCategories}
          icon={CheckmarkCircle01Icon}
          iconColorVariant="blue"
          subtext="Tampil di katalog customer"
        />
        <AdminKpiCard
          label="Total Produk Terkait"
          value={totalProducts}
          icon={Package01Icon}
          iconColorVariant="amber"
          subtext="Total unit & produk outdoor"
        />
        <AdminKpiCard
          label="Rasio Item / Kategori"
          value={avgProductsPerCategory}
          icon={Chart01Icon}
          iconColorVariant="purple"
          subtext="Rata-rata produk per kategori"
        />
      </div>

      {/* ── Data Table & Toolbar (Archetype A) ── */}
      <CategoryTable
        categories={categoriesWithProductCount}
        addCategoryButton={
          <CategoryFormModal>
            <Button
              type="button"
              size="sm"
              className="h-9 bg-[#16624B] hover:bg-[#0F4F3C] text-white text-xs font-semibold gap-1.5 shadow-2xs"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={15} />
              <span>+ Tambah Kategori</span>
            </Button>
          </CategoryFormModal>
        }
      />
    </div>
  );
}
