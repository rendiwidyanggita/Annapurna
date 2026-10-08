import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Route handler untuk callback OAuth (Google Login) dan email verification.
 * Supabase akan redirect ke URL ini setelah user mengkonfirmasi email
 * atau setelah Google OAuth flow selesai.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  // Parameter "error" bisa ada jika user menolak OAuth atau email sudah expired
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const params = new URLSearchParams({
      error: errorDescription ?? error,
    });
    return NextResponse.redirect(`${origin}/login?${params.toString()}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Redirect ke halaman asal atau home setelah login berhasil
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Fallback: redirect ke login jika ada masalah
  return NextResponse.redirect(
    `${origin}/login?error=Terjadi kesalahan saat verifikasi. Coba lagi.`
  );
}
