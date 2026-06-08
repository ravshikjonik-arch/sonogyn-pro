import { evaluateFromRules } from "./engine";
import rules from "./rules.birads.json";
import { RuleSetConfig } from "./types";
import type { RiskResult } from "./types";

const biradsRuleSet: RuleSetConfig = rules as RuleSetConfig;

export const BI_RADS_VERSION = biradsRuleSet.version;
export const biradsOptions = biradsRuleSet.options;

/** Поля калькулятора BI-RADS US (лексикон близок к ACR BI-RADS US; см. также docs/ Фисенко). */
export type BiradsInput = {
  findingType: string;
  shape: string;
  margin: string;
  echoPattern: string;
  vascularity: string;
  orientation: string;
  posteriorFeatures: string;
  nonMassEchogenicity?: string;
  nonMassDistribution?: string;
  nonMassAssociatedFeatures?: string;
};

function toRuleInput(input: BiradsInput): Record<string, string> {
  const marked = input.vascularity === "marked";
  const nonParallel = input.orientation === "non_parallel";
  const shadow = input.posteriorFeatures === "shadowing";
  const enhancement = input.posteriorFeatures === "enhancement";

  const solidish =
    input.echoPattern === "hypoechoic" ||
    input.echoPattern === "heterogeneous" ||
    input.echoPattern === "complex_cystic_solid" ||
    input.echoPattern === "isoechoic";

  const simpleCystCandidate =
    (input.shape === "oval" || input.shape === "round") &&
    input.margin === "circumscribed" &&
    input.echoPattern === "anechoic" &&
    input.orientation === "parallel";

  const probablyBenignHypoechoic =
    (input.shape === "oval" || input.shape === "round") &&
    input.margin === "circumscribed" &&
    input.echoPattern === "hypoechoic" &&
    input.orientation === "parallel" &&
    (input.vascularity === "none" || input.vascularity === "mild");

  const benignHyperechoicPattern =
    (input.shape === "oval" || input.shape === "round") &&
    input.margin === "circumscribed" &&
    input.echoPattern === "hyperechoic" &&
    input.orientation === "parallel";

  const lowSuspicionEcho = ["anechoic", "hypoechoic", "isoechoic", "hyperechoic"].includes(
    input.echoPattern
  )
    ? "yes"
    : "no";

  return {
    shape: input.shape,
    margin: input.margin,
    echoPattern: input.echoPattern,
    vascularity: input.vascularity,
    orientation: input.orientation,
    posteriorFeatures: input.posteriorFeatures,

    markedFlow: marked ? "yes" : "no",
    nonParallel: nonParallel ? "yes" : "no",
    postShadow: shadow ? "yes" : "no",
    postEnhance: enhancement ? "yes" : "no",
    solidish: solidish ? "yes" : "no",
    simpleCystCandidate: simpleCystCandidate ? "yes" : "no",
    probablyBenignHypoechoic: probablyBenignHypoechoic ? "yes" : "no",
    benignHyperechoicPattern: benignHyperechoicPattern ? "yes" : "no",
    lowSuspicionEcho,
  };
}

function findMatchedRule(ri: Record<string, string>) {
  return biradsRuleSet.rules.find((rule) =>
    Object.entries(rule.when).every(([key, expected]) => {
      const value = ri[key];
      if (Array.isArray(expected)) return expected.includes(value);
      return value === expected;
    })
  );
}

export function evaluateBirads(input: BiradsInput): RiskResult {
  return evaluateFromRules(biradsRuleSet, toRuleInput(input));
}

export function buildBiradsDecisionPath(input: BiradsInput): string[] {
  const ri = toRuleInput(input);
  const steps: string[] = [
    "Шаги (упрощённый клинический чеклист BI-RADS US):",
    `0) Тип находки: ${input.findingType === "non_mass" ? "non-mass изменение" : "очаговое образование (mass)"}`,
    `1) Форма: ${input.shape}`,
    `2) Ориентация: ${input.orientation} (${input.orientation === "non_parallel" ? "непараллельная — высота больше ширины или круглая" : "параллельная коже — ширина больше высоты"})`,
    `3) Контур (margin): ${input.margin}`,
    `4) Эхо-структура: ${input.echoPattern}`,
    `5) Признаки позади очагового образования: ${input.posteriorFeatures}`,
    `6) Васкуляризация: ${input.vascularity}`,
  ];

  if (input.findingType === "non_mass") {
    steps.push(
      `Non-mass: эхогенность/вид — ${input.nonMassEchogenicity ?? "не указано"}; распределение — ${input.nonMassDistribution ?? "не указано"}; ассоциированные признаки — ${input.nonMassAssociatedFeatures ?? "не указано"}`
    );
  }

  const matched = findMatchedRule(ri);
  const base = evaluateFromRules(biradsRuleSet, ri);
  if (matched) {
    steps.push(`Итог по ruleset: ${matched.id} → ${matched.category} (${matched.riskRange})`);
  } else {
    steps.push(`Итог: fallback → ${base.category} (${base.riskRange})`);
  }
  steps.push(
    "Методическая основа формулировок: курс Е.П. Фисенко «Применение классификации BI-RADS» + ориентир ACR BI-RADS US. Калькулятор не заменяет полный атлас и клиническое суждение."
  );
  return steps;
}
