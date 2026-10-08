import Image from "next/image";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Panel Kiri — Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0b3e2f]">
        <Image
          src="/images/login-register.png"
          alt="ANNAPURNA Adventure — Penyewaan Alat Outdoor"
          fill
          priority
          className="object-cover opacity-70"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b3e2f]/90 via-[#0b3e2f]/40 to-transparent" />

        {/* Branding di atas foto */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <Image
            src="/images/favicon.png"
            alt="Logo ANNAPURNA"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-white font-bold text-lg tracking-tight">
            ANNAPURNA Adventure
          </span>
        </div>

        {/* Tagline di bawah foto */}
        <div className="absolute bottom-10 left-8 right-8">
          <h2 className="text-white text-3xl font-bold leading-snug mb-2">
            Lengkapi Petualanganmu
          </h2>
          <p className="text-white/70 text-base">
            Sewa alat outdoor berkualitas untuk pendakian, camping, dan petualangan alam bebas.
          </p>
        </div>
      </div>

      {/* Panel Kanan — Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-12 bg-[#f9fafb]">
        {/* Logo untuk mobile (tersembunyi di lg) */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <Image
            src="/images/favicon.png"
            alt="Logo ANNAPURNA"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-bold text-[#111827] text-base">
            ANNAPURNA Adventure
          </span>
        </div>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
