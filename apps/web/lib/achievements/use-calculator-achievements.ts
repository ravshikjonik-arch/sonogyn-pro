"use client";

import { useEffect, useRef } from "react";

import { reportAchievementCheck } from "@/hooks/useAchievements";

/** IOTA Simple Rules / консенсус — засчитываем интерпретацию при однозначном вердикте */
export function useIotaInterpretationAchievement(verdict: "benign" | "malignant" | "inconclusive" | string) {
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    if (verdict === "inconclusive" || !verdict) return;
    const key = `${verdict}`;
    if (lastRef.current === key) return;
    lastRef.current = key;

    void reportAchievementCheck({
      eventType: "interpretation",
      moduleId: "iota",
      correct: verdict === "benign" || verdict === "malignant",
    });
  }, [verdict]);
}

const FMF_SECTION_TOTAL = 7;

type FmfSectionFlags = {
  early: boolean;
  first: boolean;
  second: boolean;
  third: boolean;
  doppler: boolean;
  cervix: boolean;
  scar: boolean;
};

/** FMF — прогресс по заполненным разделам (100% → бейдж FMF Мастер) */
export function useFmfModuleProgress(flags: FmfSectionFlags) {
  const lastCountRef = useRef(-1);

  useEffect(() => {
    const completed = Object.values(flags).filter(Boolean).length;
    if (completed === lastCountRef.current) return;
    lastCountRef.current = completed;

    void reportAchievementCheck({
      eventType: "module_progress",
      moduleId: "fmf",
      fmfCompleted: completed,
      fmfTotal: FMF_SECTION_TOTAL,
    });
  }, [flags.early, flags.first, flags.second, flags.third, flags.doppler, flags.cervix, flags.scar]);
}

export function assistantOutputComplete(conclusion?: string | null, hasInput?: boolean): boolean {
  return Boolean(hasInput && conclusion && conclusion.trim().length > 8);
}
