/** ACR TI-RADS (2017/2023) — типы калькулятора SonoGyn-Pro. */

export type TiradsAcrCategory = "TR1" | "TR2" | "TR3" | "TR4" | "TR5";

export type TiradsComposition =
  | "no_nodule"
  | "cystic"
  | "spongiform"
  | "mixed"
  | "solid";

export type TiradsEchogenicity =
  | "anechoic"
  | "hyperechoic_or_isoechoic"
  | "hypoechoic"
  | "very_hypoechoic";

export type TiradsShape = "wider_than_tall" | "taller_than_wide";

export type TiradsMargin =
  | "smooth"
  | "ill_defined"
  | "lobulated_or_irregular"
  | "extrathyroidal_extension";

export type TiradsEchogenicFoci =
  | "none_or_comet_tail"
  | "macrocalcifications"
  | "peripheral_rim"
  | "punctate";

export type LymphNodeAssessment =
  | "not_assessed"
  | "benign"
  | "indeterminate"
  | "suspicious";

export type TiradsAcrInput = {
  composition: TiradsComposition;
  echogenicity: TiradsEchogenicity;
  shape: TiradsShape;
  margin: TiradsMargin;
  /** ACR: choose all that apply; points are summed. */
  echogenicFoci: TiradsEchogenicFoci[];
  largestDiameterMm?: number;
  /** Объём ЩЖ (мл) — для протокола. */
  thyroidVolumeMl?: number;
  parenchymaEchogenicity?: string;
  parenchymaVascularity?: string;
  noduleLocation?: string;
  lymphNodes?: LymphNodeAssessment;
  /** Паттерн из библиотеки (pattern id). */
  patternId?: string;
};

export type TiradsScoreBreakdown = {
  composition: number;
  echogenicity: number;
  shape: number;
  margin: number;
  echogenicFoci: number;
  total: number;
};

export type TiradsAcrResult = {
  category: TiradsAcrCategory;
  categoryLabel: string;
  totalPoints: number;
  scoreBreakdown: TiradsScoreBreakdown;
  malignancyRisk: string;
  riskLevel: "very_low" | "low" | "intermediate" | "high" | "none";
  fnaRecommended: boolean;
  fnaRationale: string;
  followUpRecommendation: string;
  observationRecommendation: string;
  lymphNodeNote?: string;
  rationale: string[];
  clinicalSignificance: string;
  /** Engine stamp for protocol / changelog. */
  engineVersion: string;
};
