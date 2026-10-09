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
        "min-h-[60vh] md:min-h-[70vh]",
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

      {/* ── Gradient Overlay — bottom to top ── */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
        aria-hidden="true"
      />

      {/* ── Subtle top gradient for readability ── */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent"
        aria-hidden="true"
      />

      {/* ── Text Content — bottom left ── */}
      <div className="absolute inset-0 flex items-end">
        <div className="container-page pb-10 md:pb-14 max-w-2xl">
          {/* Eyebrow label */}
          <div className="inline-flex items-center gap-2 mb-4">
            <span
              className={cn(
                "inline-block h-px w-8 bg-white/60",
              )}
              aria-hidden="true"
            />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
              Penyewaan Alat Outdoor
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.15] tracking-tight mb-4">
            Lengkapi
            <br />
            Petualanganmu
            <br />
            <span className="text-[#7EDDB5]">Bersama Kami</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-md mb-8">
            Sewa tenda, carrier, sleeping gear, dan perlengkapan camping
            berkualitas di Malang. Mudah, terpercaya, dan terjangkau.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={ROUTES.CATALOG}
              className={cn(
                "inline-flex items-center justify-center",
                "px-6 py-3 rounded-[var(--radius-md)]",
                "text-sm font-semibold text-white",
                "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]",
                "shadow-[var(--shadow-card-hover)]",
                "transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              )}
            >
              Lihat Katalog
            </Link>
            <Link
              href={ROUTES.PACKAGES}
              className={cn(
                "inline-flex items-center justify-center",
                "px-6 py-3 rounded-[var(--radius-md)]",
                "text-sm font-semibold text-white",
                "bg-white/15 hover:bg-white/25 backdrop-blur-sm",
                "border border-white/30 hover:border-white/50",
                "transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              )}
            >
              Lihat Paket
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
