import Image from "next/image";
import Link from "next/link";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { logout } from "@/app/(auth)/actions";
import { LogOut, User as UserIcon, Shield, Sparkles } from "lucide-react";

export default async function Home() {
  const profileStatus = await getCurrentUserProfile();
  const { isAuthenticated, user, profile } = profileStatus;

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/favicon.png"
              alt="Logo ANNAPURNA"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="font-bold text-lg text-[#16624b] tracking-tight">
              ANNAPURNA Adventure
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#e7f3ee] rounded-full text-xs font-semibold text-[#16624b]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Role: {user?.role?.name ?? "CUSTOMER"}</span>
                </div>

                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-[#111827]">
                    {profile?.fullName || user?.email}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{user?.email}</span>
                </div>

                <form action={logout}>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-[#16624b] hover:text-[#0f4f3c] transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#16624b] hover:bg-[#0f4f3c] rounded-lg transition shadow-sm"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner / Status Session Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e7f3ee] text-[#16624b] text-xs font-semibold mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Sistem Informasi Penyewaan Alat Outdoor</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111827] tracking-tight max-w-2xl leading-tight">
          Lengkapi Petualanganmu Bersama <span className="text-[#16624b]">ANNAPURNA</span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-xl">
          Platform sewa tenda, carrier, dan perlengkapan camping berkualitas di Malang.
        </p>

        {/* Status Sesi Login Box */}
        <div className="mt-8 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm max-w-md w-full text-left">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#16624b]" />
            <span>Status Sesi Pengguna</span>
          </h2>

          {isAuthenticated ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Status</span>
                <span className="font-semibold text-emerald-600">Terautentikasi (Logged In)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Email</span>
                <span className="font-mono text-xs">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Role</span>
                <span className="font-bold text-[#16624b]">{user?.role?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Profil Lengkap</span>
                <span className="font-semibold text-emerald-600">
                  {profile?.isProfileComplete ? "Sudah Lengkap" : "Belum"}
                </span>
              </div>
              <div className="pt-3">
                <Link
                  href="/logout"
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout dari Sesi Ini (Ganti Akun)</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-gray-600 text-xs">
                Anda sedang menjelajah sebagai <strong>Tamu (Guest)</strong>. Silakan masuk untuk melakukan transaksi sewa.
              </p>
              <div className="flex gap-2 pt-1">
                <Link
                  href="/login"
                  className="flex-1 py-2 text-center text-xs font-semibold bg-[#16624b] text-white rounded-xl hover:bg-[#0f4f3c] transition"
                >
                  Masuk ke Akun
                </Link>
                <Link
                  href="/register"
                  className="flex-1 py-2 text-center text-xs font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                >
                  Daftar Baru
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
