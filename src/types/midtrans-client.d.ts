/**
 * Type declarations for midtrans-client@1.4.2
 * The package does not ship with TypeScript types, so we declare them manually
 * based on the official Midtrans Snap & Core API documentation.
 *
 * https://docs.midtrans.com/reference/snap-snap-integration-guide
 */

declare module "midtrans-client" {
  // ─────────────────────────────────────────────────────────────────────────
  // Shared Config
  // ─────────────────────────────────────────────────────────────────────────

  interface MidtransConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Snap API
  // ─────────────────────────────────────────────────────────────────────────

  interface TransactionDetails {
    order_id: string;
    /** Amount in smallest currency unit (IDR = Rupiah, no decimal) */
    gross_amount: number;
  }

  interface CustomerDetails {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    billing_address?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      country_code?: string;
    };
  }

  interface ItemDetail {
    id: string;
    name: string;
    price: number;
    quantity: number;
    brand?: string;
    category?: string;
    merchant_name?: string;
  }

  interface CustomExpiry {
    /** Format: "YYYY-MM-DD HH:mm:ss +TZ" */
    order_time?: string;
    expiry_duration: number;
    unit: "second" | "minute" | "hour" | "day";
  }

  interface SnapTransactionPayload {
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
    item_details?: ItemDetail[];
    custom_expiry?: CustomExpiry;
    callbacks?: {
      finish?: string;
      error?: string;
      pending?: string;
    };
    credit_card?: Record<string, unknown>;
    enabled_payments?: string[];
  }

  interface SnapTransactionResponse {
    /** Used for window.snap.pay(token) */
    token: string;
    /** Fallback URL if Snap JS is unavailable */
    redirect_url: string;
  }

  class Snap {
    constructor(config: MidtransConfig);
    createTransaction(
      payload: SnapTransactionPayload,
    ): Promise<SnapTransactionResponse>;
    createTransactionToken(
      payload: SnapTransactionPayload,
    ): Promise<string>;
    createTransactionRedirectUrl(
      payload: SnapTransactionPayload,
    ): Promise<string>;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Core API
  // ─────────────────────────────────────────────────────────────────────────

  interface CoreApiChargePayload {
    payment_type: string;
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
    item_details?: ItemDetail[];
    [key: string]: unknown;
  }

  interface CoreApiTransactionResponse {
    status_code: string;
    status_message: string;
    order_id: string;
    transaction_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status?: string;
    [key: string]: unknown;
  }

  class CoreApi {
    constructor(config: MidtransConfig);
    charge(payload: CoreApiChargePayload): Promise<CoreApiTransactionResponse>;
    capture(
      orderId: string,
      payload?: Record<string, unknown>,
    ): Promise<CoreApiTransactionResponse>;
    cancel(orderId: string): Promise<CoreApiTransactionResponse>;
    expire(orderId: string): Promise<CoreApiTransactionResponse>;
    refund(
      orderId: string,
      payload?: Record<string, unknown>,
    ): Promise<CoreApiTransactionResponse>;
    transaction: {
      status(orderId: string): Promise<CoreApiTransactionResponse>;
      statusb2b(orderId: string): Promise<CoreApiTransactionResponse>;
      approve(orderId: string): Promise<CoreApiTransactionResponse>;
      deny(orderId: string): Promise<CoreApiTransactionResponse>;
      cancel(orderId: string): Promise<CoreApiTransactionResponse>;
      expire(orderId: string): Promise<CoreApiTransactionResponse>;
      refund(
        orderId: string,
        payload?: Record<string, unknown>,
      ): Promise<CoreApiTransactionResponse>;
    };
  }

  // Default export
  const midtransClient: {
    Snap: typeof Snap;
    CoreApi: typeof CoreApi;
  };
  export = midtransClient;
  export { Snap, CoreApi };
}
