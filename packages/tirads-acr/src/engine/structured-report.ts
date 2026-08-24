import { defaultTiradsAcrInput, evaluateAcrTirads, normalizeEchogenicFoci } from "../score";
import type { TiradsAcrInput, TiradsEchogenicFoci } from "../types";
import { formatMm } from "@repo/medical-calculations";
import { COMPOSITION_OPTIONS, ECHOGENICITY_OPTIONS, ECHOGENIC_FOCI_OPTIONS, MARGIN_OPTIONS, SHAPE_OPTIONS } from "../lexicon";

export function mergeTiradsInput(parsed: Partial<TiradsAcrInput>, base: TiradsAcrInput = defaultTiradsAcrInput): TiradsAcrInput {
  const merged = { ...base, ...parsed };
  const rawFoci = (parsed.echogenicFoci ?? base.echogenicFoci) as TiradsEchogenicFoci | TiradsEchogenicFoci[] | undefined;
  merged.echogenicFoci = normalizeEchogenicFoci(rawFoci);
  return merged;
}

export function presetToInput(patternId: string, patterns: { id: string; preset: Partial<TiradsAcrInput> }[]): TiradsAcrInput | null {
  const p = patterns.find((x) => x.id === patternId);
  if (!p) return null;
  return mergeTiradsInput({ ...p.preset, patternId });
}

function labelFor<T extends string>(options: { value: T; labelRu: string }[], value: T): string {
  return options.find((o) => o.value === value)?.labelRu ?? value;
}

function fociLabels(foci: TiradsEchogenicFoci[]): string {
  return normalizeEchogenicFoci(foci)
    .map((f) => labelFor(ECHOGENIC_FOCI_OPTIONS, f))
    .join("; ");
}

export function generateStructuredThyroidReport(input: TiradsAcrInput) {
  const result = evaluateAcrTirads(input);
  const lines: string[] = [
    "ПРОТОКОЛ УЗИ ЩИТОВИДНОЙ ЖЕЛЕЗЫ (ACR TI-RADS)",
    `Движок: ${result.engineVersion}`,
    "",
    "ЩИТОВИДНАЯ ЖЕЛЕЗА",
    `Объём: ${input.thyroidVolumeMl !== undefined ? `${input.thyroidVolumeMl} мл` : "не указан"}`,
    `Parenchyma echogenicity: ${input.parenchymaEchogenicity ?? "не описана"}`,
    `Parenchyma vascularity: ${input.parenchymaVascularity ?? "не описана"}`,
    "",
    "УЗЛОВОЕ ОБРАЗОВАНИЕ",
    input.noduleLocation ? `Локализация: ${input.noduleLocation}` : "Локализация: не указана",
    `Composition: ${labelFor(COMPOSITION_OPTIONS, input.composition)} (+${result.scoreBreakdown.composition})`,
    `Echogenicity: ${labelFor(ECHOGENICITY_OPTIONS, input.echogenicity)} (+${result.scoreBreakdown.echogenicity})`,
    `Shape: ${labelFor(SHAPE_OPTIONS, input.shape)} (+${result.scoreBreakdown.shape})`,
    `Margin: ${labelFor(MARGIN_OPTIONS, input.margin)} (+${result.scoreBreakdown.margin})`,
    `Echogenic foci: ${fociLabels(input.echogenicFoci)} (+${result.scoreBreakdown.echogenicFoci})`,
    input.largestDiameterMm !== undefined ? `Наибольший диаметр: ${formatMm(input.largestDiameterMm)}` : "Размер: не указан",
    "",
    "РЕГИОНАРНЫЕ ЛИМФОУЗЛЫ",
    result.lymphNodeNote ?? "Не оценивались.",
    "",
    "TI-RADS ASSESSMENT",
    `${result.categoryLabel} · ${result.totalPoints} баллов · риск ${result.malignancyRisk}`,
    "",
    "РЕКОМЕНДАЦИИ",
    result.fnaRecommended ? `FNA: рекомендована. ${result.fnaRationale}` : `FNA: не показана. ${result.fnaRationale}`,
    `Follow-up: ${result.followUpRecommendation}`,
    "",
    "Заключение носит характер клинической поддержки; интерпретация — специалистом. Не является диагнозом.",
  ];
  return { result, fullProtocol: lines.join("\n") };
}
