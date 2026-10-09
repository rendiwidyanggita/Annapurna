"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

const NAV_ITEMS = [
  { label: "Katalog", href: ROUTES.CATALOG },
  { label: "Paket", href: ROUTES.PACKAGES },
  { label: "S&K", href: ROUTES.TERMS },
] as const;

/**
 * NavLinks — Client Component for desktop navigation with active underline state.
 * Uses usePathname() per Next.js App Router recommendation (context7: active nav links).
 * Active state: underline (not bold) to prevent layout shift — Design.md decision.
 */
export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex items-center gap-1", className)}
      aria-label="Navigasi utama"
    >
      {NAV_ITEMS.map(({ label, href }) => {
        const isActive = pathname === href || pathname?.startsWith(href + "/");

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              // Base
              "relative px-3 py-2 text-sm font-medium transition-colors duration-150",
              "rounded-[var(--radius-sm)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
              // Underline indicator — pseudo element trick to avoid layout shift
              "after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:transition-all after:duration-150",
              isActive
                ? "text-[var(--color-primary)] after:bg-[var(--color-primary)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] after:bg-transparent hover:after:bg-[var(--color-border)]",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
