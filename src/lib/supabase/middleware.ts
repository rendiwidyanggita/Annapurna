import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { validateCsrf } from "@/lib/csrf";

/**
 * Merefresh session Auth user dan meneruskannya ke Server Components & browser.
 *
 * PENTING: Jangan letakkan kode apapun antara createServerClient dan getClaims().
 * Di Next.js 16, file ini dipanggil sebagai proxy.ts (bukan middleware.ts).
 *
 * Route Protection Strategy (Supabase docs / context7):
 * - BUKAN whitelist (mendaftarkan semua public route) — tidak scalable dan bug-prone
 * - MELAINKAN blocklist (hanya protect route yang benar-benar butuh auth)
 * - Default: semua route PUBLIK → katalog, paket, S&K, detail produk bisa diakses tanpa login
 * - Login dipaksa hanya untuk: cart, checkout, pesanan, profil, complete-profile, admin
 */
export async function updateSession(request: NextRequest) {
  // ============================================================
  // AA-119: CSRF Protection — Origin/Referer Check
  // Validasi dilakukan sebelum session refresh untuk efisiensi.
  // ============================================================
  if (!validateCsrf(request)) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Request origin tidak dikenali. Akses ditolak.",
        },
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

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
  // Route Protection Logic — BLOCKLIST pattern (bukan whitelist)
  //
  // Semua route PUBLIK secara default.
  // Hanya route di bawah ini yang membutuhkan autentikasi:
  // ============================================================
  const protectedPrefixes = [
    "/cart",
    "/checkout",
    "/pesanan",
    "/profil",
    "/complete-profile",
    "/admin",
  ];

  const isProtectedRoute = protectedPrefixes.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(prefix + "/")
  );

  // Redirect ke login jika belum login & mengakses protected route
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Simpan intended destination untuk redirect balik setelah login
    url.searchParams.set("redirect", pathname);
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

  // Admin route role check: Removed from middleware
  // ===================================================================
  // PENTING: Role check dilakukan sepenuhnya di (admin)/layout.tsx via DB query.
  // 
  // Mengapa tidak di middleware?
  // - getClaims() mengembalikan Supabase JWT standard claims saja
  // - Role custom dari database TIDAK tersimpan otomatis di JWT claims
  // - Checking role di middleware via getClaims() selalu gagal (undefined !== "admin")
  // - Ini menyebabkan semua admin user ter-redirect ke / — BUG yang sulit dilacak
  //
  // Solusi: Serahkan sepenuhnya ke (admin)/layout.tsx yang sudah melakukan:
  // 1. Query getCurrentUserProfile() → fetch user + role dari DB via Prisma
  // 2. Check role.name === "ADMIN" || role.name === "OWNER"
  // 3. Double-guard: authoritative, terpercaya, dan queryable via DB
  //
  // Middleware hanya memastikan user sudah terautentikasi (sudah handled di atas).

  // PENTING: Harus return supabaseResponse apa adanya.
  return supabaseResponse;
}
