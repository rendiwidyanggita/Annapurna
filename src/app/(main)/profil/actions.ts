"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { completeProfileSchema } from "@/schemas/profile";

export type ActionState = {
  success?: string;
  error?: string;
  fieldErrors?: {
    fullName?: string[];
    phoneNumber?: string[];
    address?: string[];
  };
};

/**
 * Server action untuk memperbarui profil customer.
 * Memvalidasi input nama, nomor WhatsApp, dan alamat penjaminan sewa,
 * lalu memperbarui data di Prisma dan menyelaraskan metadata Supabase Auth.
 */
export async function updateCustomerProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  // 1. Verifikasi sesi user aktif
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return {
      error: "Sesi telah berakhir atau tidak valid. Silakan login kembali.",
    };
  }

  // 2. Ekstraksi dan sanitasi input form
  const rawData = {
    fullName: (formData.get("fullName") as string)?.trim() || "",
    phoneNumber: (formData.get("phoneNumber") as string)?.trim() || "",
    address: (formData.get("address") as string)?.trim() || "",
  };

  // 3. Validasi skema
  const parsed = completeProfileSchema.safeParse(rawData);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    return {
      error: "Terdapat data yang tidak valid. Periksa kembali form di bawah.",
      fieldErrors: {
        fullName: flattened.fullName,
        phoneNumber: flattened.phoneNumber,
        address: flattened.address,
      },
    };
  }

  const { fullName, phoneNumber, address } = parsed.data;

  // 4. Update data profil di database Prisma
  try {
    await prisma.profile.upsert({
      where: { userId: authUser.id },
      update: {
        fullName,
        phoneNumber,
        address,
        isProfileComplete: true,
      },
      create: {
        userId: authUser.id,
        fullName,
        phoneNumber,
        address,
        isProfileComplete: true,
      },
    });

    // 5. Selaraskan user_metadata di Supabase Auth
    const { error: updateMetadataError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        phone_number: phoneNumber,
      },
    });

    if (updateMetadataError) {
      console.warn("Gagal memperbarui metadata auth Supabase:", updateMetadataError.message);
    }
  } catch (error) {
    console.error("Gagal memperbarui profil pengguna di database:", error);
    return {
      error: "Terjadi kesalahan internal saat menyimpan profil. Silakan coba lagi.",
    };
  }

  // 6. Invalidate cache agar UI (Navbar, Profil) langsung ter-update
  revalidatePath("/profil");
  revalidatePath("/", "layout");

  return {
    success: "Profil berhasil diperbarui.",
  };
}
