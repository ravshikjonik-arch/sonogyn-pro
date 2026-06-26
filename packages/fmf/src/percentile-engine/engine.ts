import { getCurve, type CurveId } from "./curves";
import { calculateExpectedValue, calculateLogLinearExpected } from "./interpolation";
import {
  buildPercentileBand,
  calculateGrowthVelocity,
  calculateMap,
  calculateMoM,
  gaDaysFromCrlMm,
  percentileFromZ,
  zScoreFromValue,
} from "./math";
import type { PercentileFlag, PercentileResult, ReferenceCurveJson } from "./types";

export { calculateMoM, calculateMap, calculateGrowthVelocity, gaDaysFromCrlMm };
export { percentileFromZ, zScoreFromValue, buildPercentileBand };

function flagFromPercentile(p: number): PercentileFlag {
  if (p <= 3) return "critical_low";
  if (p <= 5) return "low";
  if (p >= 97) return "critical_high";
  if (p >= 95) return "high";
  return "normal";
}

function formatNum(n: number, unit?: string): string {
  if (unit === "г" || unit === "g") return String(Math.round(n));
  return (Math.round(n * 10) / 10).toFixed(1);
}

function assessAnchorCurve(params: {
  curveId: CurveId;
  value: number;
  x: number;
  growthVelocityMmPerDay?: number;
  clinical?: ReferenceCurveJson["clinical"];
}): PercentileResult | null {
  const curve = getCurve(params.curveId);
  const anchors = curve.model?.anchors;
  if (!anchors?.length) return null;

  const stats = calculateExpectedValue(anchors, params.x);
  if (!stats) {
    return {
      parameterId: curve.id,
      labelRu: curve.labelRu,
      value: params.value,
      expected: NaN,
      sd: NaN,
      percentile: NaN,
      zScore: NaN,
      mom: NaN,
      interpretation: `${curve.labelRu}: срок вне диапазона кривой (${curve.source}).`,
      source: curve.source,
      engine: curve.engine,
      flag: "out_of_range",
    };
  }

  const z = zScoreFromValue(params.value, stats.expected, stats.sd);
  const percentile = percentileFromZ(z);
  let flag = flagFromPercentile(percentile);

  if (params.clinical && params.curveId === "ysd") {
    const low = Number(params.clinical.criticalLowMm);
    const high = Number(params.clinical.criticalHighMm);
    if (params.value < low) flag = "critical_low";
    if (params.value >= high) flag = "critical_high";
  }

  const band = buildPercentileBand(stats.expected, stats.sd);
  const mom = calculateMoM(params.value, stats.expected);

  const unit = curve.unit ?? "mm";
  let interpretation = `${curve.labelRu} ${formatNum(params.value, unit)} ${unit} → ~${percentile}-й перц., MoM ${formatNum(mom)}, z ${formatNum(z)}`;
  if (flag === "critical_low" && params.clinical?.criticalLowNote) {
    interpretation += `. ${params.clinical.criticalLowNote}`;
  }
  if (flag === "critical_high" && params.clinical?.criticalHighNote) {
    interpretation += `. ${params.clinical.criticalHighNote}`;
  }

  return {
    parameterId: curve.id,
    labelRu: curve.labelRu,
    value: params.value,
    expected: Math.round(stats.expected * 100) / 100,
    sd: Math.round(stats.sd * 1000) / 1000,
    percentile,
    zScore: Math.round(z * 100) / 100,
    mom,
    interpretation,
    source: curve.source,
    engine: curve.engine,
    band,
    growthVelocityMmPerDay: params.growthVelocityMmPerDay,
    flag,
  };
}

export function assessNtFromCrl(crlMm: number, ntMm: number): PercentileResult | null {
  const curve = getCurve("nt");
  const model = curve.model;
  if (!model?.mean) return null;

  const stats = calculateLogLinearExpected(
    crlMm,
    model.mean.intercept,
    model.mean.slope,
    model.mean.xScale ?? 1,
    model.mean.yTransform ?? "exp",
    model.sdLog ?? 0.28,
  );
  if (!stats) return null;

  const z = zScoreFromValue(ntMm, stats.expected, stats.sd);
  const percentile = percentileFromZ(z);
  const flag = flagFromPercentile(percentile);
  const mom = calculateMoM(ntMm, stats.expected);

  return {
    parameterId: "nt",
    labelRu: curve.labelRu,
    value: ntMm,
    expected: Math.round(stats.expected * 100) / 100,
    sd: Math.round(stats.sd * 1000) / 1000,
    percentile,
    zScore: Math.round(z * 100) / 100,
    mom,
    interpretation: `NT ${formatNum(ntMm)} мм при КТР ${formatNum(crlMm)} мм → ~${percentile}-й перц., MoM ${formatNum(mom)}, z ${formatNum(z)} (${curve.source}).`,
    source: curve.source,
    engine: curve.engine,
    band: buildPercentileBand(stats.expected, stats.sd),
    flag,
  };
}

export function assessMeasurement(params: {
  curveId: Exclude<CurveId, "nt" | "nasal_bone" | "tricuspid_regurgitation">;
  value: number;
  gaDays?: number;
  gaWeeks?: number;
  crlMm?: number;
  priorValue?: number;
  priorGaDays?: number;
}): PercentileResult | null {
  const curve = getCurve(params.curveId);
  let x: number | undefined;
  if (curve.xAxis?.type === "gaDays") x = params.gaDays;
  if (curve.xAxis?.type === "gaWeeks") x = params.gaWeeks;
  if (x == null || !Number.isFinite(x)) return null;

  let growthVelocity: number | undefined;
  if (
    curve.supportsGrowthVelocity &&
    params.priorValue != null &&
    params.priorGaDays != null &&
    params.gaDays != null
  ) {
    growthVelocity = calculateGrowthVelocity(params.value, params.priorValue, params.gaDays, params.priorGaDays);
  }

  const result = assessAnchorCurve({
    curveId: params.curveId,
    value: params.value,
    x,
    growthVelocityMmPerDay: growthVelocity,
    clinical: curve.clinical,
  });

  if (result && curve.supportsGaFromValue && params.crlMm != null) {
    result.gestationalAgeDays = gaDaysFromCrlMm(params.crlMm) ?? undefined;
  }

  return result;
}
