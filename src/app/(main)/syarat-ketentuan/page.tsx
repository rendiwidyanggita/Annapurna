import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, File01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan Sewa | Annapurna Adventure",
  description:
    "Ketentuan dan panduan peminjaman alat outdoor, jaminan identitas, serta aturan denda di Annapurna Adventure.",
};

export const dynamic = "force-dynamic";

export default async function TermsAndConditionsPage() {
  const activeTerms = await prisma.termsCondition.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const content =
    activeTerms?.content ||
    `1. Penyewa wajib menyerahkan identitas asli yang masih berlaku (KTP / SIM / Kartu Pelajar) sebagai jaminan.
2. Pembayaran DP (Down Payment) sebesar 50% wajib dibayarkan saat reservasi, dan pelunasan dilakukan saat pengambilan alat.
3. Waktu pengambilan dan pengembalian alat disesuaikan dengan tanggal yang tertera pada invoice sewa.
4. Keterlambatan pengembalian dikenakan denda sesuai tarif harian alat yang disewa.
5. Penyewa bertanggung jawab penuh atas keutuhan dan kebersihan alat outdoor yang disewa.
6. Kerusakan atau kehilangan unit sewa akan dikenakan denda penggantian sesuai nilai perbaikan atau harga baru unit.`;

  // Parse lines to render cleanly
  const paragraphs = content.split("\n").filter((line) => line.trim().length > 0);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Header Banner */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={File01Icon} size={24} />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                Syarat & Ketentuan Sewa
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-muted)]">
                Harap baca dengan cermat aturan peminjaman, pembayaran, dan jaminan sebelum melakukan transaksi di Annapurna Adventure.
              </p>
              <div className="pt-2 flex items-center gap-3 text-[11px] text-[var(--color-muted)]">
                <span className="font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                  Versi {activeTerms?.version || "v1.0"}
                </span>
                <span>
                  Terakhir diperbarui:{" "}
                  {activeTerms
                    ? new Date(activeTerms.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Terbaru"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="prose prose-sm max-w-none text-neutral-700 space-y-4">
            {paragraphs.map((para, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors">
                <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs sm:text-sm leading-relaxed text-neutral-800">
                  {para.replace(/^\d+[\.\)]\s*/, "")}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--color-border)] pt-6 mt-8">
            <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-4 text-xs text-amber-900 flex items-start gap-3">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">Penting untuk Diketahui:</span>
                Dengan melakukan checkout dan pembayaran DP, penyewa menyatakan telah menyetujui seluruh butir Syarat & Ketentuan di atas secara sah.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
