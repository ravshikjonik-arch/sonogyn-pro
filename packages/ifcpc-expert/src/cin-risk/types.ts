/** CIN / AIS / invasion risk calculator — input & output types. */

export type BethesdaCytology =
  | "nilm"
  | "ascus"
  | "lsil"
  | "asc_h"
  | "hsil"
  | "agc"
  | "unsatisfactory";

export type HpvStatus = "negative" | "positive" | "not_tested";

export type PriorBiopsyResult =
  | "none"
  | "negative"
  | "cin1"
  | "cin2"
  | "cin3"
  | "ais"
  | "invasion";

export type PriorCinTreatmentHistory =
  | "none"
  | "excision_success"
  | "excision_incomplete"
  | "ablation"
  | "repeat_treatment";

export type CinRiskOutcome = "normal" | "cin1" | "cin2" | "cin3" | "ais" | "invasion";

export type CinRiskTier =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "very_high";

export type InvasionRiskTier = "negligible" | "low" | "moderate" | "high";

/** Calculator input — all parameters from clinical protocol. */
export type CinRiskCalculatorInput = {
  age: number;
  hpvStatus: HpvStatus;
  hpv16Positive: boolean;
  hpv18Positive: boolean;
  otherHrHpvPositive: boolean;
  cytology: BethesdaCytology;
  transformationZoneTypeId: "tz1" | "tz2" | "tz3";
  /** IFCPC finding sign ids (normal + abnormal + invasion sections). */
  ifcpcFindingSignIds: string[];
  priorBiopsy: PriorBiopsyResult;
  immunodeficiency: boolean;
  pregnancy: boolean;
  priorCinTreatment: PriorCinTreatmentHistory;
};

export type CinRiskProbability = {
  outcome: CinRiskOutcome;
  labelRu: string;
  probability: number;
  percentage: number;
};

export type CinRiskTierInfo = {
  tier: CinRiskTier;
  labelRu: string;
  color: string;
};

export type CinRiskCalculatorResult = {
  /** Mutually exclusive histology probabilities (sum ≈ 1). */
  probabilities: CinRiskProbability[];
  cin1: number;
  cin2: number;
  cin3: number;
  ais: number;
  invasion: number;
  cin2plus: number;
  cin3plus: number;
  cin2plusPercentage: number;
  cin3plusPercentage: number;
  invasionPercentage: number;
  cin2plusTier: CinRiskTierInfo;
  invasionTier: { tier: InvasionRiskTier; labelRu: string; color: string };
  /** Transparent audit trail for teaching. */
  algorithmSteps: string[];
  /** Logit contributions per outcome before softmax. */
  logitBreakdown: Record<CinRiskOutcome, number>;
  recommendation: CinRiskRecommendation;
  disclaimer: string;
  modelVersion: string;
};

export type CinRiskRecommendation = {
  summary: string;
  actions: string[];
  followUp: string;
  urgency: "routine" | "soon" | "urgent" | "emergency";
  references: string[];
};

export type CinRiskCoefficientsDocument = {
  $schema: string;
  meta: {
    id: string;
    title: string;
    version: string;
    method: string;
    disclaimer: string;
    references: string[];
    formula: {
      description: string;
      logit: string;
      probability: string;
      cin2plus: string;
      note: string;
    };
  };
  outcomes: CinRiskOutcome[];
  bethesdaPriors: Record<BethesdaCytology, Record<CinRiskOutcome, number>>;
  hpvModifiers: Record<string, Record<CinRiskOutcome, number>>;
  transformationZone: Record<string, Record<CinRiskOutcome, number>>;
  ifcpcSectionWeights: Record<string, Record<CinRiskOutcome, number>>;
  priorBiopsy: Record<PriorBiopsyResult, Record<CinRiskOutcome, number>>;
  priorCinTreatment: Record<PriorCinTreatmentHistory, Record<CinRiskOutcome, number>>;
  clinicalModifiers: Record<string, Record<CinRiskOutcome, number>>;
  riskTierThresholds: {
    cin2plus: { tier: string; max: number; color: string; labelRu: string }[];
    invasion: { tier: string; max: number; color: string; labelRu: string }[];
  };
};
