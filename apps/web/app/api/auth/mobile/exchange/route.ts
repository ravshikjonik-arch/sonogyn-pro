import { NextResponse } from "next/server";

import { consumeMobileSessionExchange } from "@/lib/auth/mobile-session-exchange";
import {
  MobileExchangeBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

/** Обмен одноразового кода на mobile session (без токенов в URL). */
export async function POST(req: Request) {
  const rl = await consumeRateLimit(
    rateLimitKeyFromRequest(req, "auth-mobile-exchange"),
    RL.authMobileExchange.limit,
    RL.authMobileExchange.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const raw = await parseJsonBody(req);
  if (!raw.ok) return raw.response;

  const parsed = MobileExchangeBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const code = parsed.data.exchangeCode;

  const session = await consumeMobileSessionExchange(code);
  if (!session) {
    return NextResponse.json({ error: "Код недействителен или истёк." }, { status: 410 });
  }

  return NextResponse.json({ ok: true, session });
}
