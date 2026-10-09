"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

const NAV_ITEMS = [
  { label: "Katalog", href: ROUTES.CATALOG },
  { label: "Paket", href: ROUTES.PACKAGES },
  { label: "S&K", href: ROUTES.TERMS },
] as const;

interface MobileMenuProps {
  isAuthenticated: boolean;
  userName?: string | null;
}

/**
 * MobileMenu — Client Component for mobile navigation drawer.
 * Closes automatically on route change (usePathname dependency).
 */
export function MobileMenu({ isAuthenticated, userName }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "md:hidden flex items-center justify-center",
          "w-9 h-9 rounded-[var(--radius-md)]",
          "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
          "hover:bg-[var(--color-border-soft)]",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
        )}
        aria-label={isOpen ? "Tutup menu" : "Buka menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        <HugeiconsIcon
          icon={isOpen ? Cancel01Icon : Menu01Icon}
          size={20}
          strokeWidth={1.5}
          color="currentColor"
        />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 top-16 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-label="Menu navigasi mobile"
        className={cn(
          "md:hidden fixed top-16 left-0 right-0 z-50",
          "bg-[var(--color-surface)] border-b border-[var(--color-border)]",
          "shadow-[var(--shadow-modal)]",
          "transition-all duration-200 ease-out",
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none",
        )}
      >
        <div className="container-page py-4 flex flex-col gap-1">
          {/* Nav Links */}
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive =
              pathname === href || pathname?.startsWith(href + "/");

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "text-[var(--color-foreground)] hover:bg-[var(--color-border-soft)]",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-2 border-t border-[var(--color-border)]" />

          {/* Auth Actions */}
          {isAuthenticated ? (
            <div className="flex flex-col gap-2">
              {userName && (
                <p className="px-3 text-xs text-[var(--color-muted)]">
                  Masuk sebagai{" "}
                  <span className="font-semibold text-[var(--color-foreground)]">
                    {userName}
                  </span>
                </p>
              )}
              <Link
                href={ROUTES.ORDERS}
                className="px-3 py-3 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border-soft)] transition-colors"
              >
                Pesanan Saya
              </Link>
              <Link
                href={ROUTES.PROFILE}
                className="px-3 py-3 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border-soft)] transition-colors"
              >
                Profil
              </Link>
              <Link
                href="/logout"
                className="px-3 py-3 rounded-[var(--radius-md)] text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Keluar
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href={ROUTES.LOGIN}
                className={cn(
                  "px-4 py-3 rounded-[var(--radius-md)] text-sm font-semibold text-center",
                  "border border-[var(--color-border)] text-[var(--color-foreground)]",
                  "hover:bg-[var(--color-border-soft)] transition-colors",
                )}
              >
                Masuk
              </Link>
              <Link
                href={ROUTES.REGISTER}
                className={cn(
                  "px-4 py-3 rounded-[var(--radius-md)] text-sm font-semibold text-center",
                  "bg-[var(--color-primary)] text-white",
                  "hover:bg-[var(--color-primary-hover)] transition-colors",
                )}
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
