/**
 * Счётчик неудачных попыток входа (per IP). Upstash Redis в production; in-memory fallback.
 */

import { consumeRateLimit } from "@/lib/security/rate-limit";

export const CAPTCHA_FAILURE_THRESHOLD = 3;
const WINDOW_MS = 60 * 60_000;
const MAX_FAILURES = 20;

type MemoryBucket = { count: number; resetAt: number };
const failures = new Map<string, MemoryBucket>();

function memoryRecord(key: string): number {
  const now = Date.now();
  let bucket = failures.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    failures.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count;
}

function memoryCount(key: string): number {
  const now = Date.now();
  const bucket = failures.get(key);
  if (!bucket || now >= bucket.resetAt) return 0;
  return bucket.count;
}

function memoryClear(key: string): void {
  failures.delete(key);
}

/** Upstash sliding window: each failure consumes 1 hit; count derived from remaining budget. */
async function upstashFailureCount(key: string): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
    const redis = new Redis({ url, token });
    const raw = await redis.get<number>(`sonogyn:auth-fail:${key}`);
    return typeof raw === "number" ? raw : 0;
  } catch {
    return null;
  }
}

async function upstashRecord(key: string): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
    const redis = new Redis({ url, token });
    const redisKey = `sonogyn:auth-fail:${key}`;
    const next = await redis.incr(redisKey);
    if (next === 1) {
      await redis.expire(redisKey, Math.ceil(WINDOW_MS / 1000));
    }
    return next;
  } catch {
    return null;
  }
}

async function upstashClear(key: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
    const redis = new Redis({ url, token });
    await redis.del(`sonogyn:auth-fail:${key}`);
  } catch {
    /* ignore */
  }
}

export async function recordAuthFailure(key: string): Promise<number> {
  const rl = await consumeRateLimit(`auth-fail-hard:${key}`, MAX_FAILURES, WINDOW_MS);
  if (!rl.ok) return MAX_FAILURES;

  const upstash = await upstashRecord(key);
  if (upstash !== null) return upstash;
  return memoryRecord(key);
}

export async function getAuthFailureCount(key: string): Promise<number> {
  const upstash = await upstashFailureCount(key);
  if (upstash !== null) return upstash;
  return memoryCount(key);
}

export async function clearAuthFailures(key: string): Promise<void> {
  await upstashClear(key);
  memoryClear(key);
}

export async function isCaptchaRequired(key: string): Promise<boolean> {
  const count = await getAuthFailureCount(key);
  return count >= CAPTCHA_FAILURE_THRESHOLD;
}
