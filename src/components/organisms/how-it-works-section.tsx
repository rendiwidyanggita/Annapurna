import {
  Search01Icon,
  CreditCardIcon,
  StoreIcon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import { StepCard } from "@/components/molecules/step-card";

/**
 * 4 steps for the "Cara Sewa" section.
 * Icons verified available in @hugeicons/core-free-icons.
 */
const STEPS = [
  {
    step: 1,
    title: "Pilih Produk",
    description:
      "Jelajahi katalog dan pilih alat outdoor yang kamu butuhkan",
    icon: Search01Icon,
  },
  {
    step: 2,
    title: "Bayar DP 50%",
    description:
      "Konfirmasi booking dengan bayar DP 50% via QRIS atau transfer",
    icon: CreditCardIcon,
  },
  {
    step: 3,
    title: "Ambil di Toko",
    description:
      "Datang ke toko sesuai tanggal, serahkan identitas asli sebagai jaminan",
    icon: StoreIcon,
  },
  {
    step: 4,
    title: "Kembalikan Tepat Waktu",
    description:
      "Kembalikan alat sesuai tanggal, lunasi sisa pembayaran di toko",
    icon: Calendar01Icon,
    isLast: true,
  },
] as const;

/**
 * HowItWorksSection — Organism that explains the 4-step rental process.
 *
 * Server Component. Renders below ProductTabs on the homepage.
 *
 * Design:
 * - Full-width soft green background (#E7F3EE) to visually separate from
 *   the white product sections above
 * - 4 StepCard molecules in a 2-col (mobile) / 4-col (desktop) grid
 * - Connector lines between steps rendered inside StepCard (desktop only)
 */
export function HowItWorksSection() {
  return (
    <section
      className="w-full bg-[var(--color-primary-soft)] py-12 md:py-16"
      aria-label="Cara Sewa di ANNAPURNA"
    >
      <div className="container-page">
        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--color-foreground)]">
            Cara Sewa di ANNAPURNA
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)] max-w-md mx-auto">
            Proses sewa mudah, transparan, dan bisa dilakukan dari mana saja
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {STEPS.map((step) => (
            <StepCard
              key={step.step}
              step={step.step}
              icon={step.icon}
              title={step.title}
              description={step.description}
              isLast={"isLast" in step ? step.isLast : false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
