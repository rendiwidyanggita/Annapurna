import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { PackageForm } from "../package-form";

export const dynamic = "force-dynamic";

export default async function NewPackagePage() {
  try {
    await requireRole(["admin", "owner"]);
  } catch {
    redirect("/admin/dashboard");
  }

  // Fetch available products to form the package
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

  return <PackageForm products={products} />;
}
