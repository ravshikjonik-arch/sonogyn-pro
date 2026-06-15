import { NextResponse } from "next/server";

import { verifyTurnstileIfConfigured } from "@/lib/auth/verify-turnstile";
import { CAPTCHA_REQUIRED_MSG } from "@/lib/auth/safe-auth-messages";
import { runVerificationFallbackChain } from "@/lib/auth/verification/fallback-handler";
import type { VerificationMethod, VerificationPurpose } from "@/lib/auth/verification/types";
import {
  parseEmailContact,
  parseSmsContact,
  parseTelegramChatId,
} from "@/lib/auth/verification/validate-contact";
import {
  rejectIfVerificationRateLimited,
} from "@/lib/auth/verification/verification-rate-limit";
import { logVerificationEvent } from "@/lib/auth/verification/safe-verification-log";
import { logVerificationEvent as obsLogVerification } from "@/lib/observability";
import { isCaptchaRequired, recordAuthFailure } from "@/lib/auth/auth-attempts";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

export const runtime = "nodejs";
/** Vercel Hobby: 10s; Pro: до 60s. Внешние вызовы обёрнуты in withTimeout. */
export const maxDuration = 30;

type SendCodeBody = {
  method?: VerificationMethod;
  contact?: string;
  fallbackEmail?: string;
  purpose?: VerificationPurpose;
  turnstileToken?: string;
};

const PURPOSES: VerificationPurpose[] = ["register", "login", "mfa", "password_reset"];
const METHODS: VerificationMethod[] = ["email", "sms", "telegram"];

function normalizeContact(method: VerificationMethod, raw: string): string | null {
  if (method === "email") return parseEmailContact(raw);
  if (method === "sms") return parseSmsContact(raw);
  return parseTelegramChatId(raw);
}

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-send-code-fail");

  let body: SendCodeBody;
  try {
    body = (await req.json()) as SendCodeBody;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const method = body.method;
  const purpose = body.purpose ?? "login";

  if (!method || !METHODS.includes(method)) {
    return NextResponse.json({ error: "Укажите method: email | sms | telegram." }, { status: 400 });
  }
  if (!PURPOSES.includes(purpose)) {
    return NextResponse.json({ error: "Некорректный purpose." }, { status: 400 });
  }

  const contactRaw = typeof body.contact === "string" ? body.contact : "";
  const contact = normalizeContact(method, contactRaw);
  if (!contact) {
    return NextResponse.json({ error: "Некорректный contact для выбранного method." }, { status: 400 });
  }

  const limited = await rejectIfVerificationRateLimited(req, method, contact);
  if (limited) return limited;

  if (await isCaptchaRequired(failKey)) {
    const ok = await verifyTurnstileIfConfigured(body.turnstileToken);
    if (!ok) {
      return NextResponse.json({ error: CAPTCHA_REQUIRED_MSG, requiresCaptcha: true }, { status: 403 });
    }
  }

  const fallbackEmail =
    typeof body.fallbackEmail === "string" ? parseEmailContact(body.fallbackEmail) : undefined;

  if ((method === "sms" || method === "telegram") && !fallbackEmail) {
    // Fallback chain требует email для SMS/TG — без него только primary канал.
    logVerificationEvent("send_code_no_fallback_email", { method, purpose });
  }

  const idempotencyKey = req.headers.get("Idempotency-Key");

  const started = Date.now();
  const result = await runVerificationFallbackChain({
    primaryMethod: method,
    contact: contactRaw,
    purpose,
    fallbackEmail: fallbackEmail ?? undefined,
    idempotencyKey,
  });

  if (!result.ok) {
    await recordAuthFailure(failKey);
    obsLogVerification("send", method, false, Date.now() - started, {
      ...(result.errorCode ? { errorCode: result.errorCode } : {}),
      fallbackUsed: false,
    });
    return NextResponse.json(
      {
        error: result.message ?? "Не удалось отправить код.",
        errorCode: result.errorCode,
        suggestAlternateMethod: result.suggestAlternateMethod,
        requiresCaptcha: await isCaptchaRequired(failKey),
      },
      { status: result.errorCode === "invalid_contact" ? 400 : 502 },
    );
  }

  obsLogVerification("send", result.deliveredVia ?? method, true, Date.now() - started, {
    fallbackUsed: Boolean(result.fallbackUsed),
  });

  return NextResponse.json({
    ok: true,
    message: result.message,
    deliveredVia: result.deliveredVia,
    fallbackUsed: result.fallbackUsed ?? false,
  });
}
