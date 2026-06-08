/**
 * Token-bucket style fixed-window counter for lightweight edge-compatible rate limiting.
 * Replace with Upstash / Vercel KV in production multi-instance deployments.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/**
 * @param key — Stable identifier (user id, IP hash, or composite route key).
 * @param limit — Max hits allowed within the window.
 * @param windowMs — Sliding window duration in milliseconds.
 */
export function consumeRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let bucket = store.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count <= limit) return { ok: true };
  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return { ok: false, retryAfterSec };
}
