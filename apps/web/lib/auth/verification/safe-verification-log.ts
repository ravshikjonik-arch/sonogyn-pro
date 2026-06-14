/** Логирование верификации без PII/PHI и без кода в plain text. */

const ALLOWED_KEYS = new Set([
  "purpose",
  "method",
  "deliveredVia",
  "fallbackUsed",
  "errorCode",
  "attempt",
  "timeoutMs",
  "durationMs",
]);

export function logVerificationEvent(
  event: string,
  context?: Record<string, string | number | boolean | undefined>,
): void {
  const safe: Record<string, string | number | boolean> = { event };
  if (context) {
    for (const [k, v] of Object.entries(context)) {
      if (!ALLOWED_KEYS.has(k) || v === undefined) continue;
      safe[k] = v;
    }
  }
  // Production: отправляйте в Vercel Log Drain / Sentry — без contact/email/phone/code.
  console.info("[auth:verification]", JSON.stringify(safe));
}

export function logVerificationError(event: string, errorCode: string, method?: string): void {
  logVerificationEvent(event, { errorCode, method });
}
