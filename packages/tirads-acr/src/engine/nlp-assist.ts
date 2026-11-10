import { formatMeasurementRu, parseMeasurementMm } from "@repo/medical-calculations";
import { classifyLymphNodesFromKeywords } from "../lymph-node";
import type { TiradsAcrInput } from "../types";
import { defaultTiradsAcrInput, evaluateAcrTirads } from "../score";
import { mergeTiradsInput } from "./structured-report";
import { generateStructuredThyroidReport } from "./structured-report";

export type TiradsNlpResult = {
  parsedInput: TiradsAcrInput;
  detectedKeywords: string[];
  /** Neutral assist note (kept under the old name for callers). Never a diagnosis. */
  suggestedDiagnosis: string;
  /** Feature groups not found in the text: the calculator shows defaults there until the doctor confirms. */
  missingFeatures: string[];
  report: ReturnType<typeof generateStructuredThyroidReport>;
};

const FEATURE_LABEL_RU: Record<"composition" | "echogenicity" | "shape" | "margin" | "echogenicFoci", string> = {
  composition: "состав",
  echogenicity: "эхогенность",
  shape: "форма",
  margin: "контуры",
  echogenicFoci: "эхогенные включения",
};

/** Diagnosis words are noted but never turned into features: the category comes only from described features. */
const DIAGNOSIS_MENTIONS: { pattern: RegExp; label: string }[] = [
  { pattern: /папилляр|ptc|papillary/i, label: "в тексте упомянута папиллярная структура / диагноз — на расчёт не влияет" },
  { pattern: /коллоид/i, label: "в тексте упомянут коллоидный узел — на расчёт не влияет" },
];

type Rule = { patterns: RegExp[]; field: keyof TiradsAcrInput; value: string; label: string; asFociArray?: boolean };

const RULES: Rule[] = [
  { patterns: [/spongiform|губчат/i], field: "composition", value: "spongiform", label: "spongiform" },
  { patterns: [/кист/i, /cystic/i], field: "composition", value: "cystic", label: "кистозный" },
  { patterns: [/солид/i, /solid/i], field: "composition", value: "solid", label: "солидный" },
  { patterns: [/смешан/i, /mixed/i], field: "composition", value: "mixed", label: "смешанный" },
  { patterns: [/очень гипо|very hypoechoic/i], field: "echogenicity", value: "very_hypoechoic", label: "очень гипоэхогенный" },
  { patterns: [/гипоэхоген/i, /hypoechoic/i], field: "echogenicity", value: "hypoechoic", label: "гипоэхогенный" },
  { patterns: [/изоэхоген|гиперэхоген|isoechoic|hyperechoic/i], field: "echogenicity", value: "hyperechoic_or_isoechoic", label: "изо-/гиперэхогенный" },
  { patterns: [/выше.*шире|taller.?than.?wide|вертикальн/i], field: "shape", value: "taller_than_wide", label: "taller-than-wide" },
  { patterns: [/шире.*выше|wider.?than.?tall/i], field: "shape", value: "wider_than_tall", label: "wider-than-tall" },
  { patterns: [/неровн|irregular|lobulated/i], field: "margin", value: "lobulated_or_irregular", label: "неровные контуры" },
  { patterns: [/extrathyroid|экстра/i], field: "margin", value: "extrathyroidal_extension", label: "ETE" },
  { patterns: [/микрокальц|punctate/i], field: "echogenicFoci", value: "punctate", label: "пунктатные foci", asFociArray: true },
  { patterns: [/макрокальц|macro.?calc/i], field: "echogenicFoci", value: "macrocalcifications", label: "макрокальцинаты", asFociArray: true },
  { patterns: [/rim.?calc|периферич.*кальц/i], field: "echogenicFoci", value: "peripheral_rim", label: "rim calcifications", asFociArray: true },
  { patterns: [/comet.?tail/i], field: "echogenicFoci", value: "none_or_comet_tail", label: "comet-tail", asFociArray: true },
];

export function parseTiradsFreeText(text: string): { parsed: Partial<TiradsAcrInput>; keywords: string[] } {
  const parsed: Partial<TiradsAcrInput> = {};
  const keywords: string[] = [];
  const foci: string[] = [];
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      keywords.push(rule.label);
      if (rule.asFociArray) {
        foci.push(rule.value);
      } else {
        (parsed as Record<string, unknown>)[rule.field] = rule.value;
      }
    }
  }
  if (foci.length) {
    parsed.echogenicFoci = foci as TiradsAcrInput["echogenicFoci"];
  }
  const size = text.match(/(\d+(?:[.,]\d+)?)\s*мм/i);
  if (size) {
    const sizeMm = parseMeasurementMm(size[1]!);
    if (sizeMm != null) {
      parsed.largestDiameterMm = sizeMm;
      keywords.push(`размер ${formatMeasurementRu(sizeMm)} мм`);
    }
  }
  parsed.lymphNodes = classifyLymphNodesFromKeywords(text);
  for (const m of DIAGNOSIS_MENTIONS) {
    if (m.pattern.test(text)) keywords.push(m.label);
  }
  return { parsed, keywords };
}

function missingFeatureGroups(parsed: Partial<TiradsAcrInput>): string[] {
  const shortcut = parsed.composition === "spongiform";
  const groups = shortcut ? (["composition"] as const) : (["composition", "echogenicity", "shape", "margin", "echogenicFoci"] as const);
  return groups.filter((g) => (g === "echogenicFoci" ? !parsed.echogenicFoci?.length : parsed[g] === undefined)).map((g) => FEATURE_LABEL_RU[g]);
}

export function assistFromTiradsText(text: string): TiradsNlpResult {
  const { parsed, keywords } = parseTiradsFreeText(text);
  const input = mergeTiradsInput(parsed);
  const report = generateStructuredThyroidReport(input);
  const missingFeatures = missingFeatureGroups(parsed);
  const suggestedDiagnosis = missingFeatures.length
    ? `Признаки из текста перенесены в калькулятор. Не распознаны: ${missingFeatures.join(", ")} — укажите их вручную. Категорию определяет калькулятор, не AI.`
    : "Признаки из текста перенесены в калькулятор — проверьте и подтвердите. Категорию определяет калькулятор, не AI.";
  return { parsedInput: input, detectedKeywords: keywords, suggestedDiagnosis, missingFeatures, report };
}

export function assistFromTiradsTextSafe(text: string): TiradsNlpResult {
  if (!text.trim()) {
    const input = defaultTiradsAcrInput;
    return {
      parsedInput: input,
      detectedKeywords: [],
      suggestedDiagnosis: "Введите описание узла — признаки будут перенесены в калькулятор.",
      missingFeatures: Object.values(FEATURE_LABEL_RU),
      report: generateStructuredThyroidReport(input),
    };
  }
  return assistFromTiradsText(text);
}
