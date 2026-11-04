import type { SupabaseClient } from "@supabase/supabase-js";

import { isDevAuthModeEnabled } from "@/lib/auth/dev-auth-mode";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { safeLog } from "@/lib/security/safeLog";

/**
 * Mail-first: в production email подтверждается письмом, не service-role.
 * Auto-confirm только при явном AUTH_AUTO_CONFIRM_EMAIL=true или локальном DEV_AUTH_MODE.
 */
export function shouldAutoConfirmEmail(): boolean {
  if (process.env.AUTH_AUTO_CONFIRM_EMAIL === "false") return false;

  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  if (!hasServiceRole) return false;

  if (process.env.AUTH_AUTO_CONFIRM_EMAIL === "true") return true;

  // Local/dev convenience — never production unless flag is true.
  return isDevAuthModeEnabled() && process.env.NODE_ENV !== "production";
}

export async function confirmUserEmail(userId: string): Promise<boolean> {
  try {
    const admin = createServiceRoleClient();
    const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (error) {
      safeLog("auth:auto-confirm-update-failed", { message: error.message });
      return false;
    }
    return true;
  } catch (e) {
    safeLog("auth:auto-confirm-update-failed", { message: e instanceof Error ? e.message : String(e) });
    return false;
  }
}

/** Email уже подтверждён в Auth (повторная регистрация → вход / сброс пароля). */
export async function isUserEmailConfirmed(userId: string): Promise<boolean> {
  try {
    const admin = createServiceRoleClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user) return false;
    return Boolean(data.user.email_confirmed_at);
  } catch {
    return false;
  }
}

/**
 * После OTP владение почтой доказано — выставляем пароль из формы регистрации
 * (повторная регистрация / смена пароля через код).
 */
export async function setUserPasswordAfterEmailProof(
  userId: string,
  password: string,
): Promise<boolean> {
  try {
    const admin = createServiceRoleClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) {
      safeLog("auth:set-password-after-otp-failed", { message: error.message });
      return false;
    }
    return true;
  } catch (e) {
    safeLog("auth:set-password-after-otp-failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return false;
  }
}

/** После auto-confirm — вход по паролю и сессия в cookies route handler. */
export async function signInAfterAutoConfirm(
  supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<boolean> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    safeLog("auth:auto-confirm-sign-in-failed", { message: error?.message ?? "no session" });
    return false;
  }
  return true;
}

export async function tryAutoConfirmRegistration(params: {
  supabase: SupabaseClient;
  userId: string;
  email: string;
  password: string;
}): Promise<boolean> {
  if (!shouldAutoConfirmEmail()) return false;
  const confirmed = await confirmUserEmail(params.userId);
  if (!confirmed) return false;
  return signInAfterAutoConfirm(params.supabase, params.email, params.password);
}
