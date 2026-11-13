/** Cookie / analytics consent (152-ФЗ). Necessary session cookies are always allowed. */

import { isMarketingAnalyticsConfigured } from "@/lib/analytics/config";

export const ANALYTICS_CONSENT_KEY = "sonogyn_analytics_consent";
export const ANALYTICS_CONSENT_EVENT = "sonogyn-analytics-consent";
export const ANALYTICS_CONSENT_REOPEN_EVENT = "sonogyn-analytics-consent-reopen";

export type AnalyticsConsent = "granted" | "denied";

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (v === "granted" || v === "denied") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeAnalyticsConsent(value: AnalyticsConsent): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: { value } }));
  } catch {
    /* ignore */
  }
}

/** Показать баннер снова («Настройки cookie» в футере). */
export function requestAnalyticsConsentReopen(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(ANALYTICS_CONSENT_REOPEN_EVENT));
  } catch {
    /* ignore */
  }
}

export function isFirebaseAnalyticsConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  );
}

/** Баннер нужен, если есть YM / GA / Firebase и выбор ещё не сделан. */
export function shouldOfferAnalyticsConsent(): boolean {
  return isMarketingAnalyticsConfigured();
}

export function hasAnalyticsConsentGranted(): boolean {
  return readAnalyticsConsent() === "granted";
}

/** Fire-and-forget audit в `analytics_events` (без ПДн). */
export function persistAnalyticsConsentAudit(value: AnalyticsConsent): void {
  if (typeof window === "undefined") return;
  void fetch("/api/analytics/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
    keepalive: true,
  }).catch(() => undefined);
}
