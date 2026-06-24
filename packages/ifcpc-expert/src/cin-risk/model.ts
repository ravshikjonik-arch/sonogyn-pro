import coefficients from "./coefficients.json";
import { buildCinRiskRecommendation } from "./recommendations";
import type {
  CinRiskCalculatorInput,
  CinRiskCalculatorResult,
  CinRiskCoefficientsDocument,
  CinRiskOutcome,
  CinRiskProbability,
  CinRiskTier,
  CinRiskTierInfo,
  InvasionRiskTier,
} from "./types";
import { getIfcpcSignById } from "../knowledge/nomenclature";

const MODEL = coefficients as CinRiskCoefficientsDocument;

const OUTCOME_LABELS_RU: Record<CinRiskOutcome, string> = {
  normal: "Норма / отсутствие значимой невроплазии",
  cin1: "CIN 1 (LSIL)",
  cin2: "CIN 2",
  cin3: "CIN 3 (HSIL)",
  ais: "AIS (аденокарцинoma in situ)",
  invasion: "Инвазивный рак",
};

const OUTCOMES: CinRiskOutcome[] = ["normal", "cin1", "cin2", "cin3", "ais", "invasion"];

function emptyLogits(): Record<CinRiskOutcome, number> {
  return { normal: 0, cin1: 0, cin2: 0, cin3: 0, ais: 0, invasion: 0 };
}

function addWeights(
  target: Record<CinRiskOutcome, number>,
  weights: Record<CinRiskOutcome, number>,
  multiplier = 1,
): void {
  for (const k of OUTCOMES) {
    target[k] += (weights[k] ?? 0) * multiplier;
  }
}

function ageModifierKey(age: number): keyof CinRiskCoefficientsDocument["clinicalModifiers"] {
  if (age < 25) return "age_under25";
  if (age < 35) return "age_25_34";
  if (age < 50) return "age_35_49";
  return "age_50_plus";
}

function softmax(logits: Record<CinRiskOutcome, number>): Record<CinRiskOutcome, number> {
  const values = OUTCOMES.map((k) => logits[k]);
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const result = emptyLogits();
  OUTCOMES.forEach((k, i) => {
    result[k] = exps[i] / sum;
  });
  return result;
}

function resolveCin2plusTier(p: number): CinRiskTierInfo {
  const thresholds = MODEL.riskTierThresholds.cin2plus;
  for (const t of thresholds) {
    if (p <= t.max) {
      return { tier: t.tier as CinRiskTier, labelRu: t.labelRu, color: t.color };
    }
  }
  const last = thresholds[thresholds.length - 1];
  return { tier: last.tier as CinRiskTier, labelRu: last.labelRu, color: last.color };
}

function resolveInvasionTier(p: number): { tier: InvasionRiskTier; labelRu: string; color: string } {
  const thresholds = MODEL.riskTierThresholds.invasion;
  for (const t of thresholds) {
    if (p <= t.max) {
      return { tier: t.tier as InvasionRiskTier, labelRu: t.labelRu, color: t.color };
    }
  }
  const last = thresholds[thresholds.length - 1];
  return { tier: last.tier as InvasionRiskTier, labelRu: last.labelRu, color: last.color };
}

function countIfcpcBySection(signIds: string[]): Record<string, number> {
  const counts: Record<string, number> = {
    abnormal_grade1: 0,
    abnormal_grade2: 0,
    suspicious_invasion: 0,
  };
  for (const id of signIds) {
    const sign = getIfcpcSignById(id);
    if (!sign) continue;
    if (sign.sectionId in counts) {
      counts[sign.sectionId] += 1;
    }
  }
  return counts;
}

/**
 * ## Алгоритм расчёта (v1)
 *
 * 1. Инициализация логитов L_k для k ∈ {normal, cin1, cin2, cin3, ais, invasion}
 * 2. L += β_Bethesda[cytology]
 * 3. L += β_HPV[status]; при HPV16/18/other HR — дополнительные модификаторы
 * 4. L += β_TZ[transformationZone]
 * 5. L += Σ(n_grade1 × β_grade1) + Σ(n_grade2 × β_grade2) + Σ(n_invasion × β_invasion)
 * 6. L += β_priorBiopsy + β_priorTreatment
 * 7. L += β_age + β_immuno + β_pregnancy
 * 8. P_k = softmax(L)_k
 * 9. CIN2+ = P(cin2)+P(cin3)+P(ais)+P(invasion); CIN3+ = P(cin3)+P(ais)+P(invasion)
 */
