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
import { phoneVerifiedMetadataPatch } from "@/lib/auth/phone-verified";
import { createServiceRoleClient } from "@/utils/supabase/admin";

const PHONE_EMAIL_DOMAIN = "phone.sonogyn.app";

/** E.164 / Supabase phone → единые цифры для сравнения (79933000070). */
export function phoneDigitsForLookup(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) return `7${digits.slice(1)}`;
  return digits;
}

export function phonesMatchStored(stored: string | null | undefined, e164: string): boolean {
  if (!stored?.trim()) return false;
  return phoneDigitsForLookup(stored) === phoneDigitsForLookup(e164);
}

export function phoneToAuthEmail(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  return `phone_${digits}@${PHONE_EMAIL_DOMAIN}`;
}

export async function findUserByPhoneE164(
  admin: ReturnType<typeof createServiceRoleClient>,
  e164: string,
) {
  const target = e164.replace(/\s/g, "");
  const email = phoneToAuthEmail(target);

  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find(
      (u) =>
        phonesMatchStored(u.phone, target) ||
        phonesMatchStored(String(u.user_metadata?.phone_e164 ?? ""), target) ||
        u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (hit) return hit;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

export async function ensurePhoneAuthUser(params: {
  phoneE164: string;
  registration?: RegistrationMetadata;
  createUser: boolean;
}): Promise<{ email: string; userId: string; created: boolean } | { error: string; needsRegistration?: boolean }> {
  const admin = createServiceRoleClient();
  const email = phoneToAuthEmail(params.phoneE164);
  const existing = await findUserByPhoneE164(admin, params.phoneE164);

  if (existing?.id) {
    if (params.createUser && params.registration?.full_name) {
      await applyRegistrationMetadataAdmin(admin, existing.id, params.registration, {
        phone_e164: params.phoneE164,
        ...phoneVerifiedMetadataPatch(),
      });
    }
    return { email: existing.email ?? email, userId: existing.id, created: false };
  }

  if (!params.createUser) {
    return { error: "Аккаунт с этим номером не найден. Сначала зарегистрируйтесь.", needsRegistration: true };
  }

  const meta = params.registration;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    phone: phoneDigitsForLookup(params.phoneE164),
    phone_confirm: true,
    user_metadata: {
      phone_e164: params.phoneE164,
      full_name: meta?.full_name,
      specialization: meta?.specialization,
      institution: meta?.institution,
      birth_year: meta?.birth_year,
      preferred_locale: meta?.preferred_locale,
      provider: "sms",
      ...phoneVerifiedMetadataPatch(),
    },
  });

  if (error) {
    const retry = await findUserByPhoneE164(admin, params.phoneE164);
    if (retry?.id) {
      return { email: retry.email ?? email, userId: retry.id, created: false };
    }
    return { error: translateAuthError(error.message, "sign-up") };
  }

  const userId = data.user?.id;
  if (!userId) return { error: "Не удалось создать пользователя." };

  TelegramService.notifyAdminsSafe("user.created", {
    userId,
    phone: params.phoneE164,
    method: "sms",
    name: meta?.full_name,
  });

  return { email, userId, created: true };
}

export async function establishPhoneAuthSession(
  email: string,
  request: Request,
  userId?: string,
  registration?: RegistrationMetadata,
  phoneE164?: string,
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

  if (userId && registration?.full_name) {
    await applyRegistrationMetadataAdmin(
      admin,
      userId,
      registration,
      phoneE164 ? { phone_e164: phoneE164, ...phoneVerifiedMetadataPatch() } : phoneVerifiedMetadataPatch(),
    );
  }

  const { data: sessionData } = await client.supabase.auth.getSession();
  const wantsMobileSession = request.headers.get("x-sonogyn-client") === "mobile";

  if (wantsMobileSession && sessionData.session) {
    const exchangeCode = await createMobileSessionExchange({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    });
    return NextResponse.json({ ok: true, exchangeCode });
  }

  return nextJsonWithAuthCookies({ ok: true }, client.cookiesToSet);
}
