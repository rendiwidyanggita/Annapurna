import type { NextRequest } from "next/server";

/**
 * AA-119: CSRF Protection — Origin/Referer Check
 *
 * Lapisan kedua perlindungan CSRF di atas SameSite=Lax cookie Supabase.
 * Memverifikasi header Origin atau Referer terhadap domain aplikasi
 * untuk semua request mutating (POST/PATCH/PUT/DELETE).
 *
 * Ref: PRD Section 30.1, Spike [OQ-19]
 */

/**
 * Daftar HTTP method yang dianggap mutating dan wajib dicek.
 */
const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/**
 * Path prefix yang dikecualikan dari CSRF check meskipun mutating.
 * - /auth/callback  : OAuth redirect dari Supabase/Google (tidak ada Origin app)
 * - /api/payments/midtrans/webhook : Webhook dari server Midtrans (bukan dari browser)
 */
const CSRF_EXEMPT_PREFIXES = [
  "/auth/callback",
  "/api/payments/midtrans/webhook",
];

/**
 * Normalise URL menjadi origin (scheme + host) tanpa trailing slash.
 * Return null jika URL tidak valid.
 */
function extractOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

/**
 * Validasi bahwa request berasal dari origin yang sama dengan aplikasi.
 *
 * @returns `true`  jika lolos CSRF check (aman dilanjutkan)
 * @returns `false` jika gagal (harus ditolak dengan 403)
 */
export function validateCsrf(request: NextRequest): boolean {
  const method = request.method.toUpperCase();

  // Hanya cek method mutating
  if (!MUTATING_METHODS.has(method)) return true;

  const pathname = request.nextUrl.pathname;

  // Skip path yang dikecualikan
  if (CSRF_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[CSRF] NEXT_PUBLIC_APP_URL WAJIB di-set di production. Request diblokir."
      );
      return false; // FAIL CLOSED — blokir request di production
    }
    // Development: izinkan tapi tetap warn
    console.warn(
      "[CSRF] NEXT_PUBLIC_APP_URL tidak di-set, CSRF check dilewati (development only)."
    );
    return true;
  }

  const appOrigin = extractOrigin(appUrl);
  if (!appOrigin) {
    console.warn("[CSRF] NEXT_PUBLIC_APP_URL tidak valid, CSRF check dilewati.");
    return true;
  }

  // Cek header Origin terlebih dahulu (lebih reliable)
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    const requestOrigin = extractOrigin(originHeader);
    return requestOrigin === appOrigin;
  }

  // Fallback ke Referer jika Origin tidak ada
  const refererHeader = request.headers.get("referer");
  if (refererHeader) {
    const refererOrigin = extractOrigin(refererHeader);
    return refererOrigin === appOrigin;
  }

  // Tidak ada Origin maupun Referer — tolak untuk keamanan
  // Exception: Server Actions Next.js selalu mengirim Origin, jadi ini aman
  return false;
}
