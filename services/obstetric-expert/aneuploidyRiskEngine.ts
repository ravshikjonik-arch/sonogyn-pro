import { findPathologyById } from "../../medical-knowledge/index";

import {
  CONDITION_LABELS,
  gaDaysFromCrl,
  isNtIncreased,
  MARKER_LIKELIHOOD_RATIOS,
  priorRiskAt12Weeks,
  updatePosteriorRisk,
  type AneuploidyCondition,
  type MarkerId,
} from "./aneuploidyReference";
import { collectAllTokens } from "./findingSynonyms";
import type { BiometricData, GestationalAgeInput } from "./types";

export type NasalBoneStatus = "present" | "absent" | "unknown";
export type DvFlowStatus = "normal" | "abnormal" | "unknown";
export type TricuspidStatus = "none" | "present" | "unknown";

export type AneuploidyRiskInput = {
  maternalAgeYears: number;
  gestationalAge?: GestationalAgeInput;
  /** I триместр */
  crlMm?: number;
  ntMm?: number;
  nasalBone?: NasalBoneStatus;
  dvFlow?: DvFlowStatus;
  dvPi?: number;
  tricuspidRegurgitation?: TricuspidStatus;
  /** II триместр — находки текстом или структурно */
  findings?: string[];
  biometricData?: BiometricData;
};

export type RiskLevel = "low" | "intermediate" | "high";

export type AneuploidyRiskItem = {
  pathologyId: AneuploidyCondition;
  diagnosis: string;
  priorRisk: number;
  posteriorRisk: number;
  riskLabel: string;
  supportingMarkers: string[];
  likelihoodRatioProduct: number;
};

export type AneuploidyRiskOutput = {
  trimester: "first" | "second" | "unknown";
  maternalAgeYears: number;
  activeMarkers: MarkerId[];
  markerScore: number;
  riskLevel: RiskLevel;
  risks: AneuploidyRiskItem[];
  summaryRu: string;
  recommendations: string[];
  disclaimer: string;
};

const DISCLAIMER =
  "Оценка риска анеуплоидий — упрощённая модель (не сертифицированный FMF-калькулятор). " +
  "Окончательный риск — по локальному алгоритму / NIPT / инвазивной диагностике. Интерпретация — специалист.";

const CONDITIONS: AneuploidyCondition[] = [
  "trisomy-21",
  "trisomy-18",
  "trisomy-13",
  "turner-syndrome",
  "triploidy",
];

const MARKER_LABELS: Record<MarkerId, string> = {
  increased_nt: "ТВП ↑",
  absent_nasal_bone: "Носовая кость отсутствует",
  tricuspid_regurgitation: "Трикуспидальная регургитация",
  reversed_dv_a_wave: "Патологический поток DV (a-wave)",
  high_dv_pi: "ПИ DV ↑",
  echogenic_bowel: "Эхогенный кишечник",
  short_fl: "Укорочение FL",
  short_hl: "Укорочение HL",
  echogenic_focus: "Эхогенный фокус сердца",
  pyelectasis: "Pyelectasis",
  ventriculomegaly: "Вентрикуломегалия",
};

function gaWeeks(input: AneuploidyRiskInput): number | null {
  if (input.gestationalAge?.weeks != null) {
    return input.gestationalAge.weeks + (input.gestationalAge.days ?? 0) / 7;
  }
  if (input.crlMm != null) return gaDaysFromCrl(input.crlMm) / 7;
  return null;
}

function detectTrimester(input: AneuploidyRiskInput): AneuploidyRiskOutput["trimester"] {
  const w = gaWeeks(input);
  if (w == null) return "unknown";
  if (w < 14) return "first";
  if (w >= 14) return "second";
  return "unknown";
}

function detectMarkers(input: AneuploidyRiskInput): MarkerId[] {
  const markers = new Set<MarkerId>();
  const tokens = collectAllTokens(input.findings ?? [], input.biometricData);

  if (input.ntMm != null && isNtIncreased(input.ntMm, input.crlMm)) markers.add("increased_nt");
  if (tokens.includes("increased_nt")) markers.add("increased_nt");
  if (input.nasalBone === "absent" || tokens.includes("absent_nasal_bone")) {
    markers.add("absent_nasal_bone");
  }
  if (
    input.tricuspidRegurgitation === "present" ||
    tokens.includes("tricuspid_regurgitation")
  ) {
    markers.add("tricuspid_regurgitation");
  }
  if (input.dvFlow === "abnormal" || tokens.includes("reversed_dv_a_wave")) {
    markers.add("reversed_dv_a_wave");
  }
  if (input.dvPi != null && input.dvPi > 1.05 && detectTrimester(input) === "first") {
    markers.add("high_dv_pi");
  }

  const secondTriMarkers: MarkerId[] = [
    "echogenic_bowel",
    "short_fl",
    "short_hl",
    "echogenic_focus",
    "pyelectasis",
    "ventriculomegaly",
  ];
  for (const m of secondTriMarkers) {
    if (tokens.includes(m)) markers.add(m);
  }

  return [...markers];
}

