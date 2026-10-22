import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { PackageTable, type PackageListItem } from "./package-table";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import {
  Package01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Paket Sewa — Admin ANNAPURNA",
};

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

  // KPI Metrics
  const totalPackages = packages.length;
  const activePackages = packages.filter((p) => p.isActive).length;
  const inactivePackages = totalPackages - activePackages;
  const totalItemsCount = packages.reduce((acc, p) => acc + p.items.reduce((sum, item) => sum + item.quantity, 0), 0);
  const avgItemsPerPackage = totalPackages > 0 ? (totalItemsCount / totalPackages).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* ── Archetype A: KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          label="Total Paket Sewa"
          value={totalPackages}
          icon={Package01Icon}
          iconColorVariant="emerald"
          subtext="Paket bundling terdaftar"
        />
        <AdminKpiCard
          label="Paket Aktif"
          value={activePackages}
          icon={CheckmarkCircle01Icon}
          iconColorVariant="blue"
          subtext="Tampil di katalog booking"
        />
        <AdminKpiCard
          label="Paket Nonaktif"
          value={inactivePackages}
          icon={CancelCircleIcon}
          iconColorVariant={inactivePackages > 0 ? "amber" : "neutral"}
          subtext="Disembunyikan dari katalog"
        />
        <AdminKpiCard
          label="Rata-rata Item / Paket"
          value={`${avgItemsPerPackage} unit`}
          icon={Layers01Icon}
          iconColorVariant="purple"
          subtext={`Dari ${totalItemsCount} total item bundling`}
        />
      </div>

      {/* ── Package Table ── */}
      <PackageTable packages={packages} />
    </div>
  );
}

