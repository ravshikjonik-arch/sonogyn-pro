import { NextResponse } from "next/server";

import { setUserPasswordAfterEmailProof } from "@/lib/auth/auto-confirm-email";
import { resolveAuthUserIdByEmail } from "@/lib/auth/resolve-user-by-email";
import { OTP_INVALID_MSG } from "@/lib/auth/safe-auth-messages";
import { verifyStoredCode } from "@/lib/auth/verification/code-store";
import { parseEmailContact } from "@/lib/auth/verification/validate-contact";
import {
  ConfirmPasswordResetBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { writeSecurityAuditLog } from "@/lib/security/security-audit-log";

export const runtime = "nodejs";

/**
 * Сброс пароля по 6-значному коду из письма (наш SMTP Mail.ru),
 * без зависимости от Supabase Auth email templates.
 */
export async function POST(req: Request) {
  const raw = await parseJsonBody(req);
  if (!raw.ok) return raw.response;

  const parsed = ConfirmPasswordResetBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const email = parseEmailContact(parsed.data.email);
  if (!email) {
    return NextResponse.json({ error: "Некорректный email." }, { status: 400 });
  }

  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(req, "auth-confirm-password-reset"),
    RL.authPhoneVerify.limit,
    RL.authPhoneVerify.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите и попробуйте снова." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const codeOk = await verifyStoredCode({
    purpose: "password_reset",
    contact: email,
    code: parsed.data.code.trim(),
  });
  if (!codeOk) {
    await writeSecurityAuditLog({
      category: "auth",
      action: "confirm_password_reset.invalid_code",
      success: false,
    });
    return NextResponse.json({ error: OTP_INVALID_MSG }, { status: 401 });
  }

  const userId = await resolveAuthUserIdByEmail(email);
  if (!userId) {
    // Не палим enumeration: код уже сожжён — просим начать заново через минуту.
    return NextResponse.json(
      { error: "Не удалось обновить пароль. Запросите код снова через минуту." },
      { status: 400 },
    );
  }

  const updated = await setUserPasswordAfterEmailProof(userId, parsed.data.password);
  if (!updated) {
    await writeSecurityAuditLog({
      category: "auth",
      action: "confirm_password_reset.update_failed",
      success: false,
      metadata: { userId },
    });
    return NextResponse.json(
      { error: "Не удалось сохранить пароль. Попробуйте позже или войдите, если помните старый." },
      { status: 502 },
    );
  }

  await writeSecurityAuditLog({
    category: "auth",
    action: "confirm_password_reset.ok",
    success: true,
    metadata: { userId },
  });

  return NextResponse.json({
    ok: true,
    message: "Пароль обновлён. Войдите новым паролем.",
  });
}
