/** Базовая полоса p5 / p50 / p95 (мм). */
export type PercentileBand = {
  p5: number;
  p50: number;
  p95: number;
};

/** Расширенная полоса P3–P97 (мм), производная от p5/p50/p95. */
export type PercentileBandFull = {
  p3: number;
  p5: number;
  p10: number;
  p50: number;
  p90: number;
  p95: number;
  p97: number;
};

export type EarlyBiometryParameter = "msd" | "ysd" | "crl";

export type EarlyBiometryFlag =
  | "low"
  | "normal"
  | "high"
  | "critical_low"
  | "critical_high"
  | "unknown"
  | "out_of_range";

export type EarlyBiometryAssessment = {
  parameter: EarlyBiometryParameter;
  label: string;
  valueMm: number;
  gaDays: number;
  gaLabel: string;
  reference: PercentileBandFull | null;
  percentile?: number;
  flag: EarlyBiometryFlag;
  summary: string;
};

export type EarlyPregnancyGrowthInput = {
  /** Срок в днях от ДПМ или по КТР. */
  gaDays?: number;
  msdMm?: number;
  ysdMm?: number;
  crlMm?: number;
};

export type GaReferenceRow = {
  gaDays: number;
  gaLabel: string;
  band: PercentileBand;
};
