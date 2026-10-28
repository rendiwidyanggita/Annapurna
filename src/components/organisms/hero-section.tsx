import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

/**
 * HeroSection — Full-width hero with image, gradient overlay, and bottom-left text.
 *
 * Design.md decisions implemented:
 * - Full-width photo with bottom gradient overlay (from-black/70 via-black/30 to-transparent)
 * - Text positioned bottom-left
 * - Height: min-h-[70vh] desktop, min-h-[60vh] mobile
 * - Image uses priority (LCP element — Next.js context7 recommendation)
 * - CTA button → /katalog
 *
 * Next.js Image (context7):
 * - fill + sizes="100vw" for full-screen background
 * - priority=true: disables lazy loading for LCP image
 * - quality=90 for good balance of sharpness and file size
 */
export function HeroSection() {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden",
        "min-h-[75vh] md:min-h-[85vh] flex items-end",
      )}
      aria-label="Hero — ANNAPURNA Adventure"
    >
      {/* ── Background Image ── */}
      <Image
        src="/images/hero.png"
        alt="Pemandangan alam pegunungan — ANNAPURNA Adventure"
        fill
        sizes="100vw"
        quality={90}
        priority
        className="object-cover object-center"
      />

      {/* ── Gradient Overlay — bottom to top multi-stop scrim ── */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 via-50% to-transparent"
        aria-hidden="true"
      />

      {/* ── Subtle top gradient for navbar contrast ── */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/25 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* ── Text Content — bottom left with space for floating widget ── */}
      <div className="relative z-10 w-full container-page pb-16 sm:pb-20 md:pb-24 max-w-2xl">
        {/* Eyebrow label */}
        <div className="inline-flex items-center gap-2 mb-3">
          <span
            className="inline-block h-px w-8 bg-brand-300/80"
            aria-hidden="true"
          />
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-100">
            Penyewaan Alat Outdoor Purwokerto
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.15] tracking-tight text-balance mb-4">
          Lengkapi
          <br />
          Petualanganmu
          <br />
          <span className="text-brand-300">Bersama Kami</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-sm sm:text-base text-white/85 leading-relaxed text-pretty max-w-lg mb-7">
          Sewa tenda, carrier, sleeping gear, dan perlengkapan camping
          berkualitas di Purwokerto (Basecamp pendakian Gunung Slamet & Jawa Tengah). Mudah, terpercaya, dan terjangkau.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-3">
          <Link
            href={ROUTES.CATALOG}
            className={cn(
              "inline-flex items-center justify-center min-h-[44px]",
              "px-6 py-3 rounded-xl",
              "text-sm font-semibold text-white",
              "bg-brand-600 hover:bg-brand-700",
              "shadow-md",
              "active:scale-[0.96] transition-transform duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
            )}
          >
            Lihat Katalog
          </Link>
          <Link
            href={ROUTES.PACKAGES}
            className={cn(
              "inline-flex items-center justify-center min-h-[44px]",
              "px-6 py-3 rounded-xl",
              "text-sm font-semibold text-white",
              "bg-white/15 hover:bg-white/25 backdrop-blur-sm",
              "border border-white/30 hover:border-white/50",
              "active:scale-[0.96] transition-transform duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
            )}
          >
            Lihat Paket
          </Link>
        </div>
      </div>
    </section>
  );
}
