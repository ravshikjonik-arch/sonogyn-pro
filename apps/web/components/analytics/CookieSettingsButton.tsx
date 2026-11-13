"use client";

import { requestAnalyticsConsentReopen, shouldOfferAnalyticsConsent } from "@/lib/privacy/analytics-consent";

/** Ссылка «Настройки cookie» в футере. */
export function CookieSettingsButton() {
  if (!shouldOfferAnalyticsConsent()) return null;

  return (
    <button
      type="button"
      className="hover:text-[var(--clinical-primary-deep)]"
      onClick={() => requestAnalyticsConsentReopen()}
    >
      Настройки cookie
    </button>
  );
}
