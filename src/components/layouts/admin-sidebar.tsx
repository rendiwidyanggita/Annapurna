"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardBrowsingIcon,
  TransactionIcon,
  ShoppingBagIcon,
  Tag01Icon,
  Package01Icon,
  Chart01Icon,
  BotIcon,
  UserIcon,
  ActivityIcon,
  ListViewIcon,
  Group01Icon,
  LogOutIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

interface AdminSidebarProps {
  /** Name of logged-in admin for display */
  adminName?: string;
  /** Role of logged-in admin */
  adminRole?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  /** Disable link — feature not yet implemented in this sprint */
  disabled?: boolean;
}

/**
 * Admin sidebar navigation items.
 * Items marked disabled=true are planned for future sprints.
 * Active/disabled state is clear to admin via visual treatment.
 */
const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: ROUTES.ADMIN.DASHBOARD,
    icon: DashboardBrowsingIcon,
  },
  {
    label: "Transaksi",
    href: ROUTES.ADMIN.TRANSACTIONS,
    icon: TransactionIcon,
    disabled: true,
  },
  {
    label: "Produk",
    href: ROUTES.ADMIN.PRODUCTS,
    icon: ShoppingBagIcon,
  },
  {
    label: "Kategori",
    href: ROUTES.ADMIN.CATEGORIES,
    icon: Tag01Icon,
  },
  {
    label: "Unit Inventaris",
    href: ROUTES.ADMIN.UNITS,
    icon: ListViewIcon,
  },
  {
    label: "Paket Sewa",
    href: ROUTES.ADMIN.PACKAGES,
    icon: Package01Icon,
  },
  {
    label: "Laporan",
    href: ROUTES.ADMIN.REPORTS,
    icon: Chart01Icon,
    disabled: true,
  },
  {
    label: "Syarat & Ketentuan",
    href: ROUTES.ADMIN.TERMS,
    icon: Group01Icon,
    disabled: true,
  },
  {
    label: "Chatbot KB",
    href: ROUTES.ADMIN.CHATBOT,
    icon: BotIcon,
    disabled: true,
  },
  {
    label: "Pengguna",
    href: ROUTES.ADMIN.USERS,
    icon: UserIcon,
    disabled: true,
  },
  {
    label: "Activity Log",
    href: ROUTES.ADMIN.LOGS,
    icon: ActivityIcon,
    disabled: true,
  },
];

/**
 * AdminSidebar — Client Component for admin navigation.
 *
 * Next.js App Router pattern (context7):
 * - Must be Client Component to use usePathname() for active state
 * - Imported into (admin)/layout.tsx which is a Server Component
 * - Active state: pathname.startsWith(href) to handle nested routes
 *
 * Disabled items show future sprint features — visible but not clickable.
 */
export function AdminSidebar({ adminName, adminRole }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col bg-[#0F4F3C] text-white">
      {/* ── Brand header ── */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
        <Image
          src="/images/favicon.svg"
          alt="ANNAPURNA"
          width={32}
          height={32}
          className="brightness-0 invert shrink-0"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight truncate">ANNAPURNA</p>
          <p className="text-[10px] text-white/50 leading-tight">
            Admin Panel
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Admin navigation">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              !item.disabled &&
              (pathname === item.href ||
                pathname.startsWith(item.href + "/"));

            if (item.disabled) {
              return (
                <li key={item.href}>
                  <span
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                      "text-sm text-white/30 cursor-not-allowed",
                    )}
                    title="Belum tersedia di sprint ini"
                    aria-disabled="true"
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      size={17}
                      strokeWidth={1.5}
                      color="currentColor"
                      className="shrink-0 opacity-40"
                    />
                    <span className="truncate">{item.label}</span>
                    <span className="ml-auto text-[9px] font-medium bg-white/10 text-white/40 px-1.5 py-0.5 rounded shrink-0">
                      Soon
                    </span>
                  </span>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                    "text-sm transition-colors duration-150",
                    isActive
                      ? "bg-white/15 text-white font-semibold"
                      : "text-white/70 hover:text-white hover:bg-white/10",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    size={17}
                    strokeWidth={1.5}
                    color="currentColor"
                    className={cn(
                      "shrink-0",
                      isActive ? "opacity-100" : "opacity-70",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {/* Active indicator bar */}
                  {isActive && (
                    <span
                      className="ml-auto w-1 h-4 rounded-full bg-white/60 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User info + logout ── */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <HugeiconsIcon
              icon={UserIcon}
              size={16}
              strokeWidth={1.5}
              color="white"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {adminName ?? "Admin"}
            </p>
            <p className="text-[10px] text-white/50 capitalize">
              {adminRole?.toLowerCase() ?? "admin"}
            </p>
          </div>
        </div>
        <Link
          href="/logout"
          className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"
        >
          <HugeiconsIcon
            icon={LogOutIcon}
            size={14}
            strokeWidth={1.5}
            color="currentColor"
          />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}
