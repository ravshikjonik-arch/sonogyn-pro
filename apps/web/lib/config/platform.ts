/**
 * Единый источник правды: маркетинг, open access, тарифы (витрина), мобильные сторы.
 * Серверная цена PRO: `readDefaultProPriceRub()` в `@/lib/payment/config` (env YOOKASSA_PRO_PRICE_RUB).
 */

export type PayProviderId = "yookassa" | "stripe";

/** Основной эквайринг для РФ — публичные тексты и /paywall при настроенной ЮKassa. */
export const PAY_PROVIDER_PRIMARY: PayProviderId = "yookassa";

/**
 * Stripe остаётся в коде (`/api/stripe/*`, Checkout, webhooks).
 * Публичный fallback — только если ЮKassa не сконфигурирована на окружении.
 */
export const PAY_PROVIDER_FALLBACK: PayProviderId = "stripe";

export const PAY_PROVIDER_FALLBACK_ENABLED = true;

export const PRO_SUBSCRIPTION_PERIOD_DAYS = 30;

/** Дефолт витрины / клиента, если server env недоступен. Совпадает с Vercel `YOOKASSA_PRO_PRICE_RUB`. */
export const DEFAULT_PRO_PRICE_RUB = 500;

/** Год вперёд — цена появится, когда зададите `YOOKASSA_PRO_YEAR_PRICE_RUB` и скажете сумму. */
export const PRO_YEAR_COMING_SOON_RU = "Год вперёд — скоро (цену сообщим отдельно)";

export const PAYMENT_PROVIDER_PUBLIC_NAME_RU = "ЮKassa";

export const OPEN_ACCESS_DEMO_OFFER_RU =
  "Скачивание и установка бесплатны. До 27.12.2026 — открытый пилот: калькуляторы и кабинет без подписки. С 27.12.2026 — платная подписка PRO.";

export const OPEN_ACCESS_DEMO_DETAIL_RU =
  "ИИ-разбор, чат коллег и облачное сохранение — после входа. " + OPEN_ACCESS_DEMO_OFFER_RU;

export const OPEN_ACCESS_DEMO_FOOTNOTE_RU =
  "До 27.12.2026: не вводите персональные и медицинские данные пациентов. С 27.12.2026 PRO оформляется отдельно (web — ЮKassa, iOS — подписка App Store).";

/** Доля оплаты PRO, направляемая на благотворительность (публичная коммуникация). */
export const PRO_CHARITY_SHARE_PERCENT = 20;

export const PRO_CHARITY_NOTE_RU =
  `${PRO_CHARITY_SHARE_PERCENT}% от суммы оплаты PRO направляется в фонд помощи детям-сиротам. Отчёт о перечислениях публикуем каждый месяц.`;

export const MOBILE_ANDROID_STATUS_RU = "Android — скоро в RuStore";
/** После Submit for Review; после approve заменить на «iOS — в App Store». */
export const MOBILE_IOS_STATUS_RU = "iOS — на проверке в App Store (1.0.4)";

export const MOBILE_STORE_LINE_RU = `Сайт и PWA на рабочем столе; ${MOBILE_ANDROID_STATUS_RU}; ${MOBILE_IOS_STATUS_RU}.`;

export const CDS_DISCLAIMER_RU =
  "Справочная информация (CDS). Не является медицинским диагнозом; интерпретация — лечащий специалист. Установка бесплатна; PRO с 27.12.2026.";

export const SUPPORT_EMAIL = "support@sonogyn-pro.ru";

export const PWA_INSTALL_HINT_RU =
  "PWA: установка через браузер («На экран Домой»). Офлайн: калькуляторы и локальная история; чат и кейсы — только онлайн.";

export const STRIPE_FALLBACK_PUBLIC_NAME = "Stripe";

export function formatProPriceRub(amount = DEFAULT_PRO_PRICE_RUB): string {
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

export function formatProPriceLabelRub(amount = DEFAULT_PRO_PRICE_RUB): string {
  return `от ${formatProPriceRub(amount)}`;
}

export function proSubscriptionPeriodLabelRu(): string {
  return `${PRO_SUBSCRIPTION_PERIOD_DAYS} дней`;
}
