import { Platform } from "react-native";

export function getChatApiBase(): string {
  return (process.env.EXPO_PUBLIC_CHAT_API_URL || "").replace(/\/$/, "");
}

export type TelegramAuthStart = {
  nonce: string;
  botUrl: string;
  deepLink: string;
};

export type TelegramAuthPoll =
  | { status: "pending" }
  | { status: "ok"; payload: Record<string, unknown>; nonce?: string }
  | { status: "expired" };

export async function apiTelegramAuthStart(): Promise<TelegramAuthStart> {
  const base = getTelegramAuthBase();
  const path = getChatApiBase() ? "/auth/telegram/start" : "/api/auth/telegram/mobile/start";
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "x-sonogyn-client": "mobile" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
  return data as TelegramAuthStart;
}

export async function apiTelegramAuthPoll(nonce: string): Promise<TelegramAuthPoll> {
  const base = getTelegramAuthBase();
  const path = getChatApiBase()
    ? `/auth/telegram/poll/${encodeURIComponent(nonce)}`
    : `/api/auth/telegram/mobile/poll/${encodeURIComponent(nonce)}`;
  const res = await fetch(`${base}${path}`, {
    headers: { "x-sonogyn-client": "mobile" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
  return data as TelegramAuthPoll;
}

const PRODUCTION_WEB_API = "https://sonogyn-pro-web-ravshan-s-projects3.vercel.app";

export function getWebApiBase(): string {
  const configured = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  if (configured) {
    if (Platform.OS !== "web" && /localhost|127\.0\.0\.1/.test(configured)) {
      return PRODUCTION_WEB_API;
    }
    return configured;
  }
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    return Platform.OS === "web" ? "http://localhost:3000" : PRODUCTION_WEB_API;
  }
  return "";
}

/** Telegram deep-link auth: prod → sonogyn-pro.ru; dev may use legacy chat-server. */
function getTelegramAuthBase(): string {
  const legacy = getChatApiBase();
  if (legacy) return legacy;
  const web = getWebApiBase();
  if (!web) {
    throw new Error("Настройте EXPO_PUBLIC_API_BASE_URL для Telegram-входа.");
  }
  return web;
}

/** Static files (echograms, images): sonogyn-pro.ru proxy truncates large bodies, so load them from the deployment host. */
export function getWebAssetBase(): string {
  const base = getWebApiBase();
  return /^https?:\/\/(www\.)?sonogyn-pro\.ru$/i.test(base) ? PRODUCTION_WEB_API : base;
}

export async function apiTelegramSupabaseSession(nonce: string): Promise<{
  access_token: string;
  refresh_token: string;
  email?: string;
}> {
  const base = getTelegramAuthBase();
  const path = getChatApiBase() ? "/auth/telegram/session" : "/api/auth/telegram/mobile/session";
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-sonogyn-client": "mobile" },
    body: JSON.stringify({ nonce }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.session) {
    throw new Error(data.error || `Ошибка ${res.status}`);
  }
  return data.session as { access_token: string; refresh_token: string; email?: string };
}