import { NextResponse } from "next/server";

import { isAuthEmailOnly, disabledAuthMethodResponse } from "@/lib/auth/auth-methods-config";
import { verifyTurnstileIfConfigured } from "@/lib/auth/verify-turnstile";
import { CAPTCHA_REQUIRED_MSG } from "@/lib/auth/safe-auth-messages";
import { runVerificationFallbackChain } from "@/lib/auth/verification/fallback-handler";
import type { VerificationMethod, VerificationPurpose } from "@/lib/auth/verification/types";
import { checkPilotTelegramAllowed } from "@/lib/auth/pilot-allowlist";
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
import { clientIpFromRequest, rateLimitKeyFromRequest } from "@/lib/security/request-client";
import {
  parseJsonBody,
  SendCodeBodySchema,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";

export const runtime = "nodejs";
/** Vercel Hobby: 10s; Pro: до 60s. Внешние вызовы обёрнуты in withTimeout. */
export const maxDuration = 30;

function normalizeContact(method: VerificationMethod, raw: string): string | null {
  if (method === "email") return parseEmailContact(raw);
  if (method === "sms") return parseSmsContact(raw);
  return parseTelegramChatId(raw);
}

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-send-code-fail");

  const raw = await parseJsonBody(req);
  if (!raw.ok) return raw.response;

  const parsed = SendCodeBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const body = parsed.data;
  const method = body.method;
  if (isAuthEmailOnly() && method && method !== "email") {
    return disabledAuthMethodResponse(method === "sms" ? "sms" : "telegram");
  }

  const purpose = body.purpose ?? "login";

  const contact = normalizeContact(method, body.contact);
  if (!contact) {
    return NextResponse.json({ error: "Некорректный contact для выбранного method." }, { status: 400 });
  }

  if (method === "telegram") {
    const pilotDenied = checkPilotTelegramAllowed(contact);
    if (pilotDenied) {
      return NextResponse.json({ error: pilotDenied }, { status: 403 });
    }
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
  const backupPhone =
    typeof body.backupPhone === "string" && body.backupPhone.trim()
      ? parseSmsContact(body.backupPhone)
      : undefined;

  if ((method === "sms" || method === "telegram") && !fallbackEmail) {
    // Fallback chain требует email для SMS/TG — без него только primary канал.
    logVerificationEvent("send_code_no_fallback_email", { method, purpose });
  }

  const idempotencyKey = req.headers.get("Idempotency-Key");

  const started = Date.now();
  const result = await runVerificationFallbackChain({
    primaryMethod: method,
    contact,
    purpose,
    fallbackEmail: fallbackEmail ?? undefined,
    backupPhone: backupPhone ?? undefined,
    idempotencyKey,
    clientIp: clientIpFromRequest(req),
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
