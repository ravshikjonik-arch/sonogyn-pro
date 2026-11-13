"use client";

import { useCallback, useEffect, useState } from "react";

import {
  calculatorAnalyticsIdFromPath,
  trackCalculatorCalc,
} from "@/lib/analytics/track";
import {
  appendCalculatorHistory,
  isCalculatorFavorite,
  toggleCalculatorFavorite,
  type CalcHistoryEntry,
} from "@/lib/calculators/workspace-storage";

export function useCalculatorWorkspace(calculatorId: string) {
  const [favorite, setFavorite] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavorite(isCalculatorFavorite(calculatorId));
    setHydrated(true);
  }, [calculatorId]);

  const toggleFavorite = useCallback(() => {
    const next = toggleCalculatorFavorite(calculatorId);
    setFavorite(next);
  }, [calculatorId]);

  const recordRun = useCallback(
    (entry: Omit<CalcHistoryEntry, "id" | "at" | "calculatorId">) => {
      appendCalculatorHistory({ ...entry, calculatorId });
      const analyticsId = entry.path
        ? calculatorAnalyticsIdFromPath(entry.path)
        : calculatorId;
      trackCalculatorCalc(analyticsId);
    },
    [calculatorId],
  );

  return { favorite, hydrated, toggleFavorite, recordRun };
}
