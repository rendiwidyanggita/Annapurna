import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../../product-form";

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const [categories, product] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
        },
        media: {
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ]);

  if (!product || product.deletedAt) {
    notFound();
  }

  const primaryMedia = product.media.find((m) => m.isPrimary) || product.media[0];

  const initialData = {
    id: product.id,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    itemType: product.itemType as "rental_unit" | "consumable",
    pricePermalam: product.pricePermalam,
    pricePerkegiatan1: product.pricePerkegiatan1,
    pricePerkegiatan2: product.pricePerkegiatan2,
    consumableStock: product.consumableStock,
    isActive: product.isActive,
    imageUrl: primaryMedia?.mediaUrl || null,
    variants: product.variants.map((v) => ({
      variantName: v.variantName,
      size: v.size || undefined,
      color: v.color || undefined,
      brand: v.brand || undefined,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-primary)]">
          Edit Produk: {product.name}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Perbarui rincian spesifikasi, skema tarif durasi sewa, atau variasi item.
        </p>
      </div>

      <ProductForm categories={categories} initialData={initialData} />
    </div>
  );
}
