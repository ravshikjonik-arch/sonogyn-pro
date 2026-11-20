/**
 * App Store release flags — free download forever; open pilot until 27.12.2026;
 * PRO subscription (RevenueCat / StoreKit) from that date.
 * Keep product ids in sync with App Store Connect.
 */

/** UTC midnight 27.12.2026 — same as web `PLATFORM_LAUNCH_AT_MS`. */
export const PLATFORM_LAUNCH_AT_MS = Date.UTC(2026, 11, 27, 0, 0, 0);

export const PLATFORM_LAUNCH_DATE_RU = "27.12.2026";

/** App Store Connect / RevenueCat product id for monthly PRO. */
export const IOS_PRO_MONTHLY_PRODUCT_ID = "sonogyn_pro_monthly";

export function isBeforePlatformLaunch(nowMs: number = Date.now()): boolean {
  return nowMs < PLATFORM_LAUNCH_AT_MS;
}

function envTruthy(raw: string | undefined, defaultTrue: boolean): boolean {
  const value = (raw ?? (defaultTrue ? "true" : "false")).trim().toLowerCase();
  return ["true", "1", "yes"].includes(value);
}

/**
 * Open pilot: free clinical tools without IAP.
 * Ends automatically on 27.12.2026 unless EXPO_PUBLIC_OPEN_ACCESS_FORCE=true.
 */
export function isOpenAccessPilot(nowMs: number = Date.now()): boolean {
  if (!isBeforePlatformLaunch(nowMs)) {
    return envTruthy(process.env.EXPO_PUBLIC_OPEN_ACCESS_FORCE, false);
  }
  return envTruthy(process.env.EXPO_PUBLIC_OPEN_ACCESS_FULL, true);
}

/**
 * Show StoreKit / RevenueCat paywall when pilot is over and RC iOS key is configured.
 */
export function isIapEnabled(nowMs: number = Date.now()): boolean {
  if (isOpenAccessPilot(nowMs)) return false;
  const iosKey = (process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? "").trim();
  return iosKey.length > 0;
}

export const STORE_SUPPORT_EMAIL = "Sonogyn-pro@mail.ru";
export const STORE_SUPPORT_MAILTO = `mailto:${STORE_SUPPORT_EMAIL}?subject=${encodeURIComponent("SonoGyn Pro — поддержка / жалоба")}`;
