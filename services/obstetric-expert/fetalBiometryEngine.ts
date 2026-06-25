import { growthPercentile, type GrowthMetric } from "../../packages/medical-calculations/src/percentiles";
import { estimateFetalWeight as efwFromHadlock } from "../../packages/medical-calculations/src/estimatedFetalWeight";

import {
  getReferenceBand,
  PARAMETER_LABELS_RU,
  PARAMETER_UNITS,
  percentileFromBand,
  zScoreFromBand,
  type BiometryParameter,
} from "./biometryReference";
import type { BiometricData, GestationalAgeInput } from "./types";

export type BiometryStandard = "hadlock" | "intergrowth" | "who";

export type GrowthClassification =
  | "normal"
  | "borderline_low"
  | "borderline_high"
  | "below_p3"
  | "above_p97"
  | "unknown";

export type BiometryMeasurementResult = {
  parameter: BiometryParameter;
  parameterRu: string;
  value: number;
  unit: string;
  percentile: number | null;
  zScore: number | null;
  referenceMedian?: number;
  classification: GrowthClassification;
  note?: string;
};

export type FetalBiometryInput = {
  gestationalAge: GestationalAgeInput;
  standard?: BiometryStandard;
} & BiometricData;

export type FetalBiometryOutput = {
  gestationalAgeWeeks: number;
  standard: BiometryStandard;
  measurements: BiometryMeasurementResult[];
  efw?: {
    grams: number;
    formula: string;
    percentile: number | null;
    zScore: number | null;
    classification: GrowthClassification;
  };
  growthPattern: "symmetric" | "asymmetric_head_spare" | "asymmetric_abdominal" | "unknown";
  summaryRu: string;
  recommendations: string[];
  disclaimer: string;
};

const DISCLAIMER =
  "Оценка роста плода — ориентир по выбранному стандарту (Hadlock / INTERGROWTH / WHO). " +
  "Не заменяет протокол центра и клиническое решение. Интерпретация — специалист.";

const HADLOCK_METRIC: Partial<Record<BiometryParameter, GrowthMetric>> = {
  bpd: "bpd",
  hc: "hc",
  ac: "ac",
  fl: "fl",
  efw: "efw",
};

function gaToWeeks(ga: GestationalAgeInput): number | null {
  if (ga.weeks == null || !Number.isFinite(ga.weeks)) return null;
  return ga.weeks + (ga.days ?? 0) / 7;
}

function classifyPercentile(p: number | null): GrowthClassification {
  if (p == null) return "unknown";
  if (p < 3) return "below_p3";
  if (p < 10) return "borderline_low";
  if (p <= 90) return "normal";
  if (p <= 97) return "borderline_high";
  return "above_p97";
}

function percentileToZ(p: number): number {
  if (p <= 1) return -2.33;
  if (p >= 99) return 2.33;
  const t = p / 100;
  const a = 0.147;
  const sign = t < 0.5 ? -1 : 1;
  const x = t < 0.5 ? t : 1 - t;
  const z = sign * Math.sqrt(-2 * Math.log(x)) - ((2.515517 + 0.802853 * Math.sqrt(-2 * Math.log(x))) / (1 + 1.432788 * Math.sqrt(-2 * Math.log(x)) + 0.189269 * (-2 * Math.log(x))));
  return Math.round(z * 100) / 100;
}

function assessParameter(
  parameter: BiometryParameter,
  value: number,
  gaWeeks: number,
  standard: BiometryStandard,
): BiometryMeasurementResult {
  const base = {
    parameter,
    parameterRu: PARAMETER_LABELS_RU[parameter],
    value,
    unit: PARAMETER_UNITS[parameter],
  };

  if (standard === "hadlock") {
    const metric = HADLOCK_METRIC[parameter];
    if (!metric) {
      return {
        ...base,
        percentile: null,
        zScore: null,
        classification: "unknown",
        note: "Hadlock-таблица: параметр без референса",
      };
    }
    const percentile = growthPercentile(metric, value, gaWeeks);
    const classification = classifyPercentile(percentile);
    return {
      ...base,
      percentile,
      zScore: percentile != null ? percentileToZ(percentile) : null,
      classification,
      note: "Hadlock / internal SD table (20–40 нед)",
    };
  }

  const band = getReferenceBand(
    parameter,
    gaWeeks,
    standard === "who" ? "who" : "intergrowth",
  );
  if (!band) {
    return { ...base, percentile: null, zScore: null, classification: "unknown" };
  }

  const percentile = percentileFromBand(value, band);
  return {
    ...base,
    percentile,
    zScore: zScoreFromBand(value, band),
    referenceMedian: Math.round(band.p50 * 10) / 10,
    classification: classifyPercentile(percentile),
    note: standard === "who" ? "WHO fetal growth (approx.)" : "INTERGROWTH-21st (approx.)",
  };
}

function detectGrowthPattern(
  measurements: BiometryMeasurementResult[],
): FetalBiometryOutput["growthPattern"] {
  const hc = measurements.find((m) => m.parameter === "hc");
  const ac = measurements.find((m) => m.parameter === "ac");
  if (hc?.percentile == null || ac?.percentile == null) return "unknown";
  const delta = hc.percentile - ac.percentile;
  if (Math.abs(delta) < 20) return "symmetric";
  return delta > 0 ? "asymmetric_head_spare" : "asymmetric_abdominal";
}

