import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useCallback } from "react";
import type { Provider } from "@supabase/supabase-js";
import type { AuthProvider } from "@repo/ui";

import { supabaseMobile } from "../lib/supabase/mobileClient";

WebBrowser.maybeCompleteAuthSession();

const AUTH_SCHEME = process.env.EXPO_PUBLIC_AUTH_REDIRECT_SCHEME || "com.yakrav7700.usriskcalc";

const OAUTH_MAP: Record<Exclude<AuthProvider, "telegram">, Provider> = {
  google: "google",
  vk: "vk" as Provider,
  yandex: "yandex" as Provider,
};

function redirectUri(): string {
  return Linking.createURL("auth/callback", { scheme: AUTH_SCHEME });
}

function translateOAuthError(message: string): string {
  if (/provider.*not enabled|oauth/i.test(message)) {
    return "Провайдер не включён в Supabase Dashboard.";
  }
  if (/invalid login credentials|user not found/i.test(message)) {
    return "Неверные учётные данные.";
  }
  return "Не удалось войти. Попробуйте снова или используйте email.";
}

export function useVkAuth() {
  const signInWithVk = useCallback(async () => {
    return signInWithOAuthProvider("vk");
  }, []);

  return { signInWithVk, redirectUri: redirectUri() };
}

export async function signInWithOAuthProvider(provider: Exclude<AuthProvider, "telegram">): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!supabaseMobile) {
    return { ok: false, error: "Supabase не настроен." };
  }

  const redirectTo = redirectUri();
  const { data, error } = await supabaseMobile.auth.signInWithOAuth({
    provider: OAUTH_MAP[provider],
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { ok: false, error: translateOAuthError(error.message) };
  }

  if (!data?.url) {
    return { ok: false, error: "Supabase не вернул URL авторизации." };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success" || !result.url) {
    return { ok: false, error: "Авторизация отменена." };
  }

  const parsed = Linking.parse(result.url);
  const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;
  if (!code) {
    return { ok: false, error: "Не получен код авторизации." };
  }

  const { error: exchangeError } = await supabaseMobile.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return { ok: false, error: translateOAuthError(exchangeError.message) };
  }

  return { ok: true };
}

export function useOAuthSignIn() {
  const signIn = useCallback(async (provider: Exclude<AuthProvider, "telegram">) => {
    return signInWithOAuthProvider(provider);
  }, []);

  return { signIn, redirectUri: redirectUri() };
}
