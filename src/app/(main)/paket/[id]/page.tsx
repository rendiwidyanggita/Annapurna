import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Package01Icon,
  Message01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";

interface PackageDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function generateMetadata({
  params,
}: PackageDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const pkg = await prisma.package.findUnique({
    where: { id },
    select: { name: true, description: true },
  });

  if (!pkg) {
    return { title: "Paket Sewa Tidak Ditemukan | ANNAPURNA" };
  }

  return {
    title: `${pkg.name} | Paket Sewa Hemat ANNAPURNA`,
    description:
      pkg.description ||
      `Sewa ${pkg.name} lengkap hemat untuk pendakian dan camping.`,
  };
}

export default async function PackageDetailPage({
  params,
}: PackageDetailPageProps) {
  const { id } = await params;

  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: { select: { name: true } },
              media: {
                where: { isPrimary: true },
                select: { mediaUrl: true },
              },
            },
          },
        },
      },
    },
  });

  if (!pkg || pkg.deletedAt || !pkg.isActive) {
    notFound();
  }

  const waText = encodeURIComponent(
    `Halo Annapurna Adventure, saya tertarik dengan "${pkg.name}" (Paket Sewa). Apakah paket ini tersedia untuk tanggal tertentu?`
  );
  const waUrl = `https://wa.me/6281234567890?text=${waText}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <li>
            <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">
              Beranda
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href="/katalog"
              className="hover:text-[var(--color-primary)] transition-colors"
            >
              Katalog
            </Link>
          </li>
          <li>/</li>
          <li className="font-semibold text-[var(--color-primary)] line-clamp-1">
            {pkg.name}
          </li>
        </ol>
      </nav>

      {/* Main Package Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Package Banner / Image */}
        <div className="lg:col-span-6">
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-[var(--color-border)] shadow-sm">
            {pkg.bannerUrl ? (
              <Image
                src={pkg.bannerUrl}
                alt={pkg.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--color-primary-soft)] text-[var(--color-primary)] opacity-70">
                <HugeiconsIcon icon={Package01Icon} size={48} />
                <span className="text-xs font-medium mt-2">Paket Sewa Lengkap</span>
              </div>
            )}
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-950 shadow-sm">
              Paket Hemat
            </span>
          </div>
        </div>

        {/* Right: Package Info & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <Badge variant="secondary" className="text-xs mb-2">
              Paket Sewa Outdoor
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-foreground)] tracking-tight">
              {pkg.name}
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-2">
              {pkg.description || "Solusi praktis dan hemat untuk kebutuhan pendakian Anda."}
            </p>
          </div>

          {/* Pricing Box */}
          <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-muted)] font-medium block">
              Tarif Paket Sewa
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[var(--color-primary)]">
                {formatRupiah(pkg.packagePrice)}
              </span>
              <span className="text-xs text-gray-500 font-medium">/ paket sewa</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Lebih hemat dibanding sewa perlengkapan satu per satu.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold h-12 shadow-sm text-sm gap-2"
            >
              <HugeiconsIcon icon={Calendar01Icon} size={18} />
              Sewa Paket Ini
            </Button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block"
            >
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold h-11 text-sm gap-2"
              >
                <HugeiconsIcon icon={Message01Icon} size={18} className="text-emerald-600" />
                Tanya Paket via WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Package Items Breakdown (AA-56) */}
      <div className="pt-8 border-t border-[var(--color-border)] space-y-5">
        <h2 className="text-xl font-bold text-[var(--color-primary)]">
          Item Perlengkapan Dalam Paket Ini
        </h2>

        {pkg.items.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Rincian isi paket belum ditentukan oleh admin.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pkg.items.map((item) => {
              const primaryMedia = item.product.media[0];

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white border border-[var(--color-border)] shadow-xs"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    {primaryMedia ? (
                      <Image
                        src={primaryMedia.mediaUrl}
                        alt={item.product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <HugeiconsIcon icon={Package01Icon} size={20} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-[var(--color-muted)] block">
                      {item.product.category.name}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">
                      {item.product.name}
                    </h3>
                    <span className="inline-block mt-1 text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-2 py-0.5 rounded">
                      {item.quantity}x unit
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
