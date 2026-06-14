import crypto from "crypto";

import { buildContactRateLimitKey } from "@/lib/auth/resolve-user-by-email";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import type { VerificationMethod } from "@/lib/auth/verification/types";

export type RateLimitCheckResult = { ok: true } | { ok: false; retryAfterSec: number };

/**
 * Лимит по контакту: sha256(method + contact + pepper), 3 req/min.
 * Vercel: только Redis/KV — in-memory Map не шарится между инстансами.
 */
export async function checkRateLimit(
  method: VerificationMethod,
  contact: string,
): Promise<RateLimitCheckResult> {
  const contactKey = buildContactRateLimitKey(method, contact);
  return consumeAuthRateLimit(
    contactKey,
    RL.authSendCodeContact.limit,
    RL.authSendCodeContact.windowMs,
  );
}

export async function checkIpRateLimit(request: Request): Promise<RateLimitCheckResult> {
  const ipKey = rateLimitKeyFromRequest(request, "auth-send-code");
  return consumeAuthRateLimit(ipKey, RL.authSendCode.limit, RL.authSendCode.windowMs);
}

/** Комбинированная проверка IP + method+contact hash. */
export async function rejectIfVerificationRateLimited(
  request: Request,
  method: VerificationMethod,
  contact: string,
): Promise<Response | null> {
  const ipRl = await checkIpRateLimit(request);
  if (!ipRl.ok) {
    return new Response(
      JSON.stringify({
        error: "Слишком много запросов. Подождите минуту.",
        retryAfterSec: ipRl.retryAfterSec,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(ipRl.retryAfterSec),
        },
      },
    );
  }

  const contactRl = await checkRateLimit(method, contact);
  if (!contactRl.ok) {
    return new Response(
      JSON.stringify({
        error: `Слишком много кодов на этот контакт. Повторите через ${contactRl.retryAfterSec} сек.`,
        retryAfterSec: contactRl.retryAfterSec,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(contactRl.retryAfterSec),
        },
      },
    );
  }

  return null;
}

/** Хеш для логов/метрик без PII. */
export function contactFingerprint(method: string, contact: string): string {
  return crypto
    .createHash("sha256")
    .update(`${method}:${contact.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 12);
}
