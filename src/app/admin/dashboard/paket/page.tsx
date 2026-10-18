import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { PackageTable, type PackageListItem } from "./package-table";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  try {
    await requireRole(["admin", "owner"]);
  } catch {
    redirect("/admin/dashboard");
  }

  const rawPackages = await prisma.package.findMany({
    where: { deletedAt: null },
    include: {
      items: {
        include: {
          product: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const packages: PackageListItem[] = rawPackages.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    bannerUrl: p.bannerUrl,
    pricePermalam: p.pricePermalam,
    pricePerkegiatan1: p.pricePerkegiatan1,
    pricePerkegiatan2: p.pricePerkegiatan2,
    isActive: p.isActive,
    updatedAt: p.updatedAt,
    items: p.items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      product: {
        name: i.product.name,
      },
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">
          Manajemen Paket Sewa
        </h1>
        <p className="text-xs text-[var(--color-muted)] mt-1">
          Kelola paket camping hemat, komposisi produk pembentuk, galeri media, dan snapshot harga 3 durasi sewa.
        </p>
      </div>

      <PackageTable packages={packages} />
    </div>
  );
}
