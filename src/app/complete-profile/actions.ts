"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { completeProfileSchema } from "@/schemas/profile";

export type CompleteProfileActionState = {
  error?: string;
  success?: string;
};

export async function completeProfile(
  _prevState: CompleteProfileActionState,
  formData: FormData
): Promise<CompleteProfileActionState> {
  const raw = {
    fullName: formData.get("fullName") as string,
    phoneNumber: formData.get("phoneNumber") as string,
    address: formData.get("address") as string,
  };

  // 1. Validasi input menggunakan Zod
  const validated = completeProfileSchema.safeParse(raw);
  if (!validated.success) {
    return { error: validated.error.errors[0]?.message ?? "Data tidak valid" };
  }

  // 2. Ambil sesi Supabase saat ini
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "Sesi telah berakhir. Silakan login kembali." };
  }

  try {
    // 3. Pastikan user ada di tabel users Prisma
    let dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (!dbUser) {
      const customerRole = await prisma.role.findFirst({
        where: { name: "CUSTOMER" },
      });

      if (!customerRole) {
        return { error: "Konfigurasi role sistem belum siap." };
      }

      dbUser = await prisma.user.create({
        data: {
          id: authUser.id,
          email: authUser.email!,
          roleId: customerRole.id,
          authProvider: authUser.app_metadata.provider ?? "email",
        },
      });
    }

    // 4. Update profil dan set isProfileComplete: true
    await prisma.profile.upsert({
      where: { userId: dbUser.id },
      update: {
        fullName: validated.data.fullName.trim(),
        phoneNumber: validated.data.phoneNumber.trim(),
        address: validated.data.address.trim(),
        isProfileComplete: true,
      },
      create: {
        userId: dbUser.id,
        fullName: validated.data.fullName.trim(),
        phoneNumber: validated.data.phoneNumber.trim(),
        address: validated.data.address.trim(),
        isProfileComplete: true,
      },
    });

    // 5. Update metadata Supabase Auth agar sinksron
    await supabase.auth.updateUser({
      data: {
        full_name: validated.data.fullName.trim(),
        phone_number: validated.data.phoneNumber.trim(),
      },
    });
  } catch (error) {
    console.error("Gagal menyimpan profil:", error);
    return { error: "Terjadi kesalahan saat menyimpan data. Coba lagi nanti." };
  }

  // 6. Revalidate cache dan redirect ke beranda
  revalidatePath("/", "layout");
  redirect("/");
}
