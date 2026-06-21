/**
 * Mobile adapter: UI types → @repo/tirads-acr (единый движок с web).
 * Образовательный расчёт; клинические решения — врачу.
 */

import {
  ACR_TIRADS_VERSION,
  evaluateAcrTirads,
  mergeTiradsInput,
  patternById,
  type TiradsAcrInput,
  type TiradsAcrCategory,
} from "@repo/tirads-acr";

export { ACR_TIRADS_VERSION as TI_RADS_VERSION };
export type { TiradsAcrCategory as TiradsCategory };

export type TiradsComposition = "cystic" | "spongiform" | "mixed" | "solid" | "indeterminate";
export type TiradsEchogenicity = "anechoic" | "hyperechoic_isoechoic" | "hypoechoic" | "very_hypoechoic";
export type TiradsShape = "wider" | "taller";
export type TiradsMargin = "smooth" | "lobulated_irregular" | "ete";
export type TiradsFoci = "none" | "comet_small" | "coarse" | "rim" | "punctate";

export type TiradsInput = {
  composition: TiradsComposition;
  echogenicity: TiradsEchogenicity;
  shape: TiradsShape;
  margin: TiradsMargin;
  echogenicFoci: TiradsFoci;
  largestDiameterMm?: number;
};

export const defaultTiradsInput: TiradsInput = {
  composition: "mixed",
  echogenicity: "hypoechoic",
  shape: "wider",
  margin: "smooth",
  echogenicFoci: "none",
};

function toAcrInput(input: TiradsInput): TiradsAcrInput {
  const compositionMap: Record<TiradsComposition, TiradsAcrInput["composition"]> = {
    cystic: "cystic",
    spongiform: "spongiform",
    mixed: "mixed",
    solid: "solid",
    indeterminate: "solid",
  };
  const echogenicityMap: Record<TiradsEchogenicity, TiradsAcrInput["echogenicity"]> = {
    anechoic: "anechoic",
    hyperechoic_isoechoic: "hyperechoic_or_isoechoic",
    hypoechoic: "hypoechoic",
    very_hypoechoic: "very_hypoechoic",
  };
  const shapeMap: Record<TiradsShape, TiradsAcrInput["shape"]> = {
    wider: "wider_than_tall",
    taller: "taller_than_wide",
  };
  const marginMap: Record<TiradsMargin, TiradsAcrInput["margin"]> = {
    smooth: "smooth",
    lobulated_irregular: "lobulated_or_irregular",
    ete: "extrathyroidal_extension",
  };
  const fociMap: Record<TiradsFoci, TiradsAcrInput["echogenicFoci"]> = {
    none: "none_or_comet_tail",
    comet_small: "none_or_comet_tail",
    coarse: "macrocalcifications",
    rim: "peripheral_rim",
    punctate: "punctate",
  };

  return {
    composition: compositionMap[input.composition],
    echogenicity: echogenicityMap[input.echogenicity],
    shape: shapeMap[input.shape],
    margin: marginMap[input.margin],
    echogenicFoci: fociMap[input.echogenicFoci],
    largestDiameterMm: input.largestDiameterMm,
    lymphNodes: "not_assessed",
  };
}

export function fromAcrInput(acr: TiradsAcrInput): TiradsInput {
  const compositionRev: Record<TiradsAcrInput["composition"], TiradsComposition> = {
    no_nodule: "solid",
    cystic: "cystic",
    spongiform: "spongiform",
    mixed: "mixed",
    solid: "solid",
  };
  const echogenicityRev: Record<TiradsAcrInput["echogenicity"], TiradsEchogenicity> = {
    anechoic: "anechoic",
    hyperechoic_or_isoechoic: "hyperechoic_isoechoic",
    hypoechoic: "hypoechoic",
    very_hypoechoic: "very_hypoechoic",
  };
  const shapeRev: Record<TiradsAcrInput["shape"], TiradsShape> = {
    wider_than_tall: "wider",
    taller_than_wide: "taller",
  };
  const marginRev: Record<TiradsAcrInput["margin"], TiradsMargin> = {
    smooth: "smooth",
    ill_defined: "smooth",
    lobulated_or_irregular: "lobulated_irregular",
    extrathyroidal_extension: "ete",
  };
  const fociRev: Record<TiradsAcrInput["echogenicFoci"], TiradsFoci> = {
    none_or_comet_tail: "none",
    macrocalcifications: "coarse",
    peripheral_rim: "rim",
    punctate: "punctate",
  };

  return {
    composition: compositionRev[acr.composition],
    echogenicity: echogenicityRev[acr.echogenicity],
    shape: shapeRev[acr.shape],
    margin: marginRev[acr.margin],
    echogenicFoci: fociRev[acr.echogenicFoci],
    largestDiameterMm: acr.largestDiameterMm,
  };
}

