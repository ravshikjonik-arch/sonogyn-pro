import { NextResponse } from "next/server";

import { OTP_INVALID_MSG } from "@/lib/auth/safe-auth-messages";
import { verifyStoredCode } from "@/lib/auth/verification/code-store";
import type { VerificationMethod, VerificationPurpose } from "@/lib/auth/verification/types";
import {
  parseEmailContact,
  parseSmsContact,
  parseTelegramChatId,
} from "@/lib/auth/verification/validate-contact";
import { rejectIfVerificationRateLimited } from "@/lib/auth/verification/verification-rate-limit";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

export const runtime = "nodejs";

type VerifyCodeBody = {
  method?: VerificationMethod;
  contact?: string;
  code?: string;
  purpose?: VerificationPurpose;
};

export async function POST(req: Request) {
  let body: VerifyCodeBody;
  try {
    body = (await req.json()) as VerifyCodeBody;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const method = body.method;
  const purpose = body.purpose ?? "login";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const contactRaw = typeof body.contact === "string" ? body.contact : "";

  if (!method || !code || !contactRaw) {
    return NextResponse.json({ error: "Укажите method, contact и code." }, { status: 400 });
  }

  let contact: string | null = null;
  if (method === "email") contact = parseEmailContact(contactRaw);
  if (method === "sms") contact = parseSmsContact(contactRaw);
  if (method === "telegram") contact = parseTelegramChatId(contactRaw);

  if (!contact) {
    return NextResponse.json({ error: "Некорректный contact." }, { status: 400 });
  }

  const limited = await rejectIfVerificationRateLimited(req, method, contact);
  if (limited) return limited;

  const verifyRl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(req, "auth-verify-code"),
    RL.authPhoneVerify.limit,
    RL.authPhoneVerify.windowMs,
  );
  if (!verifyRl.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток проверки кода." },
      { status: 429, headers: { "Retry-After": String(verifyRl.retryAfterSec) } },
    );
  }

  const ok = await verifyStoredCode({ purpose, contact, code });
  if (!ok) {
    return NextResponse.json({ error: OTP_INVALID_MSG }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
