import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent as firebaseLogEvent, type Analytics } from "firebase/analytics";

import type { ProductAnalyticsEvent } from "@repo/types";

let app: FirebaseApp | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (app) return app;
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  if (!cfg.apiKey || !cfg.appId) return null;
  app = getApps().length ? getApps()[0]! : initializeApp(cfg);
  return app;
}

async function getAnalyticsIfSupported(): Promise<Analytics | null> {
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      const fbApp = getFirebaseApp();
      if (!fbApp) return null;
      if (!(await isSupported())) return null;
      return getAnalytics(fbApp);
    })();
  }
  return analyticsPromise;
}

/**
 * Sends a typed product analytics event to Firebase Analytics when configured (web only).
 */
export async function logProductAnalyticsWeb(
  name: ProductAnalyticsEvent,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  const analytics = await getAnalyticsIfSupported();
  if (!analytics) return;
  firebaseLogEvent(analytics, name, params ?? {});
}
