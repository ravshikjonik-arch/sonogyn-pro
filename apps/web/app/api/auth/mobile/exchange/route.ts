import { NextResponse } from "next/server";

import { consumeMobileSessionExchange } from "@/lib/auth/mobile-session-exchange";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

type Body = { exchangeCode?: string };

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

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const code = typeof body.exchangeCode === "string" ? body.exchangeCode.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "Код обмена не указан." }, { status: 400 });
  }

  const session = await consumeMobileSessionExchange(code);
  if (!session) {
    return NextResponse.json({ error: "Код недействителен или истёк." }, { status: 410 });
  }

  return NextResponse.json({ ok: true, session });
}
