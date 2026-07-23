import { NextResponse } from "next/server";

import {
  clearAuthFailures,
  recordAuthFailure,
} from "@/lib/auth/auth-attempts";
import { isAuthEmailOnly, disabledAuthMethodResponse } from "@/lib/auth/auth-methods-config";
import { parseRegistrationMetadata } from "@/lib/auth/registration-metadata";
import {
  parseJsonBody,
  TelegramVerifyOtpBodySchema,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { verifyStoredCode } from "@/lib/auth/verification/code-store";
import { checkPilotTelegramAllowed } from "@/lib/auth/pilot-allowlist";
import { parseTelegramChatId } from "@/lib/auth/verification/validate-contact";
import {
  ensureTelegramOtpUser,
  establishTelegramAuthSession,
} from "@/lib/auth/telegram-custom-auth";
import { logError } from "@/services/logger";
import { writeSecurityAuditLog } from "@/lib/security/security-audit-log";

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-telegram-verify-fail");

  if (isAuthEmailOnly()) return disabledAuthMethodResponse("telegram");

  const raw = await parseJsonBody(req);
  if (!raw.ok) return raw.response;

  const parsed = TelegramVerifyOtpBodySchema.safeParse(raw.data);
  if (!parsed.success) {
    await writeSecurityAuditLog({
      category: "auth",
      action: "telegram.verify_otp.bad_payload",
      success: false,
    });
    return zodErrorResponse(parsed.error);
  }

  const body = parsed.data;

  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(req, "auth-telegram-verify"),
    RL.authPhoneVerify.limit,
    RL.authPhoneVerify.windowMs,
  );
  if (!rl.ok) {
    await writeSecurityAuditLog({
      category: "auth",
      action: "telegram.verify_otp.rate_limited",
      success: false,
      metadata: { retryAfterSec: rl.retryAfterSec },
    });
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите и попробуйте снова." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const chatIdRaw = body.chatId ?? body.telegramId ?? "";
  const chatId = parseTelegramChatId(chatIdRaw);
  const token = (body.token ?? body.code ?? "").trim();
  const registrationMeta = parseRegistrationMetadata(body);

  if (!chatId || !token) {
    return NextResponse.json({ error: "Укажите Telegram ID и код." }, { status: 400 });
  }

  const pilotDenied = checkPilotTelegramAllowed(chatId);
  if (pilotDenied) {
    return NextResponse.json({ error: pilotDenied }, { status: 403 });
  }

  const isRegistration = body.createUser === true || Boolean(registrationMeta.full_name);
  const purpose = isRegistration ? "register" : "login";

  try {
    const codeOk = await verifyStoredCode({ purpose, contact: chatId, code: token });
    if (!codeOk) {
      await writeSecurityAuditLog({
        category: "auth",
        action: "telegram.verify_otp.invalid_code",
        success: false,
      });
      await recordAuthFailure(failKey);
      return NextResponse.json({ error: "Неверный или просроченный код." }, { status: 401 });
    }

    const ensured = await ensureTelegramOtpUser({
      chatId,
      registration: registrationMeta,
      createUser: isRegistration ? true : body.createUser !== false,
    });
    if ("error" in ensured) {
      await writeSecurityAuditLog({
        category: "auth",
        action: "telegram.verify_otp.provision_failed",
        success: false,
        metadata: { needsRegistration: ensured.needsRegistration },
      });
      return NextResponse.json(
        { error: ensured.error, needsRegistration: ensured.needsRegistration },
        { status: ensured.needsRegistration ? 400 : 500 },
      );
    }

    await clearAuthFailures(failKey);
    await writeSecurityAuditLog({
      category: "auth",
      action: "telegram.verify_otp.success",
      success: true,
      resource: ensured.userId,
    });
    return establishTelegramAuthSession(
      ensured.email,
      req,
      ensured.userId,
      registrationMeta,
      chatId,
    );
  } catch (e) {
    await writeSecurityAuditLog({
      category: "auth",
      action: "telegram.verify_otp.exception",
      success: false,
      metadata: { message: e instanceof Error ? e.message : "unknown" },
    });
    await recordAuthFailure(failKey);
    logError("telegram/verify-otp: exception", e, { context: { chatId } });
    return NextResponse.json({ error: "Не удалось подтвердить код." }, { status: 500 });
  }
}