export function calculateCinRisk(input: CinRiskCalculatorInput): CinRiskCalculatorResult {
  const steps: string[] = [];
  const logits = emptyLogits();

  addWeights(logits, MODEL.bethesdaPriors[input.cytology]);
  steps.push(`Базовый априор: цитология ${input.cytology.toUpperCase()}.`);

  if (input.hpvStatus === "negative") {
    addWeights(logits, MODEL.hpvModifiers.negative);
    steps.push("ВПЧ отрицательный — снижение риска CIN2+.");
  } else if (input.hpvStatus === "positive") {
    addWeights(logits, MODEL.hpvModifiers.positive);
    steps.push("ВПЧ положительный — повышение риска неоплазии.");
  }

  if (input.hpv16Positive) {
    addWeights(logits, MODEL.hpvModifiers.hpv16);
    steps.push("ВПЧ 16+ — значимый предиктор CIN3+.");
  }
  if (input.hpv18Positive) {
    addWeights(logits, MODEL.hpvModifiers.hpv18);
    steps.push("ВПЧ 18+ — повышенный риск AIS/аденокarcinoma.");
  }
  if (input.otherHrHpvPositive) {
    addWeights(logits, MODEL.hpvModifiers.other_hr);
    steps.push("Другие ВПЧ high-risk+.");
  }

  addWeights(logits, MODEL.transformationZone[input.transformationZoneTypeId]);
  steps.push(`TZ ${input.transformationZoneTypeId.toUpperCase()} — коррекция видимости очага.`);

  const ifcpcCounts = countIfcpcBySection(input.ifcpcFindingSignIds);
  if (ifcpcCounts.abnormal_grade1 > 0) {
    addWeights(logits, MODEL.ifcpcSectionWeights.abnormal_grade1, ifcpcCounts.abnormal_grade1);
    steps.push(`IFCPC Grade 1 (minor): ${ifcpcCounts.abnormal_grade1} призн.`);
  }
  if (ifcpcCounts.abnormal_grade2 > 0) {
    addWeights(logits, MODEL.ifcpcSectionWeights.abnormal_grade2, ifcpcCounts.abnormal_grade2);
    steps.push(`IFCPC Grade 2 (major): ${ifcpcCounts.abnormal_grade2} призн. — ключевой предиктор HSIL.`);
  }
  if (ifcpcCounts.suspicious_invasion > 0) {
    addWeights(logits, MODEL.ifcpcSectionWeights.suspicious_invasion, ifcpcCounts.suspicious_invasion);
    steps.push(`Признаки инвазии IFCPC: ${ifcpcCounts.suspicious_invasion} — срочная верификация.`);
  }

  addWeights(logits, MODEL.priorBiopsy[input.priorBiopsy]);
  if (input.priorBiopsy !== "none") {
    steps.push(`Предшествующая биопсия: ${input.priorBiopsy}.`);
  }

  addWeights(logits, MODEL.priorCinTreatment[input.priorCinTreatment]);
  if (input.priorCinTreatment !== "none") {
    steps.push(`История лечения CIN: ${input.priorCinTreatment}.`);
  }

  addWeights(logits, MODEL.clinicalModifiers[ageModifierKey(input.age)]);
  if (input.immunodeficiency) {
    addWeights(logits, MODEL.clinicalModifiers.immunodeficiency);
    steps.push("Иммунodeficiency — повышенный риск персистенции/прогрессии.");
  }
  if (input.pregnancy) {
    addWeights(logits, MODEL.clinicalModifiers.pregnancy);
    steps.push("Беременность — модификация тактики (отложенное лечение при LSIL/CIN1).");
  }

  steps.push("Применён softmax → вероятности гистологических исходов.");

  const probs = softmax(logits);

  const probabilities: CinRiskProbability[] = OUTCOMES.map((outcome) => ({
    outcome,
    labelRu: OUTCOME_LABELS_RU[outcome],
    probability: probs[outcome],
    percentage: Math.round(probs[outcome] * 1000) / 10,
  }));

  const cin1 = probs.cin1;
  const cin2 = probs.cin2;
  const cin3 = probs.cin3;
  const ais = probs.ais;
  const invasion = probs.invasion;
  const cin2plus = cin2 + cin3 + ais + invasion;
  const cin3plus = cin3 + ais + invasion;

  const cin2plusTier = resolveCin2plusTier(cin2plus);
  const invasionTier = resolveInvasionTier(invasion);

  const recommendation = buildCinRiskRecommendation({
    input,
    cin2plus,
    cin3plus,
    invasion,
    cin2plusTier,
    invasionTier,
    ifcpcCounts,
  });

  return {
    probabilities,
    cin1,
    cin2,
    cin3,
    ais,
    invasion,
    cin2plus,
    cin3plus,
    cin2plusPercentage: Math.round(cin2plus * 1000) / 10,
    cin3plusPercentage: Math.round(cin3plus * 1000) / 10,
    invasionPercentage: Math.round(invasion * 1000) / 10,
    cin2plusTier,
    invasionTier,
    algorithmSteps: steps,
    logitBreakdown: { ...logits },
    recommendation,
    disclaimer: MODEL.meta.disclaimer,
    modelVersion: MODEL.meta.version,
  };
}

export function getCinRiskModelMeta() {
  return MODEL.meta;
}

export function getCinRiskCoefficients(): CinRiskCoefficientsDocument {
  return MODEL;
}

export const CIN_RISK_FORMULA = MODEL.meta.formula;
