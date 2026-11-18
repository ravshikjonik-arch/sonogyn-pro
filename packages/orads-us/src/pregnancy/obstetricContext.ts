/**
 * Акушерский контекст Pregnancy Mode (этап B).
 * Триместр: как в prenatal-guided-protocol — <14 / 14–27 / ≥28 нед.
 */

export type PregnancyTrimester = 1 | 2 | 3;

export type TriState = "yes" | "no" | "unknown";

export type SizeDynamics =
  | "unknown"
  | "not_applicable"
  | "increased"
  | "decreased"
  | "stable";

export type MorphologyDynamics =
  | "unknown"
  | "not_applicable"
  | "unchanged"
  | "changed";

export type PregnancyObstetricContext = {
  /** Полные акушерские недели (0–42). */
  gestationalWeeks: number | null;
  /** Дни сверх недель (0–6). */
  gestationalDays: number | null;
  /** Срок обнаружения образования (недели), опционально. */
  discoveryGestationalWeeks: number | null;
  priorUltrasound: TriState;
  sizeDynamics: SizeDynamics;
  morphologyDynamics: MorphologyDynamics;
  clinicalSymptoms: TriState;
  pain: TriState;
  torsionSuspect: TriState;
  ruptureSuspect: TriState;
};

export const initialPregnancyObstetricContext: PregnancyObstetricContext = {
  gestationalWeeks: null,
  gestationalDays: null,
  discoveryGestationalWeeks: null,
  priorUltrasound: "unknown",
  sizeDynamics: "unknown",
  morphologyDynamics: "unknown",
  clinicalSymptoms: "unknown",
  pain: "unknown",
  torsionSuspect: "unknown",
  ruptureSuspect: "unknown",
};

/** Нормализация дней 0–6; недели 0–45 (верх — мягкий потолок для UI). */
export function clampGestationalParts(
  weeks: number | null,
  days: number | null,
): { weeks: number | null; days: number | null } {
  if (weeks == null || !Number.isFinite(weeks)) {
    return { weeks: null, days: days == null || !Number.isFinite(days) ? null : clampInt(days, 0, 6) };
  }
  const w = clampInt(weeks, 0, 45);
  const d = days == null || !Number.isFinite(days) ? 0 : clampInt(days, 0, 6);
  return { weeks: w, days: d };
}

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Автотриместр по сроку (недели + дни → суммарные дни, пороги в полных неделях).
 * I: &lt; 14+0 · II: 14+0–27+6 · III: ≥ 28+0
 */
export function derivePregnancyTrimester(
  weeks: number | null,
  days: number | null = 0,
): PregnancyTrimester | null {
  const { weeks: w, days: d } = clampGestationalParts(weeks, days ?? 0);
  if (w == null) return null;
  const totalDays = w * 7 + (d ?? 0);
  if (totalDays < 14 * 7) return 1;
  if (totalDays < 28 * 7) return 2;
  return 3;
}

export function formatGestationalAgeRu(
  weeks: number | null,
  days: number | null,
): string | null {
  const { weeks: w, days: d } = clampGestationalParts(weeks, days);
  if (w == null) return null;
  const dayPart = d ?? 0;
  return `${w}+${dayPart} нед.`;
}

export function pregnancyTrimesterLabelRu(t: PregnancyTrimester | null): string | null {
  if (t === 1) return "I триместр";
  if (t === 2) return "II триместр";
  if (t === 3) return "III триместр";
  return null;
}

export function resolveObstetricSummary(ctx: PregnancyObstetricContext): {
  trimester: PregnancyTrimester | null;
  gaLabel: string | null;
  trimesterLabel: string | null;
} {
  const trimester = derivePregnancyTrimester(ctx.gestationalWeeks, ctx.gestationalDays);
  return {
    trimester,
    gaLabel: formatGestationalAgeRu(ctx.gestationalWeeks, ctx.gestationalDays),
    trimesterLabel: pregnancyTrimesterLabelRu(trimester),
  };
}
