import type { SupabaseClient, User } from "@supabase/supabase-js";

import { resolveAppOrigin } from "@/lib/auth/app-origin";
import { buildOAuthRedirect } from "@/lib/auth/oauth-providers";
import { safeLog } from "@/lib/security/safeLog";

/** Redirect URL for Supabase email confirm / magic link (must be in Supabase Redirect URLs). */
export function resolveEmailConfirmRedirect(request: Request, nextPath = "/app"): string {
  const origin = resolveAppOrigin(request);
  return buildOAuthRedirect(origin, nextPath);
}

/** Supabase returns user with empty identities when email is already registered (no error). */
export function isDuplicateEmailSignUp(user: User | null | undefined): boolean {
  if (!user) return false;
  return (user.identities?.length ?? 0) === 0;
}

export async function resendSignupConfirmation(
  supabase: SupabaseClient,
  email: string,
  emailRedirectTo: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
  });

  if (error) {
    safeLog("auth:resend-confirmation-failed", {
      message: error.message,
      redirectTo: emailRedirectTo,
    });
    return { ok: false, error: error.message };
  }

  safeLog("auth:resend-confirmation-ok", { redirectTo: emailRedirectTo });
  return { ok: true };
}
