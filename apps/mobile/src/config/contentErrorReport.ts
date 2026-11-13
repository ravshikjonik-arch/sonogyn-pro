/** Обратная связь по ошибкам контента → личный Telegram фаундера (не канал). */
export const CONTENT_ERROR_REPORT = {
  labelRu: "Нашли ошибку?",
  ctaRu: "Сообщите в Telegram",
  handle: "@Yakrav7700",
  url: "https://t.me/Yakrav7700",
  domain: "Yakrav7700",
  vpnHintRu:
    "Telegram и t.me часто недоступны в РФ без VPN.\n\n" +
    "• Включите VPN и повторите\n" +
    "• Или откройте чат в приложении Telegram: @Yakrav7700\n" +
    "• Без данных пациентов в сообщении",
} as const;

export function buildContentErrorReportUrl(pageHint?: string): string {
  const text = [
    "Здравствуйте! Нашёл ошибку в SonoGyn Pro (mobile).",
    pageHint ? `Экран: ${pageHint}` : null,
    "Описание ошибки:",
  ]
    .filter(Boolean)
    .join("\n");
  return `${CONTENT_ERROR_REPORT.url}?text=${encodeURIComponent(text)}`;
}
