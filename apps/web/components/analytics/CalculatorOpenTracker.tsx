"use client";

import { useEffect } from "react";

import { track } from "@/lib/analytics/track";
import { hasAnalyticsConsentGranted } from "@/lib/privacy/analytics-consent";

type Props = { id: string };

/** calculator_open при открытии лендинга/калькулятора (только id, без полей формы). */
export function CalculatorOpenTracker({ id }: Props) {
  useEffect(() => {
    if (!id || !hasAnalyticsConsentGranted()) return;
    track({ name: "calculator_open", params: { id } });
  }, [id]);

  return null;
}
