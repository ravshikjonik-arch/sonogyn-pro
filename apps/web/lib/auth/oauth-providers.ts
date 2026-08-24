import type { Provider } from "@supabase/supabase-js";

import type { AuthProvider } from "@repo/ui";

/**
 * Yandex is not a built-in Supabase provider on newer projects —
 * create Custom OAuth provider with identifier `custom:yandex` in Dashboard.
 */
const OAUTH_MAP: Record<Exclude<AuthProvider, "telegram">, Provider> = {
  google: "google",
  vk: "vk" as Provider,
  yandex: "custom:yandex" as Provider,
};

export function oauthProviderToSupabase(provider: Exclude<AuthProvider, "telegram">): Provider {
  return OAUTH_MAP[provider];
}

export function buildOAuthRedirect(origin: string, nextPath: string): string {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL?.trim();
  const callbackUrl =
    configured && configured.includes("://")
      ? configured
      : `${origin}${configured?.startsWith("/") ? configured : "/auth/callback"}`;
  const url = new URL(callbackUrl);
  url.searchParams.set("next", nextPath);
  return url.toString();
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.startsWith("7") && digits.length === 11) {
    return `+${digits}`;
  }
  if (raw.trim().startsWith("+")) {
    return `+${digits}`;
  }
  return raw.trim();
}
