import { NextResponse } from "next/server";

import { OTP_INVALID_MSG } from "@/lib/auth/safe-auth-messages";
import { verifyStoredCode } from "@/lib/auth/verification/code-store";
import type { VerificationMethod } from "@/lib/auth/verification/types";
import {
  parseEmailContact,
  parseSmsContact,
  parseTelegramChatId,
} from "@/lib/auth/verification/validate-contact";
import { rejectIfVerificationRateLimited } from "@/lib/auth/verification/verification-rate-limit";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import {
  parseJsonBody,
  VerifyCodeBodySchema,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await parseJsonBody(req);
  if (!raw.ok) return raw.response;

  const parsed = VerifyCodeBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const body = parsed.data;
  const method = body.method;
  const purpose = body.purpose ?? "login";
  const code = body.code;
  const contactRaw = body.contact;

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
