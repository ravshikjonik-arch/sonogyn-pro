import type { AcrStrictInput, AcrStrictResult } from "../acr-strict";
import type { LymphNodeAssessment } from "../types";
import type { EuPolicyProfile, EuTiradsInput, EuTiradsResult } from "../eu";

export type ThyroidNoduleLocation = "right_lobe" | "left_lobe" | "isthmus";

export type ThyroidNoduleDimensionsMm = {
  longitudinal?: number;
  anteroposterior?: number;
  transverse?: number;
};

/** EU and ACR answers are kept separately: the two lexicons are not interchangeable. */
export type ThyroidNodule = {
  id: string;
  location?: ThyroidNoduleLocation;
  dimensionsMm?: ThyroidNoduleDimensionsMm;
  eu?: Omit<EuTiradsInput, "maxDiameterMm" | "lymphNodes" | "isPediatric">;
  acr?: Omit<AcrStrictInput, "largestDiameterMm" | "lymphNodes" | "isPediatric">;
};

/** Regional lymph nodes are assessed once per study, separately from any nodule category. */
export type ThyroidStudyInput = {
  nodules: ThyroidNodule[];
  lymphNodes?: "not_assessed" | "normal" | "indeterminate" | "suspicious";
  isPediatric?: boolean;
  euProfile: EuPolicyProfile;
};

export type ThyroidNoduleEvaluation = {
  noduleId: string;
  location?: ThyroidNoduleLocation;
  dimensionsMm?: ThyroidNoduleDimensionsMm;
  maxDiameterMm?: number;
  eu: EuTiradsResult | null;
  acr: AcrStrictResult | null;
};

export type ThyroidComparisonRow = {
  noduleId: string;
  euCategory: number | null;
  acrCategory: string | null;
  euFna: string | null;
  acrFna: string | null;
  /** null when one of the systems has no final result. */
  fnaAgreement: boolean | null;
  noteRu: string | null;
};

export type ThyroidStudyEvaluation = {
  nodules: ThyroidNoduleEvaluation[];
  /** Nodule with the highest category per system (ties → larger diameter). */
  highestEu: string | null;
  highestAcr: string | null;
  comparison: ThyroidComparisonRow[];
  errors: { noduleId: string; messageRu: string }[];
};

export type ThyroidReportSystem = "eu" | "acr" | "both";

export type ThyroidReport = {
  descriptionRu: string;
  conclusionRu: string;
  tacticsRu: string;
  warningsRu: string[];
  sourcesRu: string[];
  disclaimerRu: string;
};

export type ThyroidLymphNodes = ThyroidStudyInput["lymphNodes"];

export function toAcrLymphNodes(value: ThyroidLymphNodes): LymphNodeAssessment | undefined {
  if (value === undefined) return undefined;
  return value === "normal" ? "benign" : value;
}
