/** BI-RADS Mammography — категории ACR (общие с US). */
export type BiradsCategoryCode = "0" | "1" | "2" | "3" | "4A" | "4B" | "4C" | "5" | "6";

export type BiradsMmgFindingType =
  | "negative"
  | "mass"
  | "calcifications"
  | "asymmetry"
  | "architectural_distortion"
  | "associated_only";

export type BiradsMmgInput = {
  /** Плотность паренхимы A–D (ACR). */
  breastComposition?: string;
  findingType: BiradsMmgFindingType;
  /** Локализация свободным текстом (квадрант / часы / глубина). */
  localizationText?: string;
  /** Mass */
  massShape?: string;
  massMargin?: string;
  massDensity?: string;
  /** Calcifications */
  calcMorphology?: string;
  calcDistribution?: string;
  /** Asymmetry */
  asymmetryType?: string;
  /** Associated features */
  associatedFeatures?: string[];
  /** Сравнение с предыдущими */
  comparison?: string;
  /** Ручная категория врача */
  biradsCategoryManual?: BiradsCategoryCode;
  conclusionDraft?: string;
};

export type BiradsMmgResult = {
  category: string;
  categoryCode: BiradsCategoryCode;
  riskRange: string;
  description: string;
  impression: string;
  suggestedAutomatically: boolean;
};
