import type { PercentileBandFull, PercentileFlag } from "@repo/fmf";

export type { PercentileBandFull, PercentileFlag };

export interface ObstetricMeasurementResult {
  parameterId: string;
  labelRu: string;
  value: number;
  expected: number;
  sd: number;
  percentile: number;
  zScore: number;
  mom: number;
  gestationalEquivalentWeeks?: number;
  growthVelocityMmPerDay?: number;
  interpretation: string;
  source: string;
  engine: "medvedev" | "hadlock" | "intergrowth" | "who";
  band?: PercentileBandFull;
  flag?: PercentileFlag;
  unit: string;
}

export type ClinicalFinding = {
  id: string;
  labelRu: string;
  severity: "info" | "mild" | "moderate" | "severe" | "critical";
  interpretation: string;
  source: string;
};

export type SkeletonIndexResult = {
  id: string;
  labelRu: string;
  ratio: number;
  expected?: number;
  percentile?: number;
  interpretation: string;
};

export type EfwAssessment = {
  grams: number;
  formula: string;
  expected: number;
  sd: number;
  percentile: number;
  zScore: number;
  mom: number;
  growthCategory: "sga" | "aga" | "lga" | "unknown";
  interpretation: string;
};

export type SecondThirdScreeningInput = {
  gaWeeks: number;
  gaDays?: number;
  bpdMm?: number;
  ofdMm?: number;
  hcMm?: number;
  acMm?: number;
  flMm?: number;
  hlMm?: number;
  ulnaMm?: number;
  radiusMm?: number;
  tibiaMm?: number;
  fibulaMm?: number;
  footLengthMm?: number;
  lateralVentriclesMm?: number;
  cisternaMagnaMm?: number;
  cerebellumMm?: number;
  priorMeasurements?: Partial<
    Record<string, { value: number; gaWeeks: number; gaDays?: number }>
  >;
};

export type SecondThirdScreeningOutput = {
  gaWeeksDecimal: number;
  measurements: ObstetricMeasurementResult[];
  efw?: EfwAssessment;
  skeletonIndices: SkeletonIndexResult[];
  findings: ClinicalFinding[];
};

export type ReferenceCurveJson = {
  id: string;
  label: string;
  labelRu: string;
  engine: string;
  source: string;
  unit?: string;
  xAxis?: { type: "gaWeeks" | "gaDays"; min?: number; max?: number };
  model?: {
    type: "mean_sd_anchors";
    anchors: Array<{ gaWeeks?: number; gaDays?: number; mean: number; sd: number }>;
  };
  percentileDisplay?: number[];
  supportsGrowthVelocity?: boolean;
  supportsGaFromValue?: boolean;
};
