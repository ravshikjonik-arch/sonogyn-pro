import { fetchWithRetry } from "@/lib/http/fetch-with-retry";

/** Уведомление администратору в Telegram о успешной оплате. */
export async function notifyPaymentSucceededTelegram(params: {
  userId: string;
  yookassaId: string;
  amountRub: number;
  description?: string | null;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId =
    process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() ||
    process.env.TELEGRAM_PAYMENTS_CHAT_ID?.trim();

  if (!token || !chatId) {
    console.info("[payment/telegram] skip — TELEGRAM_BOT_TOKEN или TELEGRAM_ADMIN_CHAT_ID не заданы");
    return;
  }

  const text = [
    "✅ Оплата ЮKassa",
    `Сумма: ${params.amountRub.toLocaleString("ru-RU")} ₽`,
    `Платёж: ${params.yookassaId}`,
    `Пользователь: ${params.userId}`,
    params.description ? `Описание: ${params.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await fetchWithRetry(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error("[payment/telegram] send failed", err);
  }
}
