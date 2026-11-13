/**
 * Куда писать врачу, если нашёл ошибку в контенте / калькуляторе.
 * Личный Telegram фаундера (не канал UltraGyn Analytics).
 */
export const CONTENT_ERROR_REPORT = {
  telegramHandle: "@Yakrav7700",
  telegramUrl: "https://t.me/Yakrav7700",
  labelRu: "Нашли ошибку?",
  ctaRu: "Сообщите — ответим в Telegram",
  vpnHintRu: "В РФ t.me может не открываться без VPN.",
} as const;

/** Ссылка с предзаполненным текстом (страница + просьба описать ошибку). Без ПДн. */
export function buildContentErrorReportHref(pagePath?: string | null): string {
  const path = (pagePath ?? "").trim() || "/";
  const text = [
    "Здравствуйте! Нашёл ошибку в SonoGyn Pro.",
    `Страница: ${path.startsWith("http") ? path : `https://sonogyn-pro.ru${path.startsWith("/") ? path : `/${path}`}`}`,
    "Описание ошибки:",
  ].join("\n");
  return `${CONTENT_ERROR_REPORT.telegramUrl}?text=${encodeURIComponent(text)}`;
}
