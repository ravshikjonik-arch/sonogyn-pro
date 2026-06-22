import type { User } from "@supabase/supabase-js";

import { PHONE_OTP_SENT_MSG } from "@/lib/auth/safe-auth-messages";
import { phoneVerifiedMetadataPatch } from "@/lib/auth/phone-verified";
import { findUserByPhoneE164 } from "@/lib/auth/phone-custom-auth";
import { runVerificationFallbackChain } from "@/lib/auth/verification/fallback-handler";
import { verifyStoredCode } from "@/lib/auth/verification/code-store";
import { shouldExposeDevSmsOtp } from "@/lib/auth/dev-sms";
import { isCustomSmsAuthEnabled } from "@/lib/auth/sms-providers";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { logError } from "@/services/logger";

/** Отправка OTP для привязки телефона к уже авторизованному аккаунту. */
export async function sendLinkPhoneOtp(params: {
  user: User;
  phoneE164: string;
  idempotencyKey?: string | null;
}): Promise<
  | { ok: true; message: string; devOtp?: string }
  | { ok: false; error: string; retryAfterSec?: number; status?: number }
> {
  if (!isCustomSmsAuthEnabled()) {
    return {
      ok: false,
      error: "Привязка телефона доступна при SMS_PROVIDER=smsru (или mock в dev).",
      status: 503,
    };
  }

  const admin = createServiceRoleClient();
  const existing = await findUserByPhoneE164(admin, params.phoneE164);
  if (existing && existing.id !== params.user.id) {
    return { ok: false, error: "Этот номер уже привязан к другому аккаунту.", status: 409 };
  }

  const fb = await runVerificationFallbackChain({
    primaryMethod: "sms",
    contact: params.phoneE164,
    purpose: "link_phone",
    idempotencyKey: params.idempotencyKey,
  });

  if (!fb.ok) {
    return {
      ok: false,
      error: fb.message ?? "Не удалось отправить SMS.",
      status: 502,
    };
  }

  return {
    ok: true,
    message: fb.message ?? PHONE_OTP_SENT_MSG,
    ...(shouldExposeDevSmsOtp() && fb.devOtp ? { devOtp: fb.devOtp } : {}),
  };
}

/** Подтверждение OTP и запись phone_verified в профиль. */
export async function verifyLinkPhoneOtp(params: {
  user: User;
  phoneE164: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  const codeOk = await verifyStoredCode({
    purpose: "link_phone",
    contact: params.phoneE164,
    code: params.code.trim(),
  });

  if (!codeOk) {
    return { ok: false, error: "Неверный или просроченный код.", status: 401 };
  }

  const admin = createServiceRoleClient();
  const existing = await findUserByPhoneE164(admin, params.phoneE164);
  if (existing && existing.id !== params.user.id) {
    return { ok: false, error: "Этот номер уже используется.", status: 409 };
  }

  const meta = params.user.user_metadata ?? {};
  const patch = {
    ...meta,
    ...phoneVerifiedMetadataPatch(),
    phone_e164: params.phoneE164,
  };

  const { error } = await admin.auth.admin.updateUserById(params.user.id, {
    phone: params.phoneE164,
    phone_confirm: true,
    user_metadata: patch,
  });

  if (error) {
    logError("link-phone: updateUserById failed", error, { userId: params.user.id });
    return { ok: false, error: "Не удалось сохранить номер.", status: 500 };
  }

  await admin
    .from("profiles")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", params.user.id)
    .then(() => undefined);

  return { ok: true };
}
