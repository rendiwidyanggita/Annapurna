import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CompleteProfileForm } from "./form";

export const metadata = {
  title: "Lengkapi Profil — ANNAPURNA Adventure",
  description: "Lengkapi data diri Anda untuk keperluan verifikasi reservasi penyewaan alat outdoor.",
};

export default async function CompleteProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // 1. Jika belum login, redirect ke login
  if (!authUser) {
    redirect("/login");
  }

  // 2. Ambil profil dari database
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: { profile: true },
  });

  // 3. Jika profil sudah lengkap, tidak perlu ada di halaman ini
  if (dbUser?.profile?.isProfileComplete) {
    redirect("/");
  }

  // Ambil data awal jika ada (misal dari Google OAuth)
  const defaultFullName =
    dbUser?.profile?.fullName ??
    (authUser.user_metadata?.full_name as string) ??
    "";
  const defaultPhone = dbUser?.profile?.phoneNumber ?? "";
  const defaultAddress = dbUser?.profile?.address ?? "";

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo Brand */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <Image
            src="/images/favicon.png"
            alt="Logo ANNAPURNA"
            width={40}
            height={40}
            className="rounded-xl shadow-sm"
          />
          <span className="font-bold text-xl text-[#111827] tracking-tight">
            ANNAPURNA Adventure
          </span>
        </div>

        {/* Heading Card */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e7f3ee] text-[#16624b] mb-3">
            Langkah Terakhir Pendaftaran
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            Lengkapi Profil Anda
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            Demi keamanan & keabsahan reservasi sewa alat outdoor, mohon isi data diri sesuai identitas resmi Anda.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200/80 rounded-2xl sm:px-10">
          <CompleteProfileForm
            email={authUser.email ?? ""}
            initialFullName={defaultFullName}
            initialPhone={defaultPhone}
            initialAddress={defaultAddress}
          />
        </div>

        <p className="mt-6 text-center text-xs text-[#9ca3af]">
          Data Anda disimpan dengan aman dan hanya digunakan untuk keperluan verifikasi sewa & penjaminan unit.
        </p>
      </div>
    </div>
  );
}
