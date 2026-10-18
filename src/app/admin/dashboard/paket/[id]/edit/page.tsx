import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { PackageForm, type PackageCompositionItem } from "../../package-form";
import type { MediaItem } from "@/components/organisms/MediaUploader";

export const dynamic = "force-dynamic";

interface EditPackagePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPackagePage({ params }: EditPackagePageProps) {
  try {
    await requireRole(["admin", "owner"]);
  } catch {
    redirect("/admin/dashboard");
  }

  const { id } = await params;

  const pkg = await prisma.package.findUnique({
    where: { id, deletedAt: null },
    include: {
      items: {
        include: {
          product: {
            include: {
              media: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
      media: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!pkg) {
    notFound();
  }

  // Fetch available products
  const products = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      category: { select: { name: true } },
      media: {
        where: { isPrimary: true },
        select: { mediaUrl: true, isPrimary: true },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  const formattedItems: PackageCompositionItem[] = pkg.items.map((i) => ({
    productId: i.productId,
    productName: i.product.name,
    itemType: i.product.itemType,
    quantity: i.quantity,
    pricePermalam: i.product.pricePermalam,
    thumbnailUrl: i.product.media[0]?.mediaUrl,
  }));

  const formattedMedia: MediaItem[] = pkg.media.map((m) => ({
    id: m.id,
    mediaUrl: m.mediaUrl,
    storagePath: m.storagePath,
    mediaType: m.mediaType === "video" ? "video" : "image",
    thumbnailUrl: m.thumbnailUrl,
    altText: m.altText,
    sortOrder: m.sortOrder,
    isPrimary: m.isPrimary,
  }));

  return (
    <PackageForm
      products={products}
      initialData={{
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        pricePermalam: pkg.pricePermalam,
        pricePerkegiatan1: pkg.pricePerkegiatan1,
        pricePerkegiatan2: pkg.pricePerkegiatan2,
        isActive: pkg.isActive,
        items: formattedItems,
        media: formattedMedia,
      }}
    />
  );
}
