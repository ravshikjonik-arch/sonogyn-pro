import type { LnRadsInput, LnSizeAnalysis } from "../types";

export function analyzeSize(input: Pick<LnRadsInput, "longAxisMm" | "shortAxisMm">): LnSizeAnalysis {
  const { longAxisMm, shortAxisMm } = input;
  const lsRatio = shortAxisMm > 0 ? longAxisMm / shortAxisMm : null;

  if (lsRatio === null) {
    return {
      longAxisMm,
      shortAxisMm,
      lsRatio: null,
      interpretation: "Недостаточно данных для расчёта L/S",
      riskContribution: "intermediate",
      teachingNote: "Измеряйте long axis по longest diameter и short axis перпендикулярно ему.",
    };
  }

  if (lsRatio > 2) {
    return {
      longAxisMm,
      shortAxisMm,
      lsRatio,
      interpretation: "L/S > 2 — типичная доброкачественная морфология",
      riskContribution: "low",
      teachingNote: "Овальная форма с сохранённым hilum — ключевой признак реактивного узла (EFSUMB/WFUMB).",
    };
  }
  if (lsRatio >= 1.5) {
    return {
      longAxisMm,
      shortAxisMm,
      lsRatio,
      interpretation: "L/S 1.5–2 — промежуточная форма",
      riskContribution: "intermediate",
      teachingNote: "Оценивайте в связке с hilum, корой и васкуляризацией; округление — не единственный критерий.",
    };
  }
  if (lsRatio > 1.1) {
    return {
      longAxisMm,
      shortAxisMm,
      lsRatio,
      interpretation: "L/S < 1.5 — подозрительное округление",
      riskContribution: "high",
      teachingNote: "Округлый узел с утратой hilum — высокий риск метастазы (ATA neck, SRU head/neck).",
    };
  }
  return {
    longAxisMm,
    shortAxisMm,
    lsRatio,
    interpretation: "L/S ≈ 1 — округлый узел, высокий риск",
    riskContribution: "high",
    teachingNote: "Почти круглый узел + потеря hilum + peripheral flow → LN-RADS 4–5.",
  };
}

export function sizeScoreContribution(lsRatio: number | null): number {
  if (lsRatio === null) return 0;
  if (lsRatio > 2) return 0;
  if (lsRatio >= 1.5) return 1;
  if (lsRatio > 1.1) return 2;
  return 3;
}
