import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceRoleClient } from "@/utils/supabase/admin";
import { safeLog } from "@/lib/security/safeLog";

/** Подтверждать email на сервере, если есть service role (обход SMTP Supabase). */
export function shouldAutoConfirmEmail(): boolean {
  if (process.env.AUTH_AUTO_CONFIRM_EMAIL === "false") return false;
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
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
