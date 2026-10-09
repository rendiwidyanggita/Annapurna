import Image from "next/image";
import Link from "next/link";
import { ShoppingCart01Icon, User02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { NavLinks } from "./nav-links";
import { MobileMenu } from "./mobile-menu";

/**
 * Navbar — Server Component shell.
 *
 * Composition pattern (Next.js App Router best practice):
 * - Navbar itself is a Server Component → fetches auth state from server
 * - NavLinks → Client Component (needs usePathname for active state)
 * - MobileMenu → Client Component (needs useState for toggle)
 *
 * Design.md:
 * - Sticky with backdrop-blur
 * - Logo SVG left, nav links center (desktop), auth CTA right
 * - Active state: underline, not bold (no layout shift)
 */
export async function Navbar() {
  const { isAuthenticated, user, profile } = await getCurrentUserProfile();

  const displayName =
    profile?.fullName || user?.email?.split("@")[0] || null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        "bg-[var(--color-surface)]/90 backdrop-blur-md",
        "border-b border-[var(--color-border)]",
      )}
    >
      <div className="container-page h-16 flex items-center justify-between gap-4">
        {/* ── Logo ── */}
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-2.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-[var(--radius-sm)]"
          aria-label="ANNAPURNA Adventure — Kembali ke Beranda"
        >
          <Image
            src="/images/favicon.svg"
            alt="Logo ANNAPURNA Adventure"
            width={36}
            height={36}
            className="rounded-[var(--radius-sm)]"
            priority
          />
          <span className="hidden sm:block font-bold text-base text-[var(--color-primary)] tracking-tight leading-none">
            ANNAPURNA
            <span className="block text-[10px] font-medium text-[var(--color-muted)] tracking-wide">
              Adventure
            </span>
          </span>
        </Link>

        {/* ── Desktop Nav Links (center) ── */}
        <NavLinks className="hidden md:flex" />

        {/* ── Desktop Auth CTA (right) ── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Cart icon — visible always */}
          <Link
            href={ROUTES.CART}
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)]",
              "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
              "hover:bg-[var(--color-border-soft)] transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
            )}
            aria-label="Keranjang sewa"
          >
            <HugeiconsIcon
              icon={ShoppingCart01Icon}
              size={20}
              strokeWidth={1.5}
              color="currentColor"
            />
          </Link>

          {isAuthenticated ? (
            /* Logged-in: avatar button → profile */
            <Link
              href={ROUTES.PROFILE}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)]",
                "border border-[var(--color-border)]",
                "hover:bg-[var(--color-border-soft)] transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
              )}
              aria-label={`Profil ${displayName}`}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full",
                  "bg-[var(--color-primary-soft)]",
                )}
              >
                <HugeiconsIcon
                  icon={User02Icon}
                  size={14}
                  strokeWidth={1.5}
                  color="var(--color-primary)"
                />
              </div>
              {displayName && (
                <span className="text-xs font-medium text-[var(--color-foreground)] max-w-[100px] truncate">
                  {displayName}
                </span>
              )}
            </Link>
          ) : (
            /* Guest: Login + Register */
            <>
              <Link
                href={ROUTES.LOGIN}
                className={cn(
                  "px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-medium",
                  "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
                  "hover:bg-[var(--color-border-soft)] transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                )}
              >
                Masuk
              </Link>
              <Link
                href={ROUTES.REGISTER}
                className={cn(
                  "px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-semibold",
                  "bg-[var(--color-primary)] text-white",
                  "hover:bg-[var(--color-primary-hover)] transition-colors duration-150",
                  "shadow-[var(--shadow-card)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
                )}
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile: Cart + Hamburger ── */}
        <div className="md:hidden flex items-center gap-2">
          <Link
            href={ROUTES.CART}
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)]",
              "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
              "hover:bg-[var(--color-border-soft)] transition-colors duration-150",
            )}
            aria-label="Keranjang sewa"
          >
            <HugeiconsIcon
              icon={ShoppingCart01Icon}
              size={20}
              strokeWidth={1.5}
              color="currentColor"
            />
          </Link>

          {/* MobileMenu is Client Component */}
          <MobileMenu
            isAuthenticated={isAuthenticated}
            userName={displayName}
          />
        </div>
      </div>
    </header>
  );
}
