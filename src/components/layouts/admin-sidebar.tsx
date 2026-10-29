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
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export interface AdminSidebarProps {
  /** Name of logged-in admin for display */
  adminName?: string;
  /** Role of logged-in admin ('ADMIN' | 'OWNER') */
  adminRole?: string;
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  ownerOnly?: boolean;
  disabled?: boolean;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
  ownerOnly?: boolean;
}

/**
 * 4 Architectural Navigation Groups (PRD Section 16.15 & admin-design-system.md)
 */
const NAV_GROUPS: NavGroup[] = [
  {
    groupName: "Operasional",
    items: [
      {
        label: "Dashboard",
        href: ROUTES.ADMIN.DASHBOARD,
        icon: DashboardBrowsingIcon,
      },
      {
        label: "Transaksi",
        href: ROUTES.ADMIN.TRANSACTIONS,
        icon: TransactionIcon,
      },
    ],
  },
  {
    groupName: "Katalog & Inventaris",
    items: [
      {
        label: "Produk & Variasi",
        href: ROUTES.ADMIN.PRODUCTS,
        icon: ShoppingBagIcon,
      },
      {
        label: "Unit & Stok",
        href: ROUTES.ADMIN.UNITS,
        icon: ListViewIcon,
      },
      {
        label: "Paket Sewa",
        href: ROUTES.ADMIN.PACKAGES,
        icon: Package01Icon,
      },
      {
        label: "Kategori Alat",
        href: ROUTES.ADMIN.CATEGORIES,
        icon: Tag01Icon,
      },
    ],
  },
  {
    groupName: "Konten & Laporan",
    items: [
      {
        label: "Laporan Transaksi",
        href: ROUTES.ADMIN.REPORTS,
        icon: Chart01Icon,
      },
      {
        label: "Knowledge Base AI",
        href: ROUTES.ADMIN.CHATBOT,
        icon: BotIcon,
      },
      {
        label: "Syarat & Ketentuan",
        href: ROUTES.ADMIN.TERMS,
        icon: Group01Icon,
        ownerOnly: true, // OQ-07
      },
    ],
  },
  {
    groupName: "Administrasi",
    ownerOnly: true, // OQ-07: Seluruh grup ini hanya untuk Owner
    items: [
      {
        label: "Manajemen Pengguna",
        href: ROUTES.ADMIN.USERS,
        icon: UserIcon,
        ownerOnly: true,
      },
      {
        label: "Activity Log",
        href: ROUTES.ADMIN.LOGS,
        icon: ActivityIcon,
        ownerOnly: true,
      },
    ],
  },
];

interface AdminSidebarContentProps extends AdminSidebarProps {
  onItemClick?: () => void;
}

/**
 * Reusable Content for both Desktop Sidebar and Mobile Sheet Drawer
 */
export function AdminSidebarContent({
  adminName,
  adminRole,
  onItemClick,
  className,
}: AdminSidebarContentProps) {
  const pathname = usePathname();
  const isOwner = adminRole?.toUpperCase() === "OWNER";

  return (
    <div className={cn("flex h-full w-full flex-col bg-white select-none", className)}>
      {/* ── Brand Header (h-16, border bottom) ── */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-[#E5E7EB] shrink-0">
        <Link href={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-0.5 overflow-hidden shrink-0">
            <Image
              src="/images/favicon.png"
              alt="ANNAPURNA"
              width={34}
              height={34}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-base tracking-wide text-[#16624B] leading-none block">
              ANNAPURNA
            </span>
            <span className="text-[10px] text-[#6B7280] font-medium leading-none block mt-0.5">
              Admin Workspace
            </span>
          </div>
        </Link>

        {/* Role Badge */}
        <span
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border",
            isOwner
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-[#E7F3EE] text-[#16624B] border-[#16624B]/20"
          )}
        >
          {adminRole?.toUpperCase() || "ADMIN"}
        </span>
      </div>

      {/* ── Navigation Links (Scrollable) ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Menu Admin">
        {NAV_GROUPS.map((group) => {
          // Guardrail OQ-07: Hide owner-only groups if user is not OWNER
          if (group.ownerOnly && !isOwner) {
            return null;
          }

          // Filter items based on owner-only permissions
          const visibleItems = group.items.filter(
            (item) => !item.ownerOnly || isOwner
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupName} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                {group.groupName}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === ROUTES.ADMIN.DASHBOARD
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onItemClick}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 group",
                          isActive
                            ? "bg-[#E7F3EE] text-[#16624B] font-semibold"
                            : "text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#16624B]"
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <HugeiconsIcon
                          icon={item.icon}
                          size={18}
                          strokeWidth={isActive ? 2 : 1.75}
                          className={cn(
                            "shrink-0 transition-colors",
                            isActive
                              ? "text-[#16624B]"
                              : "text-[#9CA3AF] group-hover:text-[#16624B]"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <span
                            className="ml-auto w-1.5 h-4 rounded-full bg-[#16624B] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* ── Footer: Admin Profile & Logout ── */}
      <div className="border-t border-[#E5E7EB] p-3.5 bg-[#F9FAFB]/60 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#E7F3EE] border border-[#16624B]/20 flex items-center justify-center text-[#16624B] font-bold text-xs shrink-0">
              {(adminName || "Admin").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#111827] truncate leading-tight">
                {adminName || "Admin Toko"}
              </p>
              <p className="text-[10px] text-[#6B7280] truncate leading-tight mt-0.5 capitalize">
                {adminRole?.toLowerCase() || "staff admin"}
              </p>
            </div>
          </div>

          <Link
            href="/logout"
            title="Keluar dari Admin"
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
            aria-label="Logout"
          >
            <HugeiconsIcon icon={Logout01Icon} size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * AdminSidebar (Desktop View, fixed left w-64)
 */
export function AdminSidebar({
  adminName,
  adminRole,
  className,
}: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden lg:flex w-64 flex-col border-r border-[#E5E7EB] bg-white h-full shrink-0",
        className
      )}
      aria-label="Sidebar Admin"
    >
      <AdminSidebarContent adminName={adminName} adminRole={adminRole} />
    </aside>
  );
}

/**
 * AdminMobileSidebar (Sheet Drawer for screens < 1024px)
 */
export function AdminMobileSidebar({
  isOpen,
  onClose,
  adminName,
  adminRole,
}: AdminSidebarProps & {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="p-0 w-72 max-w-[85vw] border-r border-[#E5E7EB]">
        <SheetTitle className="sr-only">Menu Navigasi Admin</SheetTitle>
        <SheetDescription className="sr-only">
          Panel navigasi utama sistem manajemen ANNAPURNA
        </SheetDescription>
        <AdminSidebarContent
          adminName={adminName}
          adminRole={adminRole}
          onItemClick={onClose}
        />
      </SheetContent>
    </Sheet>
  );
}
