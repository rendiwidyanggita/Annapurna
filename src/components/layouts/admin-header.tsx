"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Menu01Icon,
  Store01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

export interface AdminHeaderProps {
  onMenuClick?: () => void;
  adminRole?: string;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
}

const ROUTE_LABELS: Record<string, string> = {
  "/admin/dashboard": "Dashboard Ringkasan",
  "/admin/dashboard/transaksi": "Transaksi Penyewaan",
  "/admin/dashboard/produk": "Katalog Produk & Variasi",
  "/admin/dashboard/produk/baru": "Tambah Produk Baru",
  "/admin/dashboard/unit": "Manajemen Unit & Stok",
  "/admin/dashboard/paket": "Paket Sewa Outdoor",
  "/admin/dashboard/paket/baru": "Tambah Paket Baru",
  "/admin/dashboard/kategori": "Kategori Perlengkapan",
  "/admin/dashboard/laporan": "Laporan & Rekapitulasi",
  "/admin/dashboard/chatbot": "Knowledge Base AI",
  "/admin/dashboard/syarat-ketentuan": "Syarat & Ketentuan",
  "/admin/dashboard/pengguna": "Manajemen Pengguna",
  "/admin/dashboard/activity-log": "Activity Audit Log",
};

export function AdminHeader({
  onMenuClick,
  className,
  title,
  actions,
}: AdminHeaderProps) {
  const pathname = usePathname();

  // Determine current active title
  const currentTitle =
    title ||
    ROUTE_LABELS[pathname] ||
    (pathname.includes("/pickup")
      ? "Proses Pickup (Handover)"
      : pathname.includes("/return")
      ? "Proses Return & Denda"
      : pathname.includes("/edit")
      ? "Edit Data"
      : "Admin Panel");

  // Generate breadcrumb trail
  const pathSegments = pathname.split("/").filter(Boolean);

  return (
    <header
      className={cn(
        "h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 sticky top-0 z-20 flex items-center justify-between shrink-0",
        className
      )}
    >
      {/* ── Left Side: Hamburger (Mobile) + Breadcrumb & Title ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Buka menu navigasi"
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
        >
          <HugeiconsIcon icon={Menu01Icon} size={20} />
        </button>

        {/* Title & Breadcrumbs */}
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#6B7280]">
            <Link
              href={ROUTES.ADMIN.DASHBOARD}
              className="hover:text-[#16624B] transition-colors font-medium"
            >
              Admin
            </Link>
            {pathSegments.length > 2 && (
              <>
                <HugeiconsIcon icon={ArrowRight01Icon} size={11} className="text-gray-400" />
                <span className="capitalize text-gray-400">
                  {pathSegments[2].replace(/-/g, " ")}
                </span>
              </>
            )}
          </nav>

          <h1 className="text-sm sm:text-base font-bold text-[#111827] truncate leading-tight">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* ── Right Side: Context Actions & Store Link ── */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Custom contextual actions slot */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* View Customer Website Link */}
        <Link
          href={ROUTES.HOME}
          target="_blank"
          rel="noopener noreferrer"
          title="Lihat website toko publik"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#374151] hover:text-[#16624B] hover:border-[#16624B]/30 hover:bg-[#E7F3EE]/40 transition-colors"
        >
          <HugeiconsIcon icon={Store01Icon} size={15} />
          <span className="hidden md:inline">Lihat Toko</span>
        </Link>
      </div>
    </header>
  );
}
