import { NextResponse } from "next/server";

import { translateAuthError } from "@/lib/auth/translate-auth-error";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";
import { createMobileSessionExchange } from "@/lib/auth/mobile-session-exchange";
import { isInternalAuthSecretConfigured } from "@/lib/security/production-secrets";
import { timingSafeEqual } from "@/lib/security/timing-safe";
import {
  checkPilotTelegramAllowed,
  PILOT_REGISTER_FIRST_MSG,
} from "@/lib/auth/pilot-allowlist";
import type { RegistrationMetadata } from "@/lib/auth/registration-metadata";
import { applyRegistrationMetadataAdmin } from "@/lib/auth/registration-metadata";
import {
  type TelegramPayload,
  verifyTelegramWidgetHash,
} from "@/lib/auth/telegram-widget";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export type { TelegramPayload };
export { verifyTelegramWidgetHash };

export class PilotTelegramAuthError extends Error {
  constructor(
    message: string,
    readonly code: "denied" | "needs_registration" = "denied",
  ) {
    super(message);
    this.name = "PilotTelegramAuthError";
  }
}

export async function findUserByTelegramId(
  admin: ReturnType<typeof createServiceRoleClient>,
  telegramId: string,
) {
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const hit = data.users.find((u) => String(u.user_metadata?.telegram_id ?? "") === telegramId);
    if (hit) return hit;
    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

export async function ensureTelegramUser(
  body: TelegramPayload,
  options?: { registration?: RegistrationMetadata },
) {
  const admin = createServiceRoleClient();
  const telegramId = String(body.id ?? "").trim();
  if (!telegramId) throw new Error("Не указан Telegram ID.");

  const denied = checkPilotTelegramAllowed(telegramId);
  if (denied) throw new PilotTelegramAuthError(denied, "denied");

  const email = `tg_${telegramId}@telegram.sonogyn.app`;
  const fullName = [body.first_name, body.last_name].filter(Boolean).join(" ").trim();
  const registration = options?.registration;
  const metaFullName = registration?.full_name?.trim() || fullName || body.username || `Telegram ${telegramId}`;

  const existing = await findUserByTelegramId(admin, telegramId);
  if (existing?.id) {
    if (registration?.full_name) {
      await applyRegistrationMetadataAdmin(admin, existing.id, registration, {
        telegram_id: telegramId,
        ...(body.username ? { username: body.username } : {}),
        provider: "telegram",
        auth_source: body.source ?? "widget",
      });
    }
    return existing.email ?? email;
  }

  // Новых пользователей создаём только после формы врача (intent cookie / OTP metadata).
  if (!registration?.full_name?.trim()) {
    throw new PilotTelegramAuthError(PILOT_REGISTER_FIRST_MSG, "needs_registration");
  }

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      telegram_id: telegramId,
      full_name: metaFullName,
      specialization: registration?.specialization,
      institution: registration?.institution,
      birth_year: registration?.birth_year,
      preferred_locale: registration?.preferred_locale,
      username: body.username,
      photo_url: body.photo_url,
      provider: "telegram",
      auth_source: body.source ?? "widget",
    },
  });

  if (createError && !/already been registered|already exists/i.test(createError.message)) {
    const retry = await findUserByTelegramId(admin, telegramId);
    if (retry?.email) return retry.email;
    throw new Error(createError.message);
  }

  const created = await findUserByTelegramId(admin, telegramId);
  if (created?.id && registration?.full_name) {
    await applyRegistrationMetadataAdmin(admin, created.id, registration, {
      telegram_id: telegramId,
      ...(body.username ? { username: body.username } : {}),
      provider: "telegram",
      auth_source: body.source ?? "widget",
    });
  }

  return email;
}

export async function establishTelegramSession(email: string, request: Request) {
  const admin = createServiceRoleClient();
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData.properties.hashed_token) {
    return NextResponse.json(
      { error: translateAuthError(linkError?.message ?? "Не удалось создать сессию.") },
      { status: 500 },
    );
  }

  const { error: verifyError } = await client.supabase.auth.verifyOtp({
    type: "email",
    token_hash: linkData.properties.hashed_token,
  });

  if (verifyError) {
    return NextResponse.json({ error: translateAuthError(verifyError.message) }, { status: 401 });
  }

  const { data: sessionData } = await client.supabase.auth.getSession();
  const wantsMobileSession = request.headers.get("x-sonogyn-client") === "mobile";

  if (wantsMobileSession && sessionData.session) {
    const exchangeCode = await createMobileSessionExchange({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    });
    return NextResponse.json({
      ok: true,
      email,
      exchangeCode,
    });
  }

  return nextJsonWithAuthCookies({ ok: true, email }, client.cookiesToSet);
}

export function readInternalAuthSecret(request: Request): boolean {
  if (!isInternalAuthSecretConfigured()) return false;
  const expected = process.env.SONOGYN_AUTH_INTERNAL_SECRET!.trim();
  const received = request.headers.get("x-sonogyn-internal-secret") ?? "";
  return timingSafeEqual(expected, received);
}
