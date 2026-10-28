import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ShoppingBag01Icon,
  Logout01Icon,
  Shield01Icon,
  Calendar03Icon,
  Mail01Icon,
  Call02Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { logout } from "@/app/(auth)/actions";
import { ROUTES } from "@/config/routes";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Profil Saya | Annapurna",
  description: "Kelola informasi profil, kontak WhatsApp, dan alamat penjaminan sewa alat outdoor Anda.",
};

export default async function ProfilePage() {
  const profileStatus = await getCurrentUserProfile();

  // Guard: Pengguna harus terautentikasi
  if (!profileStatus.isAuthenticated || !profileStatus.user) {
    redirect(ROUTES.LOGIN);
  }

  // Jika belum melengkapi profil awal, arahkan ke onboarding gate
  if (!profileStatus.isProfileComplete) {
    redirect("/complete-profile");
  }

  const { user, profile } = profileStatus;

  const displayName = profile?.fullName || user.email?.split("@")[0] || "Pelanggan";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const formattedJoinDate = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(user.createdAt));

  return (
    <div className="min-h-screen bg-neutral-50/60 pb-16 pt-6 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            <span>Kembali ke Beranda</span>
          </Link>

          <Link
            href={ROUTES.ORDERS}
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            <HugeiconsIcon icon={ShoppingBag01Icon} size={16} />
            <span>Riwayat Pesanan</span>
          </Link>
        </div>

        {/* Header Profile Hero Card */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex size-16 sm:size-20 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 border border-brand-200 text-xl sm:text-2xl font-bold shadow-xs dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900/60">
                {initials}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40">
                    <HugeiconsIcon icon={Shield01Icon} size={13} />
                    Profil Lengkap
                  </span>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <HugeiconsIcon icon={Mail01Icon} size={16} className="shrink-0 text-neutral-400" />
                  <span>{user.email}</span>
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                  <HugeiconsIcon icon={Calendar03Icon} size={14} className="shrink-0" />
                  <span>Bergabung sejak {formattedJoinDate}</span>
                </p>
              </div>
            </div>

            {/* Quick Action: Logout Button */}
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-700 shadow-xs transition-colors hover:bg-neutral-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 active:scale-[0.99] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/80 dark:hover:text-red-400"
              >
                <HugeiconsIcon icon={Logout01Icon} size={16} />
                <span>Keluar Akun</span>
              </button>
            </form>
          </div>

          {/* Highlights Info Bar */}
          <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
              <HugeiconsIcon icon={Call02Icon} size={20} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">WhatsApp Aktif</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {profile?.phoneNumber || "Belum diatur"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
              <HugeiconsIcon icon={Location01Icon} size={20} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Domisili Penjamin</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {profile?.address || "Belum diatur"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form Card */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
          <div className="mb-6 border-b border-neutral-100 pb-4 dark:border-neutral-800">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Ubah Data Diri
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Perbarui informasi identitas Anda untuk kelancaran proses sewa dan verifikasi jaminan.
            </p>
          </div>

          <ProfileForm
            user={{
              id: user.id,
              email: user.email,
              authProvider: user.authProvider,
              createdAt: user.createdAt.toISOString(),
            }}
            profile={{
              fullName: profile?.fullName ?? null,
              phoneNumber: profile?.phoneNumber ?? null,
              address: profile?.address ?? null,
            }}
          />
        </div>
      </div>
    </div>
  );
}
