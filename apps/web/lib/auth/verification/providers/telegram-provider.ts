import { withTimeout } from "../with-timeout";

export type TelegramSendResult =
  | { ok: true }
  | { ok: false; errorCode: string; botNotStarted?: boolean };

export class TelegramNotReadyError extends Error {
  constructor() {
    super("TELEGRAM_NOT_READY");
    this.name = "TelegramNotReadyError";
  }
}

const TELEGRAM_TIMEOUT_MS = 8_000;

function botToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() ?? null;
}

/**
 * getChat перед отправкой — пользователь должен нажать /start у бота.
 * Ошибки «chat not found» / «bot was blocked» → TELEGRAM_NOT_READY.
 */
export async function assertTelegramChatReady(chatId: string): Promise<void> {
  const token = botToken();
  if (!token) {
    throw new Error("TELEGRAM_NOT_CONFIGURED");
  }

  const url = `https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId)}`;
  const res = await fetch(url, { method: "GET" });
  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    description?: string;
  } | null;

  if (json?.ok) return;

  const desc = json?.description ?? "";
  if (/bot was blocked|chat not found|user is deactivated|need administrator rights/i.test(desc)) {
    throw new TelegramNotReadyError();
  }

  if (res.status >= 500) {
    throw new Error("TELEGRAM_PROVIDER_5XX");
  }

  throw new Error("TELEGRAM_GET_CHAT_FAILED");
}

async function sendVerificationTelegramInner(params: {
  chatId: string;
  code: string;
}): Promise<TelegramSendResult> {
  const token = botToken();
  if (!token) {
    return { ok: false, errorCode: "telegram_not_configured" };
  }

  await assertTelegramChatReady(params.chatId);

  const text = [
    "🔐 SonoGyn Pro",
    "",
    `Код подтверждения: ${params.code}`,
    "",
    "Действует 5 минут.",
  ].join("\n");

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: params.chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    description?: string;
  } | null;

  if (json?.ok) return { ok: true };

  const desc = json?.description ?? "";
  const botNotStarted =
    /bot was blocked|chat not found|user is deactivated|need administrator rights/i.test(desc);

  if (botNotStarted) {
    return { ok: false, errorCode: "telegram_bot_not_started", botNotStarted: true };
  }

  if (res.status >= 500) return { ok: false, errorCode: "telegram_provider_5xx" };
  return { ok: false, errorCode: "telegram_send_failed" };
}

/** Telegram Bot API, таймаут 8 с + проверка getChat. */
export async function sendVerificationTelegram(params: {
  chatId: string;
  code: string;
}): Promise<TelegramSendResult> {
  try {
    return await withTimeout(
      sendVerificationTelegramInner(params),
      TELEGRAM_TIMEOUT_MS,
      "telegram",
    );
  } catch (e) {
    if (e instanceof TelegramNotReadyError) {
      throw e;
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("timeout")) {
      throw e;
    }
    return { ok: false, errorCode: "telegram_send_failed" };
  }
}

/** @deprecated используйте assertTelegramChatReady */
export async function isTelegramChatReachable(chatId: string): Promise<boolean> {
  try {
    await assertTelegramChatReady(chatId);
    return true;
  } catch {
    return false;
  }
}
