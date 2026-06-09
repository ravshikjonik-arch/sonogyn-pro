import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { getWebApiBase } from "../../api/chatBackend";

const AUTH_SCHEME = process.env.EXPO_PUBLIC_AUTH_REDIRECT_SCHEME || "com.yakrav7700.usriskcalc";

/**
 * Opens hosted Turnstile page (web app) and returns token via deep link callback.
 */
export async function obtainTurnstileToken(): Promise<string | null> {
  const siteKey = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!siteKey) return null;

  const base = getWebApiBase();
  if (!base) return null;

  const redirectTo = Linking.createURL("auth/turnstile-callback", { scheme: AUTH_SCHEME });
  const pageUrl = `${base.replace(/\/$/, "")}/auth/turnstile?redirect=${encodeURIComponent(redirectTo)}`;

  const result = await WebBrowser.openAuthSessionAsync(pageUrl, redirectTo);
  if (result.type !== "success" || !result.url) return null;

  const parsed = Linking.parse(result.url);
  const tokenRaw = parsed.queryParams?.turnstile_token;
  const token = typeof tokenRaw === "string" ? tokenRaw : Array.isArray(tokenRaw) ? tokenRaw[0] : null;
  return token?.trim() ? token.trim() : null;
}

export function isTurnstileConfiguredOnMobile(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY?.trim() && getWebApiBase());
}
