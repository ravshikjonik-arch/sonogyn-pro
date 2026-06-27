import { NextResponse } from "next/server";

import { TelegramService } from "@/services/telegram";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import { createMobileSessionExchange } from "@/lib/auth/mobile-session-exchange";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";
import type { RegistrationMetadata } from "@/lib/auth/registration-metadata";
import { applyRegistrationMetadataAdmin } from "@/lib/auth/registration-metadata";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { checkPilotTelegramAllowed } from "@/lib/auth/pilot-allowlist";
import { findUserByTelegramId } from "@/lib/auth/telegram-supabase";

export const TELEGRAM_EMAIL_DOMAIN = "telegram.sonogyn.app";

export function telegramChatIdToAuthEmail(chatId: string): string {
  return `tg_${chatId}@${TELEGRAM_EMAIL_DOMAIN}`;
}

export async function ensureTelegramOtpUser(params: {
  chatId: string;
  registration?: RegistrationMetadata;
  createUser: boolean;
}): Promise<{ email: string; userId: string; created: boolean } | { error: string; needsRegistration?: boolean }> {
  const pilotDenied = checkPilotTelegramAllowed(params.chatId);
  if (pilotDenied) {
    return { error: pilotDenied };
  }

  const admin = createServiceRoleClient();
  const email = telegramChatIdToAuthEmail(params.chatId);
  const existing = await findUserByTelegramId(admin, params.chatId);

  if (existing?.id) {
    if (params.createUser && params.registration?.full_name) {
      await applyRegistrationMetadataAdmin(admin, existing.id, params.registration, {
        telegram_id: params.chatId,
        provider: "telegram",
        auth_source: "otp",
      });
    }
    return { email: existing.email ?? email, userId: existing.id, created: false };
  }

  if (!params.createUser) {
    return {
      error: "Аккаунт с этим Telegram ID не найден. Сначала зарегистрируйтесь.",
      needsRegistration: true,
    };
  }

  const meta = params.registration;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      telegram_id: params.chatId,
      full_name: meta?.full_name ?? `Telegram ${params.chatId}`,
      specialization: meta?.specialization,
      institution: meta?.institution,
      birth_year: meta?.birth_year,
      preferred_locale: meta?.preferred_locale,
      provider: "telegram",
      auth_source: "otp",
    },
  });

  if (error) {
    const retry = await findUserByTelegramId(admin, params.chatId);
    if (retry?.id) {
      return { email: retry.email ?? email, userId: retry.id, created: false };
    }
    return { error: translateAuthError(error.message, "sign-up") };
  }

  const userId = data.user?.id;
  if (!userId) return { error: "Не удалось создать пользователя." };

  await applyRegistrationMetadataAdmin(
    admin,
    userId,
    params.registration ?? {},
    { telegram_id: params.chatId, provider: "telegram", auth_source: "otp" },
  );

  TelegramService.notifyAdminsSafe("user.created", {
    userId,
    telegramId: params.chatId,
    method: "telegram",
    name: meta?.full_name,
  });

  return { email, userId, created: true };
}

export async function establishTelegramAuthSession(
  email: string,
  request: Request,
  userId?: string,
  registration?: RegistrationMetadata,
  chatId?: string,
) {
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

  if (userId && chatId) {
    await applyRegistrationMetadataAdmin(
      admin,
      userId,
      registration?.full_name ? registration : {},
      { telegram_id: chatId, provider: "telegram", auth_source: "otp" },
    );
  }

  const { data: sessionData } = await client.supabase.auth.getSession();
  const wantsMobileSession = request.headers.get("x-sonogyn-client") === "mobile";

  if (wantsMobileSession && sessionData.session) {
    return NextResponse.json({
      ok: true,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      },
    });
  }

  return nextJsonWithAuthCookies({ ok: true }, client.cookiesToSet);
}
