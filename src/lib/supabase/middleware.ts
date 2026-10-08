import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Merefresh session Auth user dan meneruskannya ke Server Components & browser.
 * PENTING: Jangan letakkan kode apapun antara createServerClient dan getClaims().
 * Di Next.js 16, file ini dipanggil sebagai proxy.ts (bukan middleware.ts).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // PENTING: Jika getClaims() dihapus dan SSR digunakan,
  // user bisa random logout. Jangan pindahkan baris ini.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const pathname = request.nextUrl.pathname;

  // ============================================================
  // Route Protection Logic
  // ============================================================

  // Daftar route publik yang tidak memerlukan autentikasi
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
  ];

  const isPublicRoute =
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith("/auth/");

  // Redirect ke login jika belum login & bukan route publik
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect ke home jika sudah login tapi mengakses halaman auth
  if (
    user &&
    (pathname === "/login" || pathname === "/register")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // PENTING: Harus return supabaseResponse apa adanya.
  return supabaseResponse;
}
