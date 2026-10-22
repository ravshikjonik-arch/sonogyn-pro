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

/** Дефолт витрины, если env недоступен (клиентские компоненты). */
export const DEFAULT_PRO_PRICE_RUB = 990;

export const PAYMENT_PROVIDER_PUBLIC_NAME_RU = "ЮKassa";

export const OPEN_ACCESS_DEMO_OFFER_RU =
  "Кабинет доступен без регистрации в демо-режиме: калькуляторы, справочники и открытые материалы.";

export const OPEN_ACCESS_DEMO_DETAIL_RU =
  "ИИ-разбор, чат коллег и облачное сохранение — после входа. " + OPEN_ACCESS_DEMO_OFFER_RU;

export const OPEN_ACCESS_DEMO_FOOTNOTE_RU =
  "Не вводите персональные и медицинские данные пациентов. Личный профиль и PRO — после регистрации.";

export const MOBILE_ANDROID_STATUS_RU = "Android — скоро в RuStore";
export const MOBILE_IOS_STATUS_RU = "iOS — в разработке";

export const MOBILE_STORE_LINE_RU = `Сайт и PWA на рабочем столе; ${MOBILE_ANDROID_STATUS_RU}; ${MOBILE_IOS_STATUS_RU}.`;

export const CDS_DISCLAIMER_RU =
  "Справочная информация (CDS). Не является медицинским диагнозом; интерпретация — лечащий специалист.";

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
