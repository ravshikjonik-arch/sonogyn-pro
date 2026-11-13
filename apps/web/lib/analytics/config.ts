/** Публичные ID счётчиков. Без ID скрипт не грузится. */

export function readYandexMetrikaId(): string | null {
  const id = process.env.NEXT_PUBLIC_YM_ID?.trim();
  return id && /^\d+$/.test(id) ? id : null;
}

export function readGaMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA_ID?.trim();
  return id && /^G-[A-Z0-9]+$/i.test(id) ? id : null;
}

export function isYandexMetrikaConfigured(): boolean {
  return Boolean(readYandexMetrikaId());
}

export function isGa4Configured(): boolean {
  return Boolean(readGaMeasurementId());
}

/** Любой маркетинговый счётчик, требующий cookie-consent. */
export function isMarketingAnalyticsConfigured(): boolean {
  return (
    isYandexMetrikaConfigured() ||
    isGa4Configured() ||
    Boolean(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() &&
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
    )
  );
}
