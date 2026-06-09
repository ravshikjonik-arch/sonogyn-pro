/**
 * Счётчик неудачных попыток входа (per IP). In-memory; в production дополняется Upstash через rate-limit store.
 */

type Bucket = { count: number; resetAt: number };

const failures = new Map<string, Bucket>();
const WINDOW_MS = 60 * 60_000;

export const CAPTCHA_FAILURE_THRESHOLD = 3;

export function recordAuthFailure(key: string): number {
  const now = Date.now();
  let bucket = failures.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    failures.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count;
}

export function getAuthFailureCount(key: string): number {
  const now = Date.now();
  const bucket = failures.get(key);
  if (!bucket || now >= bucket.resetAt) return 0;
  return bucket.count;
}

export function clearAuthFailures(key: string): void {
  failures.delete(key);
}

export function isCaptchaRequired(key: string): boolean {
  return getAuthFailureCount(key) >= CAPTCHA_FAILURE_THRESHOLD;
}
