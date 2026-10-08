import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 Proxy (setara middleware.ts di Next.js 15 ke bawah).
 * Bertanggung jawab merefresh Supabase Auth token di setiap request.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match semua path kecuali:
     * - _next/static (file statis)
     * - _next/image (image optimization)
     * - favicon.ico, file gambar (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
