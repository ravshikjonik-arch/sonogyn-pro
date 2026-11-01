import { NextResponse } from "next/server";

import { confirmUserEmail } from "@/lib/auth/auto-confirm-email";
import { autoGrantPilotMedicalAccess } from "@/lib/auth/pilot-medical-access";
import { resolveUserIdByEmail } from "@/lib/auth/resolve-user-by-email";
import { OTP_INVALID_MSG } from "@/lib/auth/safe-auth-messages";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import { verifyStoredCode } from "@/lib/auth/verification/code-store";
import { parseEmailContact } from "@/lib/auth/verification/validate-contact";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";
import {
  ConfirmSignupOtpBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { writeSecurityAuditLog } from "@/lib/security/security-audit-log";

export const runtime = "nodejs";

/**
 * Подтверждение регистрации кодом из письма (Mail.ru SMTP),
 * без обязательного клика по ссылке Supabase.
 */
export async function POST(req: Request) {
  const raw = await parseJsonBody(req);
  if (!raw.ok) return raw.response;

  const parsed = ConfirmSignupOtpBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const email = parseEmailContact(parsed.data.email);
  if (!email) {
    return NextResponse.json({ error: "Некорректный email." }, { status: 400 });
  }

  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(req, "auth-confirm-signup-otp"),
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
    purpose: "register",
    contact: email,
    code: parsed.data.code.trim(),
  });
  if (!codeOk) {
    await writeSecurityAuditLog({
      category: "auth",
      action: "confirm_signup_otp.invalid_code",
      success: false,
    });
    return NextResponse.json({ error: OTP_INVALID_MSG }, { status: 401 });
  }

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const { supabase, cookiesToSet } = client;
  const userId = await resolveUserIdByEmail(email);
  if (!userId) {
    return NextResponse.json(
      { error: "Аккаунт не найден. Зарегистрируйтесь снова." },
      { status: 404 },
    );
  }

  const confirmed = await confirmUserEmail(userId);
  if (!confirmed) {
    return NextResponse.json(
      { error: "Не удалось подтвердить почту. Попробуйте ссылку из письма или код повторно." },
      { status: 502 },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.session) {
    await writeSecurityAuditLog({
      category: "auth",
      action: "confirm_signup_otp.sign_in_failed",
      success: false,
    });
    return NextResponse.json(
      { error: translateAuthError(error?.message ?? "sign_in_failed", "sign-in") },
      { status: 400 },
    );
  }

  await autoGrantPilotMedicalAccess(userId);
  await writeSecurityAuditLog({
    category: "auth",
    action: "confirm_signup_otp.ok",
    success: true,
    metadata: { userId },
  });

  const wantsMobile = req.headers.get("x-sonogyn-client") === "mobile";
  const payload = {
    ok: true as const,
    message: "Почта подтверждена. Можно продолжить.",
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  };

  if (wantsMobile) return NextResponse.json(payload);
  return nextJsonWithAuthCookies(payload, cookiesToSet);
}
