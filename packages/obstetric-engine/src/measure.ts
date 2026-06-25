import { calculateExpectedValue } from "@repo/fmf";
import {
  buildPercentileBand,
  calculateGrowthVelocity,
  calculateMoM,
  percentileFromZ,
  zScoreFromValue,
} from "@repo/fmf";
import type { PercentileFlag } from "@repo/fmf";

import type { ObstetricMeasurementResult, ReferenceCurveJson } from "./types";

export function gaWeeksDecimal(weeks: number, days = 0): number {
  return weeks + days / 7;
}

export function gaDaysTotal(weeks: number, days = 0): number {
  return weeks * 7 + days;
}

function flagFromPercentile(p: number): PercentileFlag {
  if (p <= 3) return "critical_low";
  if (p <= 5) return "low";
  if (p >= 97) return "critical_high";
  if (p >= 95) return "high";
  return "normal";
}

function formatNum(n: number, unit: string): string {
  if (unit === "g") return String(Math.round(n));
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

function interpretPercentile(
  labelRu: string,
  value: number,
  unit: string,
  percentile: number,
  flag: PercentileFlag,
): string {
  const val = `${formatNum(value, unit)} ${unit}`;
  if (flag === "critical_low" || flag === "low") {
    return `${labelRu} ${val} — ниже нормы (~${percentile}-й перц.). Не диагноз; интерпретация — специалист.`;
  }
  if (flag === "critical_high" || flag === "high") {
    return `${labelRu} ${val} — выше нормы (~${percentile}-й перц.). Не диагноз; интерпретация — специалист.`;
  }
  return `${labelRu} ${val} — в пределах референса (~${percentile}-й перц.).`;
}

/** Оценка одного параметра по JSON-кривой mean/SD + интерполяция. */
export function assessCurveMeasurement(params: {
  curve: ReferenceCurveJson;
  value: number;
  gaWeeksDecimal: number;
  priorValue?: number;
  priorGaWeeksDecimal?: number;
}): ObstetricMeasurementResult | null {
  const anchors = params.curve.model?.anchors;
  if (!anchors?.length || !Number.isFinite(params.value)) return null;

  const stats = calculateExpectedValue(anchors, params.gaWeeksDecimal);
  const unit = params.curve.unit ?? "mm";

  if (!stats) {
    return {
      parameterId: params.curve.id,
      labelRu: params.curve.labelRu,
      value: params.value,
      expected: NaN,
      sd: NaN,
      percentile: NaN,
      zScore: NaN,
      mom: NaN,
      interpretation: `${params.curve.labelRu}: срок ${params.gaWeeksDecimal.toFixed(1)} нед вне диапазона кривой.`,
      source: params.curve.source,
      engine: "medvedev",
      flag: "out_of_range",
      unit,
    };
  }

  const z = zScoreFromValue(params.value, stats.expected, stats.sd);
  const percentile = percentileFromZ(z);
  const mom = calculateMoM(params.value, stats.expected);
  const flag = flagFromPercentile(percentile);
  const band = buildPercentileBand(stats.expected, stats.sd);

  let growthVelocityMmPerDay: number | undefined;
  if (params.priorValue != null && params.priorGaWeeksDecimal != null) {
    growthVelocityMmPerDay = calculateGrowthVelocity(
      params.value,
      params.priorValue,
      gaDaysTotal(Math.floor(params.gaWeeksDecimal), Math.round((params.gaWeeksDecimal % 1) * 7)),
      gaDaysTotal(
        Math.floor(params.priorGaWeeksDecimal),
        Math.round((params.priorGaWeeksDecimal % 1) * 7),
      ),
    );
  }

  let gestationalEquivalentWeeks: number | undefined;
  if (params.curve.supportsGaFromValue) {
    gestationalEquivalentWeeks = estimateGaFromValue(anchors, params.value) ?? undefined;
  }

  let interpretation = interpretPercentile(params.curve.labelRu, params.value, unit, percentile, flag);
  if (growthVelocityMmPerDay != null) {
    interpretation += ` Скорость роста ${growthVelocityMmPerDay} ${unit}/сут.`;
  }
  if (gestationalEquivalentWeeks != null) {
    interpretation += ` GA-эквивалент ~${gestationalEquivalentWeeks.toFixed(1)} нед.`;
  }

  return {
    parameterId: params.curve.id,
    labelRu: params.curve.labelRu,
    value: params.value,
    expected: stats.expected,
    sd: stats.sd,
    percentile,
    zScore: Math.round(z * 100) / 100,
    mom,
    gestationalEquivalentWeeks,
    growthVelocityMmPerDay,
    interpretation,
    source: params.curve.source,
    engine: "medvedev",
    band,
    flag,
    unit,
  };
}

/** Бинарный поиск GA, при котором expected ≈ value (для biometry). */
export function estimateGaFromValue(
  anchors: NonNullable<ReferenceCurveJson["model"]>["anchors"],
  value: number,
): number | null {
  if (!anchors.length) return null;
  const minW = anchors[0]!.gaWeeks ?? 0;
  const maxW = anchors[anchors.length - 1]!.gaWeeks ?? 40;
  let lo = minW;
  let hi = maxW;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const stats = calculateExpectedValue(anchors, mid);
    if (!stats) return null;
    if (Math.abs(stats.expected - value) < 0.05) return Math.round(mid * 10) / 10;
    if (stats.expected < value) lo = mid;
    else hi = mid;
  }
  return Math.round(((lo + hi) / 2) * 10) / 10;
}
