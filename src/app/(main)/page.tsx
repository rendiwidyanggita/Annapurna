import { Suspense } from "react";
import type { Metadata } from "next";
import { HeroSection } from "@/components/organisms/hero-section";
import { RentalSearchWidget } from "@/components/organisms/rental-search-widget";
import { TrustSignalsSection } from "@/components/organisms/trust-signals-section";
import { CategoryGrid } from "@/components/organisms/category-grid";
import { ProductTabs } from "@/components/organisms/product-tabs";
import {
  FeaturedPackages,
  FeaturedPackagesSkeleton,
} from "@/components/organisms/featured-packages";
import { HowItWorksSection } from "@/components/organisms/how-it-works-section";
import { SITE_CONFIG } from "@/config/site";

export const metadata: Metadata = {
  title: `${SITE_CONFIG.name} — Penyewaan Alat Outdoor Purwokerto`,
  description: SITE_CONFIG.description,
};

/**
 * Homepage — Landing page for ANNAPURNA Adventure.
 *
 * Server Component page (Next.js App Router best practice from context7).
 * Navbar and Footer are in (main)/layout.tsx — not duplicated here.
 *
 * Sections (top to bottom):
 * 1. HeroSection          — full-width photo with gradient overlay, CTA
 * 2. RentalSearchWidget   — floating interactive search card (dates + scheme)
 * 3. TrustSignalsSection  — 4 key value pillars (clean gear, transparent rates, DP 50%, basecamp)
 * 4. CategoryGrid         — 5 product categories with item counters
 * 5. ProductTabs          — Terlaris/Terbaru tabs from DB (wrapped in Suspense)
 * 6. FeaturedPackages     — Bundled rental packages in Asymmetric Bento Grid
 * 7. HowItWorksSection    — 4-step rental process with soft green background
 */
export default function Home() {
  return (
    <>
      {/* ── 1. Hero — full-width ── */}
      <HeroSection />

      {/* ── 2. Rental Search Widget — floating over Hero boundary ── */}
      <RentalSearchWidget />

      {/* ── 3. Trust Signals / Value Proposition ── */}
      <TrustSignalsSection />

      {/* ── 4. Category Grid ── */}
      <section className="container-page py-8 md:py-12">
        <CategoryGrid />
      </section>

      {/* ── 5. Product Tabs — Suspense for streaming DB data ── */}
      <section className="container-page py-8 md:py-12">
        <Suspense fallback={<ProductTabsSkeleton />}>
          <ProductTabs />
        </Suspense>
      </section>

      {/* ── 6. Featured Packages Bento Grid — Suspense for streaming DB data ── */}
      <section className="container-page py-8 md:py-12">
        <Suspense fallback={<FeaturedPackagesSkeleton />}>
          <FeaturedPackages />
        </Suspense>
      </section>

      {/* ── 7. How It Works — full-width soft green background ── */}
      <HowItWorksSection />
    </>
  );
}

/**
 * Skeleton fallback for ProductTabs while DB data loads.
 * Matches the ProductTabs layout: title + tab switcher + 8-card grid.
 */
function ProductTabsSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      {/* Section title skeleton */}
      <div className="h-6 w-40 rounded-md bg-[var(--color-border-soft)] mb-4" />
      {/* Tab switcher skeleton */}
      <div className="flex gap-6 border-b border-[var(--color-border)] pb-2.5 mb-6">
        <div className="h-4 w-16 rounded bg-[var(--color-border-soft)]" />
        <div className="h-4 w-16 rounded bg-[var(--color-border-soft)]" />
      </div>
      {/* Card grid skeleton — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-2.5 sm:p-3 border border-slate-100 bg-white shadow-xs"
          >
            {/* Image placeholder */}
            <div className="aspect-square rounded-xl bg-slate-100 mb-3" />
            {/* Content placeholder */}
            <div className="space-y-2 px-1">
              <div className="h-2.5 w-16 rounded bg-slate-100" />
              <div className="h-3.5 w-full rounded bg-slate-100" />
              <div className="h-3.5 w-3/4 rounded bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100 mt-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
