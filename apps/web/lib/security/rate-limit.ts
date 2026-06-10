/**
 * Rate limiting: Upstash Redis in production multi-instance; in-memory fallback for local dev.
 */

import { isProductionRateLimitReady } from "./production-secrets";
import { getUpstashRestCredentials } from "./upstash-env";

type Bucket = { count: number; resetAt: number };

const memoryStore = new Map<string, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

function consumeMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let bucket = memoryStore.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    memoryStore.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count <= limit) return { ok: true };
  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return { ok: false, retryAfterSec };
}

type UpstashLimiter = {
  limit: (key: string) => Promise<{ success: boolean; reset: number }>;
};

let upstashLimiter: UpstashLimiter | null | undefined;

function getUpstashLimiter(windowMs: number, limit: number): UpstashLimiter | null {
  if (upstashLimiter !== undefined) return upstashLimiter;

  const creds = getUpstashRestCredentials();
  if (!creds) {
    upstashLimiter = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Ratelimit } = require("@upstash/ratelimit") as typeof import("@upstash/ratelimit");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");

    const redis = new Redis({ url: creds.url, token: creds.token });
    const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
    upstashLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: "sonogyn-rl",
    });
    return upstashLimiter;
  } catch {
    upstashLimiter = null;
    return null;
  }
}

/**
 * @param key — Stable identifier (user id, IP hash, or composite route key).
 * @param limit — Max hits allowed within the window.
 * @param windowMs — Window duration in milliseconds.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!isProductionRateLimitReady()) {
    return { ok: false, retryAfterSec: 120 };
  }

  const upstash = getUpstashLimiter(windowMs, limit);
  if (!upstash) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, retryAfterSec: 120 };
    }
    return consumeMemoryRateLimit(key, limit, windowMs);
  }

  try {
    const result = await upstash.limit(key);
    if (result.success) return { ok: true };
    const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  } catch {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, retryAfterSec: 60 };
    }
    return consumeMemoryRateLimit(key, limit, windowMs);
  }
}
