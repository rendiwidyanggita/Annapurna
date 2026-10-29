import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Shield01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { ProductGallery } from "./product-gallery";
import { ProductInteractivePanel } from "./product-interactive-panel";

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true, description: true },
  });

  if (!product) {
    return { title: "Produk Tidak Ditemukan | ANNAPURNA" };
  }

  return {
    title: `${product.name} | Sewa Alat Outdoor ANNAPURNA`,
    description:
      product.description ||
      `Sewa ${product.name} terawat dan berkualitas dengan tarif sewa harian dan paket kegiatan terjangkau.`,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: { id: true, name: true },
      },
      media: {
        select: {
          id: true,
          mediaUrl: true,
          altText: true,
          isPrimary: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        where: { deletedAt: null },
        include: {
          units: {
            where: {
              unitStatus: "Available",
              isActive: true,
              deletedAt: null,
            },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!product || product.deletedAt || !product.isActive) {
    notFound();
  }

  // Calculate total units currently available in store
  const availableUnitsCount = product.variants.reduce(
    (total, variant) => total + variant.units.length,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
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
          <li>
            <Link
              href={`/katalog?kategori=${product.category.id}`}
              className="hover:text-[var(--color-primary)] transition-colors font-medium text-gray-700"
            >
              {product.category.name}
            </Link>
          </li>
          <li>/</li>
          <li className="font-semibold text-[var(--color-primary)] line-clamp-1">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Main Product Showcase: Left Gallery + Description, Right Interactive Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Gallery + Description (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <ProductGallery media={product.media} productName={product.name} />

          <div className="pt-6 border-t border-[var(--color-border)] space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-primary)]">
              Deskripsi & Spesifikasi Produk
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700 bg-white p-5 sm:p-6 rounded-2xl border border-[var(--color-border)] shadow-xs leading-relaxed whitespace-pre-line">
              {product.description ||
                "Belum ada deskripsi lengkap untuk produk ini. Hubungi layanan admin via WhatsApp untuk menanyakan spesifikasi teknis lebih lanjut."}
            </div>
          </div>
        </div>

        {/* Right Column: Summary & Interactive Selector (6 cols, sticky on desktop) */}
        <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {product.category.name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {product.itemType === "rental_unit" ? "Alat Sewa" : "Barang Habis Pakai"}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-foreground)] tracking-tight">
              {product.name}
            </h1>
          </div>

          {/* Interactive Pricing, Variant & WhatsApp CTA */}
          <ProductInteractivePanel
            productId={product.id}
            productName={product.name}
            imageUrl={product.media.find((m) => m.isPrimary)?.mediaUrl || product.media[0]?.mediaUrl || null}
            itemType={product.itemType as "rental_unit" | "consumable"}
            pricePermalam={product.pricePermalam}
            pricePerkegiatan1={product.pricePerkegiatan1}
            pricePerkegiatan2={product.pricePerkegiatan2}
            consumableStock={product.consumableStock}
            availableUnitsCount={availableUnitsCount}
            variants={product.variants.map((v) => ({
              id: v.id,
              variantName: v.variantName,
              size: v.size,
              color: v.color,
              brand: v.brand,
            }))}
          />

          {/* Rental Guarantee Trust Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[var(--color-border-soft)]">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-soft)]">
              <HugeiconsIcon icon={Shield01Icon} size={18} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <span className="font-bold text-gray-800 block">Jaminan Resmi</span>
                <span className="text-gray-500">Cukup E-KTP / SIM asli</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-soft)]">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <span className="font-bold text-gray-800 block">Unit Bersih & Terawat</span>
                <span className="text-gray-500">Dicek sebelum serah terima</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-soft)]">
              <HugeiconsIcon icon={Clock01Icon} size={18} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <span className="font-bold text-gray-800 block">Ambil di Outlet</span>
                <span className="text-gray-500">Buka setiap hari</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
