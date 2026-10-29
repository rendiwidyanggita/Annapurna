import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/config/routes";
import { SITE_CONFIG } from "@/config/site";
import { WhatsAppIcon, InstagramIcon, LocationIcon } from "@/components/atoms";

/**
 * Footer — Persistent footer for all customer-facing pages.
 *
 * Server Component. Lives in (main)/layout.tsx alongside Navbar.
 *
 * Design:
 * - Background: dark green #0F4F3C
 * - Logo: white variant via CSS brightness-0 invert filter
 * - 3-column grid desktop, stacked vertical mobile
 * - Contact data sourced from SITE_CONFIG with official brand SVGs from theSVG
 */
export function Footer() {
  return (
    <footer className="w-full bg-brand-800 text-white">
      <div className="container-page py-12 md:py-16">
        {/* Main grid — 3 columns desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
          {/* ── Column 1: Brand ── */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="size-12 sm:size-14 rounded-2xl bg-white p-1.5 shadow-md shrink-0 border border-white/20 flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/favicon.png"
                  alt="ANNAPURNA Adventure"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="font-extrabold text-base sm:text-lg leading-tight tracking-tight">ANNAPURNA</p>
                <p className="text-xs text-white/70 leading-tight font-medium uppercase tracking-wider">Adventure</p>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed max-w-[260px] text-pretty">
              Penyewaan alat outdoor terpercaya di Purwokerto (Basecamp Slamet). Sewa mudah, barang terawat, tarif transparan.
            </p>
          </div>

          {/* ── Column 2: Navigation ── */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
              Navigasi
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href={ROUTES.CATALOG}
                  className="min-h-[44px] flex items-center py-2 text-sm text-white/80 hover:text-white transition-colors duration-150"
                >
                  Katalog Produk
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PACKAGES}
                  className="min-h-[44px] flex items-center py-2 text-sm text-white/80 hover:text-white transition-colors duration-150"
                >
                  Paket Sewa
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.TERMS}
                  className="min-h-[44px] flex items-center py-2 text-sm text-white/80 hover:text-white transition-colors duration-150"
                >
                  Syarat &amp; Ketentuan
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Column 3: Contact ── */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">
              Kontak
            </h3>
            <ul className="space-y-3">
              {/* WhatsApp */}
              <li>
                <a
                  href={SITE_CONFIG.contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-white/80 hover:text-white transition-colors duration-150 group"
                  aria-label="Hubungi kami via WhatsApp"
                >
                  <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 group-hover:bg-[#25D366]/25 transition-colors p-1.5 border border-white/10 shadow-sm">
                    <WhatsAppIcon className="w-full h-full drop-shadow-sm" />
                  </span>
                  <span className="group-hover:translate-x-0.5 transition-transform font-medium">
                    {SITE_CONFIG.contact.phone}
                  </span>
                </a>
              </li>
              {/* Instagram */}
              <li>
                <a
                  href={SITE_CONFIG.contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-white/80 hover:text-white transition-colors duration-150 group"
                  aria-label="Ikuti kami di Instagram"
                >
                  <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 group-hover:bg-[#E1306C]/25 transition-colors p-1.5 border border-white/10 shadow-sm">
                    <InstagramIcon className="w-full h-full drop-shadow-sm" />
                  </span>
                  <span className="group-hover:translate-x-0.5 transition-transform font-medium">
                    @{SITE_CONFIG.contact.instagram}
                  </span>
                </a>
              </li>
              {/* Address / Location */}
              <li>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE_CONFIG.contact.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-sm text-white/70 hover:text-white transition-colors duration-150 group"
                  aria-label="Buka lokasi toko di Google Maps"
                >
                  <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors p-1.5 border border-white/10 shadow-sm mt-0.5">
                    <LocationIcon className="w-full h-full drop-shadow-sm" />
                  </span>
                  <address className="not-italic leading-relaxed group-hover:text-white transition-colors">
                    {SITE_CONFIG.contact.address}
                  </address>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <p>© 2026 ANNAPURNA Adventure. All Right Reserved</p>
          <p>Purwokerto, Jawa Tengah</p>
        </div>
      </div>
    </footer>
  );
}
