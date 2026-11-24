import { NextResponse } from "next/server";

import { translateAuthError } from "@/lib/auth/translate-auth-error";
import { consumeTelegramMobileLoginPending } from "@/lib/auth/telegram-mobile-login-pending";
import {
  ensureTelegramUser,
  establishTelegramSessionTokens,
  PilotTelegramAuthError,
} from "@/lib/auth/telegram-supabase";
import {
  parseJsonBody,
  TelegramMobileSessionBodySchema,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

export const runtime = "nodejs";

/** POST — обмен подтверждённого nonce на Supabase session (mobile). */
export async function POST(request: Request) {
  const rl = await consumeRateLimit(
    rateLimitKeyFromRequest(request, "auth-telegram-mobile-session"),
    RL.authTelegram.limit,
    RL.authTelegram.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const raw = await parseJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = TelegramMobileSessionBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const payload = await consumeTelegramMobileLoginPending(parsed.data.nonce);
  if (!payload) {
    return NextResponse.json(
      { error: "Сессия Telegram не найдена или ещё не подтверждена." },
      { status: 404 },
    );
  }

  try {
    const email = await ensureTelegramUser({ ...payload, source: payload.source ?? "bot" });
    const session = await establishTelegramSessionTokens(email);
    if (!session) {
      return NextResponse.json({ error: "Не удалось создать сессию." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, session, email });
  } catch (e) {
    if (e instanceof PilotTelegramAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: translateAuthError(msg) }, { status: 500 });
  }
}