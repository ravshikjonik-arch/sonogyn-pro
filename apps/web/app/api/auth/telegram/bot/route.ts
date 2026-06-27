import { NextResponse } from "next/server";

import { rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import { checkPilotTelegramAllowed } from "@/lib/auth/pilot-allowlist";
import {
  parseJsonBody,
  TelegramBotBodySchema,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import {
  ensureTelegramUser,
  establishTelegramSession,
  readInternalAuthSecret,
} from "@/lib/auth/telegram-supabase";

/** Доверенный вход через Telegram-бота (без Login Widget hash). Только server-to-server. */
export async function POST(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "auth-telegram-bot", RL.authTelegramBot);
  if (limited) return limited;

  if (!readInternalAuthSecret(request)) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }

  const raw = await parseJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = TelegramBotBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const body = parsed.data;
  const telegramId = String(body.id ?? "").trim();
  if (!telegramId) {
    return NextResponse.json({ error: "Не указан Telegram ID." }, { status: 400 });
  }

  const pilotDenied = checkPilotTelegramAllowed(telegramId);
  if (pilotDenied) {
    return NextResponse.json({ error: pilotDenied }, { status: 403 });
  }

  try {
    const email = await ensureTelegramUser({ ...body, source: "bot" });
    return establishTelegramSession(email, request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: translateAuthError(msg) }, { status: 500 });
  }
}
