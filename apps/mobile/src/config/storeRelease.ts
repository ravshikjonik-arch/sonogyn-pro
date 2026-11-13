/**
 * App Store pilot flags — guest access, no IAP until RevenueCat is wired.
 * Keep in sync with eas.json production env (OPEN_ACCESS_FULL=true).
 */

export function isOpenAccessPilot(): boolean {
  const raw = (process.env.EXPO_PUBLIC_OPEN_ACCESS_FULL ?? "").trim().toLowerCase();
  return ["true", "1", "yes"].includes(raw);
}

/** Hide subscriptions / fake paywall prices until RC key + App Store products exist. */
export function isIapEnabled(): boolean {
  if (!isOpenAccessPilot()) {
    const iosKey = (process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? "").trim();
    return iosKey.length > 0;
  }
  return false;
}

export const STORE_SUPPORT_EMAIL = "Sonogyn-pro@mail.ru";
export const STORE_SUPPORT_MAILTO = `mailto:${STORE_SUPPORT_EMAIL}?subject=${encodeURIComponent("SonoGyn Pro — поддержка / жалоба")}`;
