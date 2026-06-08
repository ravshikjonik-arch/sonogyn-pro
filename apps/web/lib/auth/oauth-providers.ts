import type { Provider } from "@supabase/supabase-js";

import type { AuthProvider } from "@repo/ui";

const OAUTH_MAP: Record<Exclude<AuthProvider, "telegram">, Provider> = {
  google: "google",
  vk: "vk" as Provider,
  yandex: "yandex" as Provider,
};

export function oauthProviderToSupabase(provider: Exclude<AuthProvider, "telegram">): Provider {
  return OAUTH_MAP[provider];
}

export function buildOAuthRedirect(origin: string, nextPath: string): string {
  return `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
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
