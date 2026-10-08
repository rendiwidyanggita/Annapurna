"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/schemas/auth";

export type ActionState = {
  error?: string;
  success?: string;
};

// ============================================================
// Register
// ============================================================
export async function register(formData: FormData): Promise<ActionState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = registerSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Email sudah terdaftar. Silakan login." };
    }
    return { error: "Terjadi kesalahan. Coba lagi nanti." };
  }

  return { success: "Link verifikasi telah dikirim ke email Anda. Silakan cek kotak masuk." };
}

// ============================================================
// Login
// ============================================================
export async function login(formData: FormData): Promise<ActionState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = loginSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return { error: "Email atau password salah." };
  }

  // Redirect berdasarkan role
  const role = data.user?.user_metadata?.role ?? "customer";
  if (role === "admin" || role === "owner") {
    redirect("/admin/dashboard");
  }

  redirect("/");
}

// ============================================================
// Google OAuth Login
// ============================================================
export async function signInWithGoogle(): Promise<ActionState | void> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: {
        // Mendorong pemilihan akun Google setiap kali (UX lebih jelas)
        prompt: "select_account",
      },
    },
  });

  if (error) {
    return { error: "Gagal menghubungkan ke Google. Coba lagi." };
  }

  redirect(data.url);
}

// ============================================================
// Logout
// ============================================================
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ============================================================
// Forgot Password
// ============================================================
export async function forgotPassword(formData: FormData): Promise<ActionState> {
  const raw = { email: formData.get("email") as string };

  const result = forgotPasswordSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const supabase = await createClient();

  // Selalu kembalikan pesan sukses generik untuk menghindari
  // user enumeration (tidak membocorkan apakah email terdaftar atau tidak).
  await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  return {
    success:
      "Jika email Anda terdaftar, link reset password akan segera dikirim. Silakan cek kotak masuk.",
  };
}

// ============================================================
// Reset Password
// ============================================================
export async function resetPassword(formData: FormData): Promise<ActionState> {
  const raw = {
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = resetPasswordSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    if (error.message.includes("expired") || error.message.includes("invalid")) {
      return { error: "Link reset password telah kedaluwarsa. Minta link baru." };
    }
    return { error: "Gagal mengubah password. Coba lagi." };
  }

  return { success: "Password berhasil diubah. Silakan login." };
}
