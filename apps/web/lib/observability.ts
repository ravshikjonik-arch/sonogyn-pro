/**
 * Structured verification logs for Vercel Log Drain / observability.
 * Без PII: не передаём email, phone, code.
 */

export type VerificationLogType = "send" | "verify" | "fallback" | "rate_limit";

export type VerificationLogMethod = "email" | "sms" | "telegram" | "unknown";

export function logVerificationEvent(
  type: VerificationLogType,
  method: VerificationLogMethod,
  success: boolean,
  latencyMs: number,
  extra?: Record<string, string | number | boolean | undefined>,
): void {
  const payload = {
    ts: new Date().toISOString(),
    service: "sonogyn-auth",
    event: "verification",
    type,
    method,
    success,
    latencyMs: Math.round(latencyMs),
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    ...Object.fromEntries(
      Object.entries(extra ?? {}).filter(([, value]) => value !== undefined),
    ),
  };

  // Production: JSON для Log Drain. Dev: читаемый формат.
  if (process.env.NODE_ENV === "production") {
    console.info(JSON.stringify(payload));
  } else {
    console.info("[observability:verification]", payload);
  }
}
