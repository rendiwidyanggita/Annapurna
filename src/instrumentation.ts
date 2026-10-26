/**
 * Next.js Server Lifecycle Instrumentation Hook
 * Executes once during Node.js server startup.
 *
 * Runs startup sweep for stale bookings in development environment,
 * ensuring no transactions remain stuck in "Menunggu_Pembayaran_DP"
 * when developing locally without an active cron daemon.
 */
export async function register() {
  // Only run in Node.js server environment (not Edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      // Dynamic import required: prevents Node.js-only Prisma client from bundling into Edge runtime
      const { expireStaleBookings } = await import("@/lib/services/booking-expiry");
      const summary = await expireStaleBookings(65, "STARTUP_SWEEP");
      if (summary.expiredCount > 0) {
        console.info(
          `[startup-sweep] ✅ Cleared ${summary.expiredCount} stale bookings on server boot.`
        );
      }
    } catch (err) {
      console.warn("[startup-sweep] Startup sweep skipped or failed:", err);
    }
  }
}
