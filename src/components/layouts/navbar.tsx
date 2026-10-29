import Image from "next/image";
import Link from "next/link";
import { User02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { CartButton } from "./cart-button";
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
        "bg-white/80 backdrop-blur-md",
        "border-b border-black/[0.04]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
      )}
    >
      <div className="container-page h-16 flex items-center justify-between gap-4">
        {/* ── Logo ── */}
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-3 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-xl"
          aria-label="ANNAPURNA Adventure — Kembali ke Beranda"
        >
          <div className="size-11 sm:size-12 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-1 overflow-hidden shrink-0">
            <Image
              src="/images/favicon.png"
              alt="Logo ANNAPURNA Adventure"
              width={44}
              height={44}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <span className="hidden sm:block font-extrabold text-base sm:text-lg text-[var(--color-primary)] tracking-tight leading-none">
            ANNAPURNA
            <span className="block text-[10px] font-semibold text-[var(--color-muted)] tracking-wider mt-0.5 uppercase">
              Adventure
            </span>
          </span>
        </Link>

        {/* ── Desktop Nav Links (center) ── */}
        <NavLinks className="hidden md:flex" />

        {/* ── Desktop Auth CTA (right) ── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Cart icon with real-time badge */}
          <CartButton />

          {isAuthenticated ? (
            /* Logged-in: avatar button → profile */
            <Link
              href={ROUTES.PROFILE}
              className={cn(
                "flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full",
                "border border-slate-200",
                "hover:bg-slate-50 transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
              )}
              aria-label={`Profil ${displayName}`}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full",
                  "bg-brand-50 text-brand-600",
                )}
              >
                <HugeiconsIcon
                  icon={User02Icon}
                  size={14}
                  strokeWidth={1.5}
                  color="currentColor"
                />
              </div>
              {displayName && (
                <span className="text-xs font-medium text-slate-800 max-w-[100px] truncate">
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
                  "min-h-[44px] flex items-center px-3.5 py-1.5 rounded-xl text-sm font-medium",
                  "text-slate-600 hover:text-slate-900",
                  "hover:bg-slate-100 transition-colors duration-150",
                  "active:scale-[0.96]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                )}
              >
                Masuk
              </Link>
              <Link
                href={ROUTES.REGISTER}
                className={cn(
                  "min-h-[44px] flex items-center px-4 py-1.5 rounded-xl text-sm font-semibold",
                  "bg-brand-600 text-white",
                  "hover:bg-brand-700 transition-transform active:scale-[0.96] duration-150 ease-out",
                  "shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
                )}
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile: Cart + Hamburger ── */}
        <div className="md:hidden flex items-center gap-2">
          <CartButton />

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
