/** Cookie / analytics consent (152-ФЗ). Necessary session cookies are always allowed. */

export const ANALYTICS_CONSENT_KEY = "sonogyn_analytics_consent";

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
}

export function isFirebaseAnalyticsConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  );
}

export function hasAnalyticsConsentGranted(): boolean {
  return readAnalyticsConsent() === "granted";
}
