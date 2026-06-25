export interface PercentileResult {
  parameterId: string;
  labelRu: string;
  value: number;
  expected: number;
  sd: number;
  percentile: number;
  zScore: number;
  mom: number;
  interpretation: string;
  source: string;
  engine: "fmf" | "custom";
  /** P3–P97 band at current x */
  band?: PercentileBandFull;
  /** Optional growth velocity mm/day between two measurements */
  growthVelocityMmPerDay?: number;
  /** Derived GA from CRL (mm) when applicable */
  gestationalAgeDays?: number;
  flag?: PercentileFlag;
}

export type PercentileFlag =
  | "normal"
  | "low"
  | "high"
  | "critical_low"
  | "critical_high"
  | "out_of_range"
  | "unknown";

export type PercentileBandFull = {
  p3: number;
  p5: number;
  p10: number;
  p50: number;
  p90: number;
  p95: number;
  p97: number;
};

export type MeanSdAnchor = {
  gaDays?: number;
  gaWeeks?: number;
  mean: number;
  sd: number;
};

export type ReferenceCurveJson = {
  id: string;
  label: string;
  labelRu: string;
  engine: "fmf" | "custom";
  source: string;
  unit?: string;
  xAxis?: { type: "gaDays" | "gaWeeks" | "crl"; min?: number; max?: number };
  model?: {
    type: "mean_sd_anchors" | "log_linear_regression";
    anchors?: MeanSdAnchor[];
    predictor?: { parameter: string; unit: string; min: number; max: number };
    mean?: {
      intercept: number;
      slope: number;
      xScale?: number;
      yTransform?: "exp" | "none";
    };
    sdLog?: number;
  };
  clinical?: Record<string, number | string>;
  percentileDisplay?: number[];
  supportsGrowthVelocity?: boolean;
  supportsGaFromValue?: boolean;
};

export type CategoricalResult = {
  parameterId: string;
  labelRu: string;
  category: string;
  likelihoodRatio?: number;
  interpretation: string;
  source: string;
};

export type FirstTrimesterScreeningInput = {
  gaDays?: number;
  gaWeeks?: number;
  msdMm?: number;
  priorMsdMm?: number;
  priorMsdGaDays?: number;
  ysdMm?: number;
  crlMm?: number;
  priorCrlMm?: number;
  priorCrlGaDays?: number;
  ntMm?: number;
  nasalBone?: "present" | "absent" | "hypoplastic" | "uncertain" | "seen" | "not_seen";
  dvPi?: number;
  dvAWave?: "positive" | "absent" | "reversed";
  tricuspidVelocityCmS?: number;
  tricuspidDurationFraction?: number;
  tricuspidRegurg?: "none" | "present" | "unknown";
  fhrBpm?: number;
  uterinePiLeft?: number;
  uterinePiRight?: number;
  sbpMmHg?: number;
  dbpMmHg?: number;
};

export type FirstTrimesterScreeningOutput = {
  measurements: PercentileResult[];
  categorical: CategoricalResult[];
  mapMmHg?: number;
  uterinePiMean?: number;
};
