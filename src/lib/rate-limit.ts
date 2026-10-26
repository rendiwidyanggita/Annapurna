import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * AA-118: Rate Limiting via Upstash Redis (serverless-managed, HTTP API)
 *
 * Menggunakan Sliding Window algorithm untuk fairness yang lebih baik
 * dibandingkan Fixed Window (menghindari burst di batas window).
 *
 * Ref: PRD Section 30.3, Spike [OQ-18]
 *
 * Limit awal (disesuaikan berdasarkan data produksi setelah MVP):
 * - auth endpoints  : 5 request / 60 detik per IP
 * - chatbot         : 10 request / 60 detik per IP
 * - checkout        : 5 request / 60 detik per IP
 * - payment create  : 5 request / 60 detik per IP
 */

// ============================================================
// Redis Client (singleton via HTTP — tidak perlu persistent connection)
// ============================================================

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Fail open di development jika env belum di-set
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[RateLimit] UPSTASH_REDIS_REST_URL / TOKEN tidak di-set. Rate limiting dinonaktifkan."
      );
      return null;
    }
    throw new Error(
      "[RateLimit] UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN wajib di-set di production."
    );
  }

  return new Redis({ url, token });
}

// ============================================================
// Rate Limiter Factory
// ============================================================

type RateLimiterKey = "auth" | "chatbot" | "checkout" | "payment" | "export";

const LIMITS: Record<RateLimiterKey, { requests: number; window: `${number} s` | `${number} m` }> = {
  auth: { requests: 5, window: "1 m" },
  chatbot: { requests: 10, window: "1 m" },
  checkout: { requests: 5, window: "1 m" },
  payment: { requests: 5, window: "1 m" },
  export: { requests: 5, window: "1 m" },
};

let limiters: Partial<Record<RateLimiterKey, Ratelimit>> | null = null;

function getLimiters(): Partial<Record<RateLimiterKey, Ratelimit>> | null {
  const redis = getRedisClient();
  if (!redis) return null;

  if (!limiters) {
    limiters = {} as Record<RateLimiterKey, Ratelimit>;
    for (const [key, cfg] of Object.entries(LIMITS) as [RateLimiterKey, typeof LIMITS[RateLimiterKey]][]) {
      limiters[key] = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(cfg.requests, cfg.window),
        analytics: false,
        prefix: `annapurna:rl:${key}`,
      });
    }
  }

  return limiters;
}

// ============================================================
// Public API
// ============================================================

export interface RateLimitResult {
  /** true = request diizinkan, false = limit tercapai */
  allowed: boolean;
  /** Sisa request yang diizinkan dalam window saat ini */
  remaining: number;
  /** Timestamp (ms) kapan window reset */
  resetAt: number;
}

/**
 * Cek rate limit untuk identifier tertentu (biasanya IP address).
 *
 * @param identifier - IP address atau user ID
 * @param limiterKey - Kategori endpoint ("auth" | "chatbot" | "checkout" | "payment")
 * @returns RateLimitResult
 */
export async function checkRateLimit(
  identifier: string,
  limiterKey: RateLimiterKey
): Promise<RateLimitResult> {
  const allLimiters = getLimiters();

  // Jika Redis tidak tersedia (dev tanpa env), izinkan semua request
  if (!allLimiters) {
    return { allowed: true, remaining: 999, resetAt: 0 };
  }

  const limiter = allLimiters[limiterKey];
  if (!limiter) {
    return { allowed: true, remaining: 999, resetAt: 0 };
  }

  const { success, remaining, reset } = await limiter.limit(identifier);

  return {
    allowed: success,
    remaining,
    resetAt: reset,
  };
}

/**
 * Ambil IP address dari request headers.
 * Urutan prioritas: x-forwarded-for → x-real-ip → fallback "anonymous"
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for bisa berisi multiple IPs: "client, proxy1, proxy2"
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "anonymous";
}