function buildRecommendations(
  measurements: BiometryMeasurementResult[],
  efw?: FetalBiometryOutput["efw"],
  pattern?: FetalBiometryOutput["growthPattern"],
): string[] {
  const recs: string[] = [];
  const abnormal = measurements.filter(
    (m) => m.classification === "below_p3" || m.classification === "above_p97",
  );
  const borderline = measurements.filter(
    (m) => m.classification === "borderline_low" || m.classification === "borderline_high",
  );

  if (efw?.classification === "below_p3") {
    recs.push("EFW < p3: FGR work-up — допплер UA/MCA/DV, серийная биометрия q2–3 нед");
  }
  if (efw?.classification === "above_p97") {
    recs.push("EFW > p97: исключить GDM/мацеросомию; контроль AC/жидкости");
  }
  if (pattern === "asymmetric_head_spare") {
    recs.push("Асимметрия (HC > AC): паттерн «head sparing» — оценить плацентарную недостаточность");
  }
  if (pattern === "asymmetric_abdominal") {
    recs.push("Асимметрия (AC < HC): абdominal growth restriction — допплер, TORCH/генетика по показаниям");
  }
  for (const m of abnormal) {
    recs.push(`${m.parameterRu} вне p3–p97 (${m.percentile}-й перц.) — подтвердить повторным измерением`);
  }
  if (borderline.length && !abnormal.length) {
    recs.push("Пограничные перцентили — динамика через 2–3 нед или по протоколу центра");
  }
  if (!recs.length) {
    recs.push("Биометрия в пределах ожидаемого для срока — продолжить рутинное наблюдение");
  }
  return [...new Set(recs)].slice(0, 8);
}

function buildSummary(
  gaWeeks: number,
  measurements: BiometryMeasurementResult[],
  efw?: FetalBiometryOutput["efw"],
  pattern?: FetalBiometryOutput["growthPattern"],
): string {
  const gaLabel = `${Math.floor(gaWeeks)}+${Math.round((gaWeeks % 1) * 7)} нед`;
  const parts = measurements
    .filter((m) => m.percentile != null)
    .map((m) => `${m.parameterRu} ${m.value} ${m.unit} (~${m.percentile}-й перц.)`);

  if (efw) {
    parts.push(
      `EFW ${efw.grams} g${efw.percentile != null ? ` (~${efw.percentile}-й перц.)` : ""}`,
    );
  }

  const patternRu =
    pattern === "asymmetric_head_spare"
      ? "асимметричный рост (head sparing)"
      : pattern === "asymmetric_abdominal"
        ? "асимметричный рост (AC ↓)"
        : pattern === "symmetric"
          ? "симметричный рост"
          : "";

  return [`Срок ${gaLabel}.`, parts.join("; "), patternRu].filter(Boolean).join(" ");
}

/**
 * Этап 4 — оценка фетометрии: перцентили, z-score, EFW (Hadlock), паттерн роста.
 */
export function assessFetalBiometry(input: FetalBiometryInput): FetalBiometryOutput {
  const standard = input.standard ?? "intergrowth";
  const gaWeeks = gaToWeeks(input.gestationalAge);
  if (gaWeeks == null) {
    throw new Error("gestationalAge.weeks обязателен");
  }

  const measurements: BiometryMeasurementResult[] = [];
  const params: { key: BiometryParameter; value?: number }[] = [
    { key: "bpd", value: input.bpdMm },
    { key: "hc", value: input.hcMm },
    { key: "ac", value: input.acMm },
    { key: "fl", value: input.flMm },
    { key: "hl", value: input.hlMm },
  ];

  for (const { key, value } of params) {
    if (value != null && Number.isFinite(value) && value > 0) {
      measurements.push(assessParameter(key, value, gaWeeks, standard));
    }
  }

  let efwBlock: FetalBiometryOutput["efw"];
  let efwGrams = input.efwGrams;

  if (efwGrams == null) {
    const computed = efwFromHadlock({
      bpdMm: input.bpdMm,
      hcMm: input.hcMm,
      acMm: input.acMm,
      flMm: input.flMm,
    });
    if (computed) efwGrams = computed.grams;
  }

  if (efwGrams != null && efwGrams > 0) {
    const efwAssess = assessParameter("efw", efwGrams, gaWeeks, standard);
    const computed = efwFromHadlock({
      bpdMm: input.bpdMm,
      hcMm: input.hcMm,
      acMm: input.acMm,
      flMm: input.flMm,
    });
    efwBlock = {
      grams: efwGrams,
      formula: computed?.label ?? "direct input",
      percentile: efwAssess.percentile,
      zScore: efwAssess.zScore,
      classification: efwAssess.classification,
    };
    measurements.push(efwAssess);
  }

  const growthPattern = detectGrowthPattern(measurements);
  const recommendations = buildRecommendations(measurements, efwBlock, growthPattern);

  return {
    gestationalAgeWeeks: gaWeeks,
    standard,
    measurements,
    efw: efwBlock,
    growthPattern,
    summaryRu: buildSummary(gaWeeks, measurements, efwBlock, growthPattern),
    recommendations,
    disclaimer: DISCLAIMER,
  };
}

export type { GestationalAgeInput, BiometricData };
