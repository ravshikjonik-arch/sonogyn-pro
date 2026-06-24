import { NextResponse } from "next/server";

import {
  clearAuthFailures,
  recordAuthFailure,
} from "@/lib/auth/auth-attempts";
import { isAuthEmailOnly, disabledAuthMethodResponse } from "@/lib/auth/auth-methods-config";
import {
  parseRegistrationMetadata,
} from "@/lib/auth/registration-metadata";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { verifyStoredCode } from "@/lib/auth/verification/code-store";
import { parseTelegramChatId } from "@/lib/auth/verification/validate-contact";
import {
  ensureTelegramOtpUser,
  establishTelegramAuthSession,
} from "@/lib/auth/telegram-custom-auth";
import { logError } from "@/services/logger";

type Body = {
  chatId?: string;
  telegramId?: string;
  token?: string;
  code?: string;
  full_name?: string;
  preferred_locale?: string;
  specialization?: string;
  institution?: string;
  birth_year?: number;
  birth_date?: string;
  createUser?: boolean;
};

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-telegram-verify-fail");

  if (isAuthEmailOnly()) return disabledAuthMethodResponse("telegram");

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(req, "auth-telegram-verify"),
    RL.authPhoneVerify.limit,
    RL.authPhoneVerify.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите и попробуйте снова." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const chatIdRaw =
    typeof body.chatId === "string"
      ? body.chatId
      : typeof body.telegramId === "string"
        ? body.telegramId
        : "";
  const chatId = parseTelegramChatId(chatIdRaw);
  const tokenRaw =
    typeof body.token === "string"
      ? body.token
      : typeof body.code === "string"
        ? body.code
        : "";
  const token = tokenRaw.trim();
  const registrationMeta = parseRegistrationMetadata(body);

  if (!chatId || !token) {
    return NextResponse.json({ error: "Укажите Telegram ID и код." }, { status: 400 });
  }

  const isRegistration = body.createUser === true || Boolean(registrationMeta.full_name);
  const purpose = isRegistration ? "register" : "login";

  try {
    const codeOk = await verifyStoredCode({ purpose, contact: chatId, code: token });
    if (!codeOk) {
      await recordAuthFailure(failKey);
      return NextResponse.json({ error: "Неверный или просроченный код." }, { status: 401 });
    }

    const ensured = await ensureTelegramOtpUser({
      chatId,
      registration: registrationMeta,
      createUser: isRegistration ? true : body.createUser !== false,
    });
    if ("error" in ensured) {
      return NextResponse.json(
        { error: ensured.error, needsRegistration: ensured.needsRegistration },
        { status: ensured.needsRegistration ? 400 : 500 },
      );
    }

    await clearAuthFailures(failKey);
    return establishTelegramAuthSession(
      ensured.email,
      req,
      ensured.userId,
      registrationMeta,
      chatId,
    );
  } catch (e) {
    await recordAuthFailure(failKey);
    logError("telegram/verify-otp: exception", e, { context: { chatId } });
    return NextResponse.json({ error: "Не удалось подтвердить код." }, { status: 500 });
  }
}
