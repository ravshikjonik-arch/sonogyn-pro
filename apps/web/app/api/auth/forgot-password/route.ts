import { NextResponse } from "next/server";

import { resolveAuthUserIdByEmail } from "@/lib/auth/resolve-user-by-email";
import { PASSWORD_RESET_GENERIC_MSG } from "@/lib/auth/safe-auth-messages";
import { runVerificationFallbackChain } from "@/lib/auth/verification/fallback-handler";
import { parseEmailContact } from "@/lib/auth/verification/validate-contact";
import { ForgotPasswordBodySchema, parseJsonBody, zodErrorResponse } from "@/lib/security/api-body-schemas";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { clientIpFromRequest, rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { writeSecurityAuditLog } from "@/lib/security/security-audit-log";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Сброс пароля: 6-значный код через наш SMTP (Mail.ru), как при регистрации.
 * Не полагаемся на Supabase Auth email templates — они часто не доходят.
 * Ответ всегда generic (без enumeration).
 */
export async function POST(request: Request) {
  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(request, "auth-forgot-password"),
    RL.authSignUp.limit,
    RL.authSignUp.windowMs,
  );
  if (!rl.ok) {
    await writeSecurityAuditLog({
      category: "auth",
      action: "forgot-password.rate_limited",
      success: false,
      metadata: { retryAfterSec: rl.retryAfterSec },
    });
    return NextResponse.json(
      { ok: true, message: PASSWORD_RESET_GENERIC_MSG },
      { status: 200, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const raw = await parseJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = ForgotPasswordBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const email = parseEmailContact(parsed.data.email);
  if (!email) {
    return NextResponse.json({ error: "Некорректный email." }, { status: 400 });
  }

  const userId = await resolveAuthUserIdByEmail(email);
  let delivered = false;

  if (userId) {
    const idempotencyKey = request.headers.get("Idempotency-Key");
    const result = await runVerificationFallbackChain({
      primaryMethod: "email",
      contact: email,
      purpose: "password_reset",
      idempotencyKey,
      clientIp: clientIpFromRequest(request),
    });
    delivered = Boolean(result.ok);
    if (!result.ok) {
      console.error("[auth/forgot-password] smtp_send_failed", result.errorCode ?? result.message);
    }
  }

  await writeSecurityAuditLog({
    category: "auth",
    action: "forgot-password.requested",
    success: true,
    metadata: { hasAccount: Boolean(userId), delivered },
  });

  return NextResponse.json({ ok: true, message: PASSWORD_RESET_GENERIC_MSG });
}
