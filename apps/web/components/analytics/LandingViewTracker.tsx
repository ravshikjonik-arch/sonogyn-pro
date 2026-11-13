"use client";

import { useEffect, useRef } from "react";

import { track } from "@/lib/analytics/track";
import {
  ANALYTICS_CONSENT_EVENT,
  hasAnalyticsConsentGranted,
} from "@/lib/privacy/analytics-consent";

const SESSION_KEY = "sonogyn_landing_view_sent";

/** Один landing_view за сессию вкладки (после consent). */
export function LandingViewTracker() {
  const sent = useRef(false);

  useEffect(() => {
    function fireOnce() {
      if (sent.current || !hasAnalyticsConsentGranted()) return;
      try {
        if (sessionStorage.getItem(SESSION_KEY) === "1") {
          sent.current = true;
          return;
        }
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      sent.current = true;
      track({ name: "landing_view" });
    }

    fireOnce();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, fireOnce);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, fireOnce);
  }, []);

  return null;
}
