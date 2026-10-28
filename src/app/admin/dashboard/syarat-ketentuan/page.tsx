import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { AdminKpiCard } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  File01Icon,
  CheckmarkCircle01Icon,
  ShoppingBag01Icon,
  Time02Icon,
  PlusSignIcon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";

import { TermsTable, type TermsItem } from "./terms-table";
import { TermsFormModal } from "./terms-form-modal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Syarat & Ketentuan — Admin ANNAPURNA",
  description:
    "Kelola versi teks syarat & ketentuan, aturan jaminan identitas, denda kerusakan, dan pembatalan sewa.",
};

export default async function TermsManagementPage() {
  // 1. Guard: Hanya OWNER yang berhak mengakses & mengelola S&K (PRD OQ-07 & Section 16.1)
  try {
    await requireRole(["OWNER"]);
  } catch {
    redirect("/admin/dashboard");
  }

  // 2. Fetch all terms versions with transaction count
  const allTerms = await prisma.termsCondition.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  const serializedTerms: TermsItem[] = allTerms.map((t) => ({
    id: t.id,
    version: t.version,
    content: t.content,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    transactionCount: t._count.transactions,
  }));

  // 3. Compute KPI metrics
  const totalVersions = serializedTerms.length;
  const activeVersion = serializedTerms.find((t) => t.isActive);
  const activeVersionTransactions = activeVersion?.transactionCount || 0;
  const totalBoundTransactions = serializedTerms.reduce(
    (acc, t) => acc + t.transactionCount,
    0
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Manajemen Syarat & Ketentuan (S&K)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40">
              <HugeiconsIcon icon={Shield01Icon} size={12} />
              Owner Only
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Atur regulasi sewa alat outdoor, batas waktu booking, mekanisme denda, dan jaminan KTP/SIM pelanggan.
          </p>
        </div>

        <TermsFormModal>
          <Button
            type="button"
            className="bg-brand-600 text-white hover:bg-brand-700 shadow-xs text-xs font-semibold self-start sm:self-auto"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            <span>Buat Versi Baru</span>
          </Button>
        </TermsFormModal>
      </div>

      {/* ── Active Version Highlight Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-200/80 bg-gradient-to-r from-brand-50/70 via-white to-emerald-50/40 p-5 sm:p-6 shadow-xs dark:border-brand-900/60 dark:from-brand-950/40 dark:via-neutral-900 dark:to-emerald-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
                Versi Aktif Publik
              </span>
              <span className="text-sm font-mono font-bold text-neutral-900 dark:text-white">
                {activeVersion ? activeVersion.version : "Belum Ada Versi Aktif"}
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-2xl line-clamp-2">
              {activeVersion
                ? activeVersion.content.slice(0, 200) + "..."
                : "Belum ada versi S&K yang diset aktif. Pelanggan saat ini melihat teks fallback sistem."}
            </p>
            {activeVersion && (
              <p className="text-[11px] text-neutral-400 flex items-center gap-1.5 pt-1">
                <HugeiconsIcon icon={Time02Icon} size={12} />
                <span>
                  Terakhir diperbarui{" "}
                  {format(new Date(activeVersion.updatedAt), "dd MMMM yyyy, HH:mm", {
                    locale: localeId,
                  })}
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeVersion && (
              <TermsFormModal terms={activeVersion}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold border-brand-200 hover:bg-brand-50 text-brand-700 dark:border-brand-900 dark:text-brand-300"
                >
                  Edit Versi Aktif
                </Button>
              </TermsFormModal>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Summary Strip (Archetype A) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          label="Total Versi S&K"
          value={totalVersions}
          icon={File01Icon}
          iconColorVariant="purple"
          subtext="Histori & arsip versi aturan"
        />
        <AdminKpiCard
          label="Versi Aktif"
          value={activeVersion ? activeVersion.version : "-"}
          icon={CheckmarkCircle01Icon}
          iconColorVariant="emerald"
          subtext="Digunakan pada checkout publik"
        />
        <AdminKpiCard
          label="Transaksi Versi Aktif"
          value={activeVersionTransactions}
          icon={ShoppingBag01Icon}
          iconColorVariant="blue"
          subtext="Order disetujui dengan versi ini"
        />
        <AdminKpiCard
          label="Total Seluruh Order"
          value={totalBoundTransactions}
          icon={ShoppingBag01Icon}
          iconColorVariant="amber"
          subtext="Akumulasi order terikat S&K"
        />
      </div>

      {/* ── Version History Table ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            Daftar & Riwayat Versi Syarat Ketentuan
          </h2>
        </div>
        <TermsTable
          terms={serializedTerms}
          addTermsButton={
            <TermsFormModal>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-semibold"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={14} className="mr-1" />
                <span>Tambah Versi</span>
              </Button>
            </TermsFormModal>
          }
        />
      </div>
    </div>
  );
}
