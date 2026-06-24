/**
 * Cervical Pathology Intelligence (CPI) — unified patient context & decision types.
 * Sources: IFCPC 2011, ASCCP 2019, WHO 2021, ESGO, КР МЗ РФ.
 */

export type CpiClinicalAction =
  | "observation"
  | "targeted_biopsy"
  | "ecc"
  | "lletz"
  | "conization"
  | "repeat_colposcopy"
  | "hpv_test_12mo"
  | "oncology_referral";

export type CpiHpvViralLoad = "not_available" | "low" | "high";

export type CpiRiskBand = "very_low" | "low" | "moderate" | "high" | "very_high" | "critical";

export type CpiGlandularSuspicion = "none" | "agc_nos" | "agc_favor_neoplasia" | "ais_suspected" | "confirmed_ais";

/** Block 7 — quality checklist for colposcopy documentation. */
export type CpiColposcopyQualityInput = {
  photoPreAcetic: boolean;
  photoPostAcetic: boolean;
  photoPostSchiller: boolean;
  tzDocumented: boolean;
  adequacyDocumented: boolean;
  scjDocumented: boolean;
};

/** Unified input — all 8 CPI blocks. */
export type CpiPatientInput = {
  age: number;
  pregnancy: boolean;
  immunodeficiency: boolean;

  /** Block 1 — IFCPC colposcopy */
  adequacyId: "adequacy_satisfactory" | "adequacy_unsatisfactory";
  scjVisibilityId: "scj_completely_visible" | "scj_partially_visible" | "scj_not_visible";
  transformationZoneTypeId: "tz1" | "tz2" | "tz3";
  ifcpcFindingSignIds: string[];

  /** Block 2 — HPV */
  hpvStatus: "negative" | "positive" | "not_tested";
  hpv16Positive: boolean;
  hpv18Positive: boolean;
  hpv3133455258Positive: boolean;
  otherHrHpvPositive: boolean;
  viralLoad: CpiHpvViralLoad;

  /** Block 3 — Bethesda cytology */
  cytology: "nilm" | "ascus" | "lsil" | "asc_h" | "hsil" | "agc" | "ais" | "unsatisfactory";

  /** Block 4 — glandular / AIS pathway */
  glandularSuspicion: CpiGlandularSuspicion;
  endocervicalComponentPresent: boolean | null;
  suspectedGlandularLesion: boolean;

  /** Block 6 — AI colposcopy (optional, future) */
  aiColposcopyEnabled?: boolean;
  aiSuggestedSignIds?: string[];
  aiCin2plusProbability?: number;
  aiCin3plusProbability?: number;

  /** Block 7 — quality (optional) */
  quality?: CpiColposcopyQualityInput;

  /** History & current biopsy */
  priorBiopsy: "none" | "negative" | "cin1" | "cin2" | "cin3" | "ais" | "invasion";
  priorCinTreatment: "none" | "excision_success" | "excision_incomplete" | "ablation" | "repeat_treatment";
  currentBiopsyResult: "none" | "negative" | "cin1" | "cin2" | "cin3" | "ais" | "invasion" | "pending";
};

export type CpiGuidelineSource = {
  id: string;
  organization: "IFCPC" | "ASCCP" | "WHO" | "ESGO" | "MZ_RF" | "NCCN";
  title: string;
  year: number;
  url?: string;
  citation: string;
};

export type CpiActionRecommendation = {
  action: CpiClinicalAction;
  labelRu: string;
  priority: "primary" | "secondary" | "conditional";
  rationale: string;
  sources: CpiGuidelineSource[];
  ruleIds: string[];
};

export type CpiBlockSummary = {
  blockId: string;
  titleRu: string;
  summary: string;
  riskContribution?: string;
};

export type CpiDecisionExplanation = {
  headline: string;
  narrative: string;
  decisionTreePath: string[];
  matchedRules: { ruleId: string; titleRu: string; explanation: string }[];
  blockSummaries: CpiBlockSummary[];
  sources: CpiGuidelineSource[];
};

export type CpiDecisionResult = {
  schema: "cpi.clinical-decision.v1";
  version: "1.0.0";
  computedAt: string;

  /** Block outputs */
  colposcopyConclusion: string;
  colposcopyRiskCategory: CpiRiskBand;
  hpvRiskBand: CpiRiskBand;
  combinedRiskBand: CpiRiskBand;
  tz3Alert: string | null;
  glandularAlert: string | null;
  qualityScore: number | null;
  qualityLabel: string | null;

  /** Block 8 — numeric risks */
  riskCin2plus: number;
  riskCin3plus: number;
  riskAis: number;
  riskInvasion: number;

  /** Clinical actions (deduplicated, ordered) */
  actions: CpiActionRecommendation[];

  /** Full explanation */
  explanation: CpiDecisionExplanation;

  disclaimer: string;
};

/** JSON Rules Engine — rule definition shape. */
export type CpiRuleCondition =
  | { field: string; op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "includes"; value: unknown }
  | { all: CpiRuleCondition[] }
  | { any: CpiRuleCondition[] };

export type CpiClinicalRule = {
  id: string;
  titleRu: string;
  priority: number;
  when: CpiRuleCondition;
  actions: CpiClinicalAction[];
  actionPriority: "primary" | "secondary" | "conditional";
  explanation: string;
  sourceIds: string[];
  blockId: string;
};

export type CpiRulesDocument = {
  $schema: string;
  version: string;
  sources: CpiGuidelineSource[];
  actionLabels: Record<CpiClinicalAction, string>;
  rules: CpiClinicalRule[];
};

export const CPI_ACTION_LABELS_RU: Record<CpiClinicalAction, string> = {
  observation: "Наблюдение",
  targeted_biopsy: "Прицельная биопсия",
  ecc: "ECC (эндоцервикальное curettage)",
  lletz: "LLETZ / LEEP",
  conization: "Конизация (диагностическая/лечебная)",
  repeat_colposcopy: "Повторная кольпоскопия",
  hpv_test_12mo: "HPV-тест через 12 месяцев",
  oncology_referral: "Направление к онкогинecologу",
};

export const CPI_DISCLAIMER =
  "Cervical Pathology Intelligence — система поддержки решений (CDS). Не заменяет очный осмотр, гистологию и клиническое суждение врача. Интерпретация — специалист.";
