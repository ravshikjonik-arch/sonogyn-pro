import { NextResponse } from "next/server";

import { checkPilotTelegramAllowed, isPilotAllowlistEnabled } from "@/lib/auth/pilot-allowlist";
import { buildRegisterIntentCookie } from "@/lib/auth/pilot-register-intent";
import { parseRegistrationMetadata } from "@/lib/auth/registration-metadata";
import {
  parseJsonBody,
  PilotRegisterIntentBodySchema,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";

export const runtime = "nodejs";

/** Сохраняет данные врача перед редиректом на Telegram Widget (регистрация пилота). */
export async function POST(req: Request) {
  const raw = await parseJsonBody(req);
  if (!raw.ok) return raw.response;

  const parsed = PilotRegisterIntentBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const registration = parseRegistrationMetadata(parsed.data);
  if (!registration.full_name?.trim()) {
    return NextResponse.json({ error: "Укажите ФИО специалиста." }, { status: 400 });
  }
  if (!registration.specialization?.trim()) {
    return NextResponse.json({ error: "Выберите специализацию." }, { status: 400 });
  }

  const telegramId = parsed.data.telegramId?.trim();
  if (telegramId && isPilotAllowlistEnabled()) {
    const denied = checkPilotTelegramAllowed(telegramId);
    if (denied) {
      return NextResponse.json({ error: denied }, { status: 403 });
    }
  }

  let cookie: ReturnType<typeof buildRegisterIntentCookie>;
  try {
    cookie = buildRegisterIntentCookie(registration);
  } catch {
    return NextResponse.json(
      { error: "Сервер не настроен для регистрации. Нужен SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  const next = parsed.data.next?.trim() || "/app";
  const redirectUrl = `/auth/telegram/start?register=1&next=${encodeURIComponent(next)}`;

  const res = NextResponse.json({ ok: true, redirectUrl });
  res.cookies.set(cookie.name, cookie.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: cookie.maxAge,
  });
  return res;
}
