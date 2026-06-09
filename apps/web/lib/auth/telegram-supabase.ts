import crypto from "crypto";
import { NextResponse } from "next/server";

import { translateAuthError } from "@/lib/auth/translate-auth-error";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";
import { createMobileSessionExchange } from "@/lib/auth/mobile-session-exchange";
import { isInternalAuthSecretConfigured } from "@/lib/security/production-secrets";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export type TelegramPayload = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number | string;
  hash?: string;
  source?: string;
};

export function verifyTelegramWidgetHash(body: TelegramPayload, botToken: string): boolean {
  const { hash, ...rest } = body;
  if (!hash) return false;

  const checkString = Object.keys(rest)
    .filter((k) => rest[k as keyof typeof rest] !== undefined && rest[k as keyof typeof rest] !== "")
    .sort()
    .map((k) => `${k}=${rest[k as keyof typeof rest]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");
  return computedHash === hash;
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

export async function ensureTelegramUser(body: TelegramPayload) {
  const admin = createServiceRoleClient();
  const telegramId = String(body.id ?? "").trim();
  const email = `tg_${telegramId}@telegram.sonogyn.app`;
  const fullName = [body.first_name, body.last_name].filter(Boolean).join(" ").trim();

  const existing = await findUserByTelegramId(admin, telegramId);
  if (existing?.email) {
    return existing.email;
  }

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      telegram_id: telegramId,
      full_name: fullName || body.username || `Telegram ${telegramId}`,
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
  return request.headers.get("x-sonogyn-internal-secret") === expected;
}
