import { formatMeasurementDecimal, parseMeasurementMm } from "@repo/medical-calculations";
import { classifyLymphNodesFromKeywords } from "../lymph-node";
import { patternById } from "../knowledge/patterns";
import type { TiradsAcrInput } from "../types";
import { defaultTiradsAcrInput, evaluateAcrTirads } from "../score";
import { mergeTiradsInput } from "./structured-report";
import { generateStructuredThyroidReport } from "./structured-report";

export type TiradsNlpResult = {
  parsedInput: TiradsAcrInput;
  detectedKeywords: string[];
  suggestedDiagnosis: string;
  report: ReturnType<typeof generateStructuredThyroidReport>;
};

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
  { patterns: [/папилляр|ptc|papillary/i], field: "patternId", value: "papillary_carcinoma", label: "PTC pattern" },
  { patterns: [/коллоид/i], field: "patternId", value: "colloid_nodule", label: "colloid" },
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
      keywords.push(`размер ${formatMeasurementDecimal(sizeMm)} мм`);
    }
  }
  parsed.lymphNodes = classifyLymphNodesFromKeywords(text);
  return { parsed, keywords };
}

export function assistFromTiradsText(text: string): TiradsNlpResult {
  const { parsed, keywords } = parseTiradsFreeText(text);
  let input = mergeTiradsInput(parsed);
  if (parsed.patternId) {
    const pattern = patternById(parsed.patternId);
    if (pattern) input = mergeTiradsInput({ ...pattern.preset, patternId: pattern.id }, input);
  }
  const report = generateStructuredThyroidReport(input);
  let suggestedDiagnosis = "Узловое образование ЩЖ";
  if (parsed.patternId) {
    suggestedDiagnosis = `Наиболее вероятно: ${patternById(parsed.patternId)?.nameRu ?? parsed.patternId}`;
  } else if (/папилляр|ptc/i.test(text)) {
    suggestedDiagnosis = "Наиболее вероятно: папиллярный рак ЩЖ";
  } else if (/коллоид|spongiform/i.test(text)) {
    suggestedDiagnosis = "Наиболее вероятно: коллоидный / spongiform узел";
  }
  return { parsedInput: input, detectedKeywords: keywords, suggestedDiagnosis, report };
}

export function assistFromTiradsTextSafe(text: string): TiradsNlpResult {
  if (!text.trim()) {
    const input = defaultTiradsAcrInput;
    return {
      parsedInput: input,
      detectedKeywords: [],
      suggestedDiagnosis: "—",
      report: generateStructuredThyroidReport(input),
    };
  }
  return assistFromTiradsText(text);
}
