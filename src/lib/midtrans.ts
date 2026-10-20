import midtransClient from "midtrans-client";

/**
 * Midtrans Snap client singleton.
 * Used for generating Snap payment tokens (DP 50% flow).
 *
 * Configuration via environment variables:
 * - MIDTRANS_IS_PRODUCTION: "true" | "false"
 * - MIDTRANS_SERVER_KEY: Server key from Midtrans dashboard
 * - NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: Client key from Midtrans dashboard
 *
 * References:
 * - https://docs.midtrans.com/reference/snap-snap-integration-guide
 */

if (!process.env.MIDTRANS_SERVER_KEY) {
  throw new Error("MIDTRANS_SERVER_KEY environment variable is not set.");
}

if (!process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) {
  throw new Error("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY environment variable is not set.");
}

export const snapClient = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

/**
 * Midtrans Core API client singleton.
 * Used for server-to-server operations:
 * - Checking transaction status
 * - Expiring a transaction manually
 */
export const coreClient = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

/**
 * Derive the correct Midtrans base URL based on environment.
 * Useful for logging or manual API calls.
 */
export const midtransBaseUrl =
  process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