/** Pattern Recognition → автозаполнение ACR калькulatorа (mobile). */
export function applyPatternToMobileInput(patternId: string): TiradsInput {
  const p = patternById(patternId);
  if (!p) return { ...defaultTiradsInput };
  const acr = mergeTiradsInput({ ...p.preset, patternId: p.id });
  return fromAcrInput(acr);
}

/** AI Assistant → ACR калькulator (mobile). */
export function applyAiResultToMobileInput(parsed: TiradsAcrInput): { input: TiradsInput; sizeText: string } {
  const input = fromAcrInput(parsed);
  const sizeText =
    parsed.largestDiameterMm !== undefined && Number.isFinite(parsed.largestDiameterMm)
      ? String(parsed.largestDiameterMm)
      : "";
  return { input, sizeText };
}

export type TiradsResult = {
  points: number;
  category: TiradsAcrCategory;
  categoryLabel: string;
  riskNarrative: string;
  fnaThresholdMm: number | null;
  fnaRecommendation: string;
  surveillanceHint: string;
};

function fnaThresholdMm(cat: TiradsAcrCategory): number | null {
  if (cat === "TR1" || cat === "TR2") return null;
  if (cat === "TR3") return 25;
  if (cat === "TR4") return 15;
  return 10;
}

export function sumTiradsPoints(input: TiradsInput): number {
  return evaluateAcrTirads(toAcrInput(input)).totalPoints;
}

export function categoryFromPoints(points: number): TiradsAcrCategory {
  if (points <= 0) return "TR2";
  if (points === 3) return "TR3";
  if (points >= 4 && points <= 6) return "TR4";
  if (points >= 7) return "TR5";
  return "TR2";
}

export function evaluateTirads(input: TiradsInput): TiradsResult {
  const acr = evaluateAcrTirads(toAcrInput(input));
  const threshold = fnaThresholdMm(acr.category);

  return {
    points: acr.totalPoints,
    category: acr.category,
    categoryLabel: acr.categoryLabel,
    riskNarrative: `Риск злокачественности (ACR): ${acr.malignancyRisk}. ${acr.clinicalSignificance}`,
    fnaThresholdMm: threshold,
    fnaRecommendation: acr.fnaRationale,
    surveillanceHint: acr.followUpRecommendation,
  };
}

const RU_COMP: Record<TiradsComposition, string> = {
  cystic: "кистозный / почти кистозный",
  spongiform: "губчатый",
  mixed: "смешанный",
  solid: "твёрдый / почти твёрдый",
  indeterminate: "не определить",
};
const RU_ECHO: Record<TiradsEchogenicity, string> = {
  anechoic: "анэхоидный",
  hyperechoic_isoechoic: "гипер- или изоэхогенный",
  hypoechoic: "гипоэхогенный",
  very_hypoechoic: "очень гипоэхогенный",
};
const RU_MARGIN: Record<TiradsMargin, string> = {
  smooth: "ровный / нечёткий",
  lobulated_irregular: "дольчатый / неровный",
  ete: "экстратиреоидное распространение",
};
const RU_FOCI: Record<TiradsFoci, string> = {
  none: "нет / крупный комет-хвост",
  comet_small: "мелкий комет-хвост",
  coarse: "крупные кальцификаты",
  rim: "периферический (rim) кальций",
  punctate: "пунктатные микрокальцификаты",
};

export function buildTiradsReportText(input: TiradsInput, res: TiradsResult): string {
  const echoNote =
    input.composition === "cystic" || input.composition === "spongiform"
      ? " (балл за эхогенность не суммируется по ACR)"
      : "";
  const lines = [
    `Щитовидная железа · ${ACR_TIRADS_VERSION}`,
    `Баллы: ${res.points} → ${res.category} (${res.categoryLabel})`,
    "",
    "Параметры:",
    `- Композиция: ${RU_COMP[input.composition]}`,
    `- Эхогенность: ${RU_ECHO[input.echogenicity]}${echoNote}`,
    `- Форма: ${input.shape === "wider" ? "шире, чем выше" : "выше, чем шире"}`,
    `- Контур: ${RU_MARGIN[input.margin]}`,
    `- Эхогенные включения: ${RU_FOCI[input.echogenicFoci]}`,
    input.largestDiameterMm != null && Number.isFinite(input.largestDiameterMm)
      ? `- Наибольший размер: ${input.largestDiameterMm} мм`
      : "- Наибольший размер: не указан",
    "",
    res.riskNarrative,
    "",
    "FNA:",
    res.fnaRecommendation,
    "",
    "Наблюдение:",
    res.surveillanceHint,
    "",
    "Дисклеймер: расчёт носит справочный характер; не заменяет заключение врача и локальные клинические рекомендации.",
  ];
  return lines.join("\n");
}
