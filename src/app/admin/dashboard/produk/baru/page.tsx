import { prisma } from "@/lib/prisma";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-primary)]">
          Tambah Produk Baru
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Daftarkan alat outdoor atau barang habis pakai ke sistem inventaris.
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
