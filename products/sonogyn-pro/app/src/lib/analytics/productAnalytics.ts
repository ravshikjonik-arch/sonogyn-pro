import { Platform } from "react-native";

import type { ProductAnalyticsEvent } from "@repo/types";

/**
 * Firebase Analytics bridge — activates only on Expo web using dynamic imports so native bundles avoid web-only APIs.
 */
export async function logProductAnalyticsMobile(
  name: ProductAnalyticsEvent,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  if (Platform.OS !== "web") {
    if (__DEV__) {
      console.info("[analytics]", name, params ?? {});
    }
    return;
  }

  const cfg = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  if (!cfg.apiKey || !cfg.appId) return;

  const { initializeApp, getApps } = await import("firebase/app");
  const { getAnalytics, isSupported, logEvent } = await import("firebase/analytics");

  const app = getApps().length ? getApps()[0]! : initializeApp(cfg);
  if (!(await isSupported())) return;

  const analytics = getAnalytics(app);
  logEvent(analytics, name, params ?? {});
}