function riskLabel(p: number): string {
  if (p >= 1 / 10) return `1:${Math.max(2, Math.round(1 / p))}`;
  if (p >= 1 / 100) return `1:${Math.round(1 / p)}`;
  if (p >= 1 / 1000) return `1:${Math.round(1 / p)}`;
  return `< 1:1000`;
}

function classifyRiskLevel(topRisk: number, markerCount: number): RiskLevel {
  if (topRisk >= 1 / 50 || markerCount >= 3) return "high";
  if (topRisk >= 1 / 250 || markerCount >= 2) return "intermediate";
  return "low";
}

function buildRecommendations(level: RiskLevel, markers: MarkerId[], trimester: string): string[] {
  const recs: string[] = [];
  if (level === "high") {
    recs.push("Высокий риск: генетическое консультирование; NIPT или инвазивная диагностика по протоколу");
    recs.push("Fetal echo при подтверждённой анеуплоидии / множественных маркерах");
    if (trimester === "first") {
      recs.push("I трим.: уточнить multivariate risk в FMF-модуле SonoGyn Pro (/assistant/fmf)");
    }
  } else if (level === "intermediate") {
    recs.push("Промежуточный риск: комбинированный расчёт FMF / NIPT по локальному порогу");
    if (trimester === "first") {
      recs.push("I трим.: сертифицированный FMF-калькулятор (/assistant/fmf)");
    }
  } else {
    recs.push("Низкий риск по модели — продолжить рутинный скрининг");
  }
  if (trimester === "first" && markers.includes("increased_nt")) {
    recs.push("ТВП ↑: подтвердить КТР 45–84 мм, 3 идентичных измерения (FMF)");
  }
  if (markers.includes("reversed_dv_a_wave") || markers.includes("high_dv_pi")) {
    recs.push("Патологический DV: включить в multivariate risk (FMF)");
  }
  return [...new Set(recs)].slice(0, 8);
}

/**
 * Этап 6 — риск анеуплоидий: T21/T18/T13/Turner/triploidy по маркерам + возраст.
 */
export function assessAneuploidyRisk(input: AneuploidyRiskInput): AneuploidyRiskOutput {
  const age = input.maternalAgeYears;
  if (!Number.isFinite(age) || age < 15) {
    throw new Error("maternalAgeYears обязателен (≥15)");
  }

  const trimester = detectTrimester(input);
  const activeMarkers = detectMarkers(input);
  const markerScore = activeMarkers.length;

  const risks: AneuploidyRiskItem[] = CONDITIONS.map((condition) => {
    const prior = priorRiskAt12Weeks(age, condition);
    let lrProduct = 1;
    const supporting: string[] = [];

    for (const marker of activeMarkers) {
      const lr = MARKER_LIKELIHOOD_RATIOS[marker]?.[condition];
      if (lr != null && lr > 1) {
        lrProduct *= lr;
        supporting.push(MARKER_LABELS[marker]);
      }
    }

    const posterior = updatePosteriorRisk(prior, lrProduct);
    const entry = findPathologyById(condition);

    return {
      pathologyId: condition,
      diagnosis: entry?.name ?? CONDITION_LABELS[condition],
      priorRisk: Math.round(prior * 10000) / 10000,
      posteriorRisk: Math.round(posterior * 10000) / 10000,
      riskLabel: riskLabel(posterior),
      supportingMarkers: supporting,
      likelihoodRatioProduct: Math.round(lrProduct * 100) / 100,
    };
  }).sort((a, b) => b.posteriorRisk - a.posteriorRisk);

  const topRisk = risks[0]?.posteriorRisk ?? 0;
  const riskLevel = classifyRiskLevel(topRisk, markerScore);

  const markerList = activeMarkers.map((m) => MARKER_LABELS[m]).join(", ");
  const summaryRu = [
    `Возраст ${age} лет.`,
    trimester === "first" ? "I триместр" : trimester === "second" ? "II триместр" : "срок не определён",
    markerScore ? `Маркеры: ${markerList}` : "Маркеры не выявлены",
    `Ведущий риск: ${risks[0]?.diagnosis} ${risks[0]?.riskLabel}`,
    `Уровень: ${riskLevel === "low" ? "низкий" : riskLevel === "intermediate" ? "промежуточный" : "высокий"}`,
  ].join(". ");

  return {
    trimester,
    maternalAgeYears: age,
    activeMarkers,
    markerScore,
    riskLevel,
    risks,
    summaryRu,
    recommendations: buildRecommendations(riskLevel, activeMarkers, trimester),
    disclaimer: DISCLAIMER,
  };
}

export type { GestationalAgeInput, BiometricData };
