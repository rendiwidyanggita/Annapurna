import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User, Role, Profile } from "@prisma/client";

export type ProfileCheckResult = {
  isAuthenticated: boolean;
  user: (User & { role?: Role | null }) | null;
  profile: Profile | null;
  isProfileComplete: boolean;
};

/**
 * Mengambil session user saat ini dan memvalidasi kelengkapan profil dari database.
 * Jika user sudah terdaftar di Supabase Auth tapi belum ada di tabel users Prisma,
 * fungsi ini akan otomatis menginisialisasi record user & profile (Role: CUSTOMER).
 */
export async function getCurrentUserProfile(): Promise<ProfileCheckResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser || !authUser.email) {
      return {
        isAuthenticated: false,
        user: null,
        profile: null,
        isProfileComplete: false,
      };
    }

    // Ambil user dan profile dari database
    let dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        role: true,
        profile: true,
      },
    });

    // Jika belum ada di tabel users (misal baru sign up / login OAuth pertama kali),
    // buatkan record User dan Profile default
    if (!dbUser) {
      const customerRole = await prisma.role.findFirst({
        where: { name: "CUSTOMER" },
      });

      if (!customerRole) {
        throw new Error("Role CUSTOMER belum ada di database.");
      }

      dbUser = await prisma.user.create({
        data: {
          id: authUser.id,
          email: authUser.email,
          roleId: customerRole.id,
          authProvider: authUser.app_metadata.provider ?? "email",
          profile: {
            create: {
              fullName: (authUser.user_metadata?.full_name as string) ?? null,
              isProfileComplete: false,
            },
          },
        },
        include: {
          role: true,
          profile: true,
        },
      });
    }

    // Jika user ada tapi tabel profile belum ada
    if (!dbUser.profile) {
      const createdProfile = await prisma.profile.create({
        data: {
          userId: dbUser.id,
          fullName: (authUser.user_metadata?.full_name as string) ?? null,
          isProfileComplete: false,
        },
      });
      dbUser.profile = createdProfile;
    }

    return {
      isAuthenticated: true,
      user: dbUser,
      profile: dbUser.profile,
      isProfileComplete: Boolean(dbUser.profile.isProfileComplete),
    };
  } catch (error) {
    console.error("Gagal memeriksa profil user:", error);
    return {
      isAuthenticated: false,
      user: null,
      profile: null,
      isProfileComplete: false,
    };
  }
}
