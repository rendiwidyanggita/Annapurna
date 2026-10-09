import { Suspense } from "react";
import type { Metadata } from "next";
import { HeroSection } from "@/components/organisms/hero-section";
import { CategoryGrid } from "@/components/organisms/category-grid";
import { ProductTabs } from "@/components/organisms/product-tabs";
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
 * 1. HeroSection    — full-width photo with gradient overlay, CTA
 * 2. CategoryGrid   — 5 product categories with Hugeicons
 * 3. ProductTabs    — Terlaris/Terbaru tabs from DB (wrapped in Suspense)
 * 4. HowItWorks     — 4-step rental process with soft green background
 *
 * ProductTabs is wrapped in <Suspense> following context7 streaming pattern:
 * page shell renders immediately, product data streams in after DB resolves.
 */
export default function Home() {
  return (
    <>
      {/* ── Hero — full-width, no container padding ── */}
      <HeroSection />

      {/* ── Category Grid ── */}
      <section className="container-page py-12 md:py-16">
        <CategoryGrid />
      </section>

      {/* ── Product Tabs — Suspense for streaming DB data ── */}
      <section className="container-page py-12 md:py-16">
        <Suspense
          fallback={
            <ProductTabsSkeleton />
          }
        >
          <ProductTabs />
        </Suspense>
      </section>

      {/* ── How It Works — full-width soft green background ── */}
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
            className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            {/* Image placeholder */}
            <div className="aspect-[4/3] bg-[var(--color-border-soft)]" />
            {/* Content placeholder */}
            <div className="p-3 space-y-2">
              <div className="h-2.5 w-16 rounded bg-[var(--color-border-soft)]" />
              <div className="h-3.5 w-full rounded bg-[var(--color-border-soft)]" />
              <div className="h-3.5 w-3/4 rounded bg-[var(--color-border-soft)]" />
              <div className="h-4 w-24 rounded bg-[var(--color-border-soft)] mt-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
