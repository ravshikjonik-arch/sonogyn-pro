/** Имя бота для Login Widget (server-side). */
import { fetchWithRetry } from "@/lib/http/fetch-with-retry";

export function readTelegramBotUsername(): string {
  const fromPublic = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();
  const fromServer = process.env.TELEGRAM_BOT_USERNAME?.trim();
  return (fromPublic ?? fromServer ?? "").replace(/^@/, "");
}

export function readTelegramBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token || null;
}

/** Числовой bot_id для oauth.telegram.org/auth (кэш на процесс). */
let cachedBotId: string | null | undefined;

export async function resolveTelegramBotId(): Promise<string | null> {
  if (cachedBotId !== undefined) return cachedBotId;
  const token = readTelegramBotToken();
  if (!token) {
    cachedBotId = null;
    return null;
  }
  try {
    const res = await fetchWithRetry(`https://api.telegram.org/bot${token}/getMe`, { cache: "no-store" });
    const json = (await res.json()) as { ok?: boolean; result?: { id?: number } };
    cachedBotId = json.ok && json.result?.id ? String(json.result.id) : null;
  } catch {
    cachedBotId = null;
  }
  return cachedBotId;
}

export function buildTelegramOAuthUrl(params: {
  origin: string;
  returnTo: string;
  botId: string;
}): string {
  const qs = new URLSearchParams({
    bot_id: params.botId,
    origin: params.origin,
    request_access: "write",
    return_to: params.returnTo,
  });
  return `https://oauth.telegram.org/auth?${qs.toString()}`;
}
