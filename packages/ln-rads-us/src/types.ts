/** LN-RADS US — structured lymph node ultrasound descriptors. */

export type LnRadsCategory = 1 | 2 | 3 | 4 | 5;

export type LnShape = "oval" | "round" | "lobulated" | "spiculated" | "irregular";
export type LnCapsule = "intact" | "thickened" | "interrupted" | "infiltrated";
export type LnHilum = "preserved" | "compressed" | "displaced" | "absent";
export type LnCortex =
  | "thin"
  | "uniform_thickening"
  | "focal_thickening"
  | "eccentric_thickening"
  | "bulging";
export type LnEchogenicity = "normal" | "hypoechoic" | "markedly_hypoechoic" | "heterogeneous";
export type LnArchitecture = "preserved" | "distorted" | "replaced";
export type LnVascularity =
  | "hilar"
  | "central"
  | "mixed"
  | "peripheral"
  | "penetrating"
  | "chaotic"
  | "absent";
export type LnCalcifications = "none" | "microcalcifications" | "coarse";
export type LnNecrosis = "absent" | "partial" | "extensive";
export type LnCysticDegeneration = "absent" | "present";
export type LnExtracapsularExtension = "no" | "suspected" | "definite";
export type LnMatting = "absent" | "present";
export type LnElastography = "soft" | "intermediate" | "stiff" | "not_assessed";
export type LnCeus =
  | "not_assessed"
  | "homogeneous"
  | "heterogeneous"
  | "peripheral"
  | "non_enhancing_necrosis";

export type LnAnatomicalRegion =
  | "head_neck"
  | "level_i"
  | "level_ii"
  | "level_iii"
  | "level_iv"
  | "level_v"
  | "level_vi"
  | "level_vii"
  | "axillary"
  | "internal_mammary"
  | "supraclavicular"
  | "pelvic"
  | "external_iliac"
  | "internal_iliac"
  | "obturator"
  | "common_iliac"
  | "paraaortic"
  | "inguinal"
  | "other";

export type LnClinicalContext =
  | "screening"
  | "known_primary"
  | "inflammatory"
  | "post_treatment"
  | "surveillance";

export type LnPatternId =
  | "oval"
  | "round"
  | "lobulated"
  | "spiculated"
  | "necrotic"
  | "cystic"
  | "calcified"
  | "reactive";

export type LnRadsInput = {
  /** Long axis (mm) */
  longAxisMm: number;
  /** Short axis (mm) */
  shortAxisMm: number;
  /** Optional cortex thickness (mm) */
  cortexThicknessMm?: number;
  shape: LnShape;
  capsule: LnCapsule;
  hilum: LnHilum;
  cortex: LnCortex;
  echogenicity: LnEchogenicity;
  architecture: LnArchitecture;
  vascularity: LnVascularity;
  calcifications: LnCalcifications;
  necrosis: LnNecrosis;
  cysticDegeneration: LnCysticDegeneration;
  extracapsularExtension: LnExtracapsularExtension;
  matting: LnMatting;
  elastography?: LnElastography;
  ceus?: LnCeus;
  region: LnAnatomicalRegion;
  clinicalContext?: LnClinicalContext;
  /** Known primary malignancy if applicable */
  primarySite?: string;
  notes?: string;
};

export type LnSizeAnalysis = {
  longAxisMm: number;
  shortAxisMm: number;
  lsRatio: number | null;
  interpretation: string;
  riskContribution: "low" | "intermediate" | "high";
  teachingNote: string;
};

export type LnDopplerAnalysis = {
  pattern: LnVascularity;
  riskContribution: "low" | "intermediate" | "high";
  clinicalSignificance: string;
  teachingExplanation: string;
};

export type LnRadsResult = {
  category: LnRadsCategory;
  score: number;
  malignancyRisk: string;
  title: string;
  decisionPath: string[];
  sizeAnalysis: LnSizeAnalysis;
  dopplerAnalysis: LnDopplerAnalysis;
  redFlags: string[];
  biopsyRecommended: boolean;
  followUpRecommended: boolean;
  additionalImaging: string[];
  management: string;
};

export type LnReportLevel = "short" | "standard" | "expert";

export type LnReportTemplate =
  | "normal"
  | "reactive"
  | "inflammatory"
  | "suspicious"
  | "metastatic"
  | "lymphoma";
