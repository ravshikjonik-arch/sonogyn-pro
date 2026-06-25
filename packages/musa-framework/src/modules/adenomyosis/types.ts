import type {
  MusaAdenomyosisMorphotype,
  MusaDepthCode,
  MusaEducationalFeatureCard,
  MusaJzClass,
  MusaJzIrregularity,
  MusaLocalizationCode,
  MusaSlide,
  MusaUterineContour,
} from "../../types/musa";

import knowledgeJson from "./data/musa-adenomyosis.json";

export type MusaAdenomyosisKnowledge = typeof knowledgeJson;

export type MusaAdenomyosisScoreInput = {
  myometrialCysts: boolean;
  hyperechogenicIslands: boolean;
  subendometrialStriations: boolean;
  jzThicknessMm?: number | null;
  heterogeneousMyometrium: boolean;
  asymmetry: boolean;
  globularUterus: boolean;
  fanShapedShadowing: boolean;
};

export type MusaAdenomyosisAssessmentInput = MusaAdenomyosisScoreInput & {
  localization?: MusaLocalizationCode[];
  depthOfInvasion?: MusaDepthCode;
  morphologicType?: MusaAdenomyosisMorphotype;
  jzIrregularity?: MusaJzIrregularity;
  uterineContour?: MusaUterineContour;
  anteriorWallMm?: number | null;
  posteriorWallMm?: number | null;
};

export type MusaAdenomyosisReport = {
  structuredReport: string;
  clinicalImpression: string;
  sonogynScore: number;
  maxScore: number;
  probabilityCategory: string;
  probabilityLabelRu: string;
  suggestedDiagnosis: string;
  badgeColor: "green" | "yellow" | "orange" | "red";
  featureBullets: string[];
  disclaimer: string;
};

export const MUSA_ADENOMYOSIS_KNOWLEDGE = knowledgeJson as MusaAdenomyosisKnowledge;

export function getDirectFeatures(): MusaEducationalFeatureCard[] {
  return MUSA_ADENOMYOSIS_KNOWLEDGE.directFeatures as MusaEducationalFeatureCard[];
}

export function getIndirectFeatures(): MusaEducationalFeatureCard[] {
  return MUSA_ADENOMYOSIS_KNOWLEDGE.indirectFeatures as MusaEducationalFeatureCard[];
}

export function getSlides(): MusaSlide[] {
  return MUSA_ADENOMYOSIS_KNOWLEDGE.slides as MusaSlide[];
}

export function classifyJzThickness(mm: number | null | undefined): MusaJzClass {
  if (mm == null || !Number.isFinite(mm) || mm < 8) return "JZ-0";
  if (mm <= 11) return "JZ-1";
  if (mm <= 15) return "JZ-2";
  return "JZ-3";
}

export function localizationLabel(code: MusaLocalizationCode, locale: "ru" | "en" = "ru"): string {
  const region = MUSA_ADENOMYOSIS_KNOWLEDGE.localization.regions.find((r) => r.code === code);
  if (!region) return code;
  return locale === "en" ? region.labelEn : region.labelRu;
}
