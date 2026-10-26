import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { expireStaleBookings } from "@/lib/services/booking-expiry";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/expire-bookings
 *
 * Fallback cron job to expire unpaid bookings after 65 minutes.
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(request: NextRequest) {
  // 1. Authorization — verify CRON_SECRET bearer token
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return errorResponse(
      "Unauthorized — invalid or missing CRON_SECRET",
      "UNAUTHORIZED",
      401
    );
  }

  const startTime = Date.now();
  const summary = await expireStaleBookings(65, "CRON");

  return successResponse(
    {
      ...summary,
      durationMs: Date.now() - startTime,
      processedAt: new Date().toISOString(),
    },
    `${summary.expiredCount} transaksi berhasil dikadaluwarsa.`
  );
}
