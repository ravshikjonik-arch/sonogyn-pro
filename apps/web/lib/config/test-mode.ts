/**
 * Единый текст: предзапуск до полной работы платформы.
 * Один глобальный баннер (TestModeBanner) — без дублей в clinical-shell.
 */

/** Дата полного старта (публичная коммуникация). */
export const PLATFORM_LAUNCH_DATE_RU = "27.12.2026";

/**
 * UTC midnight 27.12.2026 — после этой точки open-access пилот заканчивается,
 * PRO становится платным (web ЮKassa / iOS StoreKit).
 */
export const PLATFORM_LAUNCH_AT_MS = Date.UTC(2026, 11, 27, 0, 0, 0);

export function isBeforePlatformLaunch(nowMs: number = Date.now()): boolean {
  return nowMs < PLATFORM_LAUNCH_AT_MS;
}

export const TEST_MODE_SHORT_RU = `Запуск ${PLATFORM_LAUNCH_DATE_RU}`;

/** Единая строка для глобального баннера (коротко, без противоречия «готов» + «тест»). */
export const TEST_MODE_BANNER_RU =
  `Бесплатная установка · открытый пилот до ${PLATFORM_LAUNCH_DATE_RU}. С ${PLATFORM_LAUNCH_DATE_RU} — подписка PRO. Не вводите ПДн пациентов · не диагноз.`;

export const TEST_MODE_FOOTNOTE_RU =
  `SonoGyn Pro: скачивание бесплатно. Полный запуск и PRO с ${PLATFORM_LAUNCH_DATE_RU}. Сейчас можно знакомиться с кабинетом; не вводите персональные и медицинские данные пациентов. Справочно — решение принимает врач.`;
