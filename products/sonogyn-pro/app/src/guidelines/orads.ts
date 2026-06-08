import { evaluateFromRules } from "./engine";
import rules from "./rules.orads.json";
import { RuleSetConfig } from "./types";
import type { RiskResult } from "./types";

const oradsRuleSet: RuleSetConfig = rules as RuleSetConfig;

export const O_RADS_VERSION = oradsRuleSet.version;

function findMatchedRule(ruleInput: Record<string, string>) {
  return oradsRuleSet.rules.find((rule) =>
    Object.entries(rule.when).every(([key, expected]) => {
      const value = ruleInput[key];
      if (Array.isArray(expected)) return expected.includes(value);
      return value === expected;
    })
  );
}

export type ReproductiveStatus =
  | "unknown"
  | "premenopausal_regular"
  | "premenopausal_irregular"
  | "postmenopausal";

export type OradsInput = {
  examQuality: "complete" | "incomplete";
  ovarianFinding: "normal" | "lesion";
  lesionType: string;
  lesionSizeCm: number;
  locularity: string;
  innerWall: string;
  papillaryProjections: number;
  solidComponent: string;
  externalContour: string;
  acousticShadow: "present" | "absent";
  colorScore: string;
  ascites: string;
  classicBenignType: string;
  reproductiveStatus: ReproductiveStatus;
};

export const oradsOptions = oradsRuleSet.options;

function toRuleInput(input: OradsInput): Record<string, string> {
  const size = Number(input.lesionSizeCm) || 0;
  const cs = Number(input.colorScore) || 0;
  const pap = Number(input.papillaryProjections) || 0;

  return {
    examQuality: input.examQuality,
    ovarianFinding: input.ovarianFinding,
    lesionType: input.lesionType,
    lesionSizeCm: String(size),
    locularity: input.locularity,
    innerWall: input.innerWall,
    papillaryProjections: String(pap),
    solidComponent: input.solidComponent,
    externalContour: input.externalContour,
    acousticShadow: input.acousticShadow,
    colorScore: String(cs),
    ascites: input.ascites,
    classicBenignType: input.classicBenignType,
    reproductiveStatus: input.reproductiveStatus,

    // derived buckets to keep JSON rules simple (string equality only)
    sizeGe10: size >= 10 ? "yes" : "no",
    pap0: pap === 0 ? "yes" : "no",
    pap1to3: pap > 0 && pap < 4 ? "yes" : "no",
    pap4plus: pap >= 4 ? "yes" : "no",
    csHigh: cs >= 3 ? "yes" : "no",
    solidPresent: input.solidComponent === "present" ? "yes" : "no",
    wallIrregular: input.innerWall === "irregular" ? "yes" : "no",
    contourIrregular: input.externalContour === "irregular" ? "yes" : "no",
    shadowPresent: input.acousticShadow === "present" ? "yes" : "no",
    examIncomplete: input.examQuality === "incomplete" ? "yes" : "no",
  };
}

function applyReproductiveContext(
  base: RiskResult,
  reproductiveStatus: ReproductiveStatus
): RiskResult {
  if (reproductiveStatus === "unknown") {
    return {
      ...base,
      impression: `${base.impression}\n\nКонтекст: репродуктивный статус не указан. Для O-RADS US интерпретация часто зависит от менопаузального статуса; уточните цикл/менопаузу и при необходимости пересчитайте.`,
    };
  }

  if (reproductiveStatus === "postmenopausal") {
    return {
      ...base,
      impression: `${base.impression}\n\nКонтекст: постменопауза. Для ряда кистозных паттернов риск/тактика может отличаться от репродуктивного возраста; при пограничных признаках сильнее рассмотрите экспертное УЗИ/МРТ и онкогинекологический маршрут.`,
    };
  }

  if (reproductiveStatus === "premenopausal_irregular") {
    return {
      ...base,
      impression: `${base.impression}\n\nКонтекст: нерегулярный менструальный цикл. Учитывайте функциональные кисты/фазу цикла; при сомнениях коррелируйте с лабораторией/клиникой и повторите исследование в динамике.`,
    };
  }

  return {
    ...base,
    impression: `${base.impression}\n\nКонтекст: регулярный менструальный цикл (пременопауза).`,
  };
}

export function evaluateOrads(input: OradsInput): RiskResult {
  const ruleInput = toRuleInput(input);
  const base = evaluateFromRules(oradsRuleSet, ruleInput);
  return applyReproductiveContext(base, input.reproductiveStatus);
}

export function buildOradsDecisionPath(input: OradsInput): string[] {
  const ri = toRuleInput(input);
  const steps: string[] = [];

  steps.push(
    `Шаг 1: Качество исследования = ${ri.examQuality}${
      ri.examIncomplete === "yes" ? " (исследование неполное — интерпретация осторожнее)" : ""
    }`
  );
  steps.push(`Шаг 2: Состояние яичника = ${ri.ovarianFinding}`);
  steps.push(`Шаг 3: Репродуктивный статус = ${ri.reproductiveStatus}`);
  steps.push(
    `Шаг 4: Тип/размер/структура = ${ri.lesionType}, ${ri.lesionSizeCm} см, камерность ${ri.locularity}, стенка ${ri.innerWall}, солидный компонент ${ri.solidComponent}`
  );
  steps.push(
    `Шаг 5: Папиллярные разрастания (логика как в UI) = ${ri.papillaryProjections} (0 / 1-3 / 4+)`
  );
  steps.push(`Шаг 6: Контур/тень/васкуляризация = ${ri.externalContour}, тень ${ri.acousticShadow}, color score ${ri.colorScore}`);
  steps.push(`Шаг 7: Асцит/импланты = ${ri.ascites}`);
  steps.push(`Шаг 8: Типичный доброкачественный паттерн O-RADS 2 = ${ri.classicBenignType}`);

  const base = evaluateFromRules(oradsRuleSet, ri);
  const matched = findMatchedRule(ri);

  if (matched) {
    steps.push(`Итог по правилам ruleset: ${matched.id} → ${matched.category} (${matched.riskRange})`);
  } else {
    steps.push(`Итог: fallback ruleset → ${base.category} (${base.riskRange})`);
  }

  if (ri.reproductiveStatus === "postmenopausal") {
    steps.push("Контекстный шаг: постменопауза — добавлены осторожные формулировки в заключении.");
  } else if (ri.reproductiveStatus === "unknown") {
    steps.push("Контекстный шаг: статус не указан — добавлена рекомендация уточнить цикл/менопаузу.");
  } else if (ri.reproductiveStatus === "premenopausal_irregular") {
    steps.push("Контекстный шаг: нерегулярный цикл — добавлена рекомендация учитывать функциональные кисты/фазу цикла.");
  }

  return steps;
}
