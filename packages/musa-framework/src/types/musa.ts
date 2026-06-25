/** Sonogyn MUSA Framework — shared taxonomy for uterine ultrasound education modules. */

export type MusaModuleStatus = "ready" | "beta" | "planned";

export type MusaFrameworkModuleId =
  | "adenomyosis"
  | "fibroids"
  | "endometrium"
  | "orads_us"
  | "orads_mri"
  | "idea_endometriosis"
  | "musa_myometrium"
  | "esge";

export type MusaFrameworkModule = {
  id: MusaFrameworkModuleId;
  titleRu: string;
  titleEn: string;
  standard: string;
  status: MusaModuleStatus;
  route?: string;
  descriptionRu: string;
};

/** Sonogyn localization map (MUSA adenomyosis). */
export type MusaLocalizationCode = "AW" | "PW" | "FU" | "RL" | "LL" | "CX";

export type MusaDepthCode = "A0" | "A1" | "A2" | "A3" | "A4";

export type MusaJzClass = "JZ-0" | "JZ-1" | "JZ-2" | "JZ-3";

export type MusaJzIrregularity = "JZ-I" | "JZ-II" | "JZ-III";

export type MusaUterineContour = "U0" | "U1" | "U2" | "U3";

export type MusaAdenomyosisMorphotype = "D" | "F" | "AM" | "C";

export type MusaProbabilityCategory = "low" | "possible" | "probable" | "highly_probable";

export type MusaScoreBadgeColor = "green" | "yellow" | "orange" | "red";

export type MusaEducationalFeatureCard = {
  id: string;
  category: "direct" | "indirect" | "junctional_zone" | "localization" | "depth" | "morphotype";
  title: string;
  titleEn: string;
  musa_term: string;
  definition: string;
  pathology: string;
  ultrasound_appearance: string;
  key_features: string[];
  differential_diagnosis: string[];
  diagnostic_value: string;
  pitfalls: string[];
  score_points: number;
  clinical_relevance: string;
  reporting_phrase: string;
};

export type MusaSlide = {
  id: string;
  number: number;
  title: string;
  blocks: Array<{ heading: string; items: string[]; tone?: "info" | "warning" | "tip" }>;
};

export type MusaLocalizedString = {
  ru: string;
  en: string;
};
