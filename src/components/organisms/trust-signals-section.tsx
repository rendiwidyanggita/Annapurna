import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldCheckIcon,
  Tag01Icon,
  CreditCardIcon,
  MountainIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface TrustSignal {
  title: string;
  description: string;
  icon: typeof ShieldCheckIcon;
}

const TRUST_SIGNALS: readonly TrustSignal[] = [
  {
    title: "Peralatan Bersih & Terawat",
    description:
      "Peralatan dicuci, disterilkan, dan dicek kelengkapannya sebelum diserahkan ke tangan pendaki.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Tarif Fleksibel & Transparan",
    description:
      "Pilihan skema sewa permalam atau perkegiatan tanpa biaya tersembunyi, pas untuk kantong petualang.",
    icon: Tag01Icon,
  },
  {
    title: "Booking Cepat, DP 50%",
    description:
      "Cukup bayar DP 50% via transfer bank atau QRIS, pelunasan sisa dapat dilakukan saat ambil di toko.",
    icon: CreditCardIcon,
  },
  {
    title: "Basecamp Akses Gunung",
    description:
      "Berlokasi strategis di Purwokerto sebagai titik start pendakian Gunung Slamet, Prau, & Sindoro-Sumbing.",
    icon: MountainIcon,
  },
];

export interface TrustSignalsSectionProps {
  className?: string;
}

export function TrustSignalsSection({ className }: TrustSignalsSectionProps) {
  return (
    <section
      aria-label="Keunggulan Layanan ANNAPURNA"
      className={cn("container-page pt-10 pb-8 md:pt-14 md:pb-12", className)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {TRUST_SIGNALS.map((signal, index) => {
          const Icon = signal.icon;
          return (
            <div
              key={index}
              className={cn(
                "rounded-2xl bg-white p-5 md:p-6",
                "border border-black/[0.04]",
                "shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_10px_25px_-3px_rgba(15,23,42,0.08)]",
                "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5",
                "flex flex-col gap-3.5"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={Icon} size={24} />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-semibold text-slate-900 tracking-tight text-balance mb-1.5">
                  {signal.title}
                </h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed text-pretty">
                  {signal.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
