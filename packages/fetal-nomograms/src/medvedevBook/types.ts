export type FetometrySection =
  | "t1"
  | "t2_base"
  | "extended"
  | "heart"
  | "doppler"
  | "appendix";

export type FetometryPopulation = "moscow" | "kazakhstan" | "belarus" | "uzbekistan";

export type FetometryAxis =
  | "ga_weeks"
  | "ga_string"
  | "ga_range"
  | "crl_exact"
  | "crl_range"
  | "bpd_range"
  | "svd";

export type PercentileKind = "p5_p95" | "p2_5_p97_5" | "p50_p95" | "mom" | "ga_strings";

export type FetometryBand = {
  pLow?: number;
  p50?: number;
  pHigh?: number;
  median?: number;
  mom1_5?: number;
  /** GA strings like "5/3" for SVD→срок */
  gaP5?: string;
  gaP50?: string;
  gaP95?: string;
};

export type FetometryRow = {
  gaWeeks?: number;
  /** Fractional days within week for ga_string rows like 7/0 */
  gaDays?: number;
  gaRange?: [number, number];
  crlMm?: number;
  crlRange?: [number, number];
  bpdRange?: [number, number];
  svdMm?: number;
  band: FetometryBand;
  label?: string;
};

export type FetometryTable = {
  /** Stable measurement key used by UI / panel, e.g. `nt`, `bpd`, `mca_psv` */
  id: string;
  bookTableId: string;
  titleRu: string;
  unit: string;
  axis: FetometryAxis;
  percentileKind: PercentileKind;
  section: FetometrySection;
  population?: FetometryPopulation;
  rows: FetometryRow[];
};

export type ZoneFlag = "below" | "normal" | "above" | "mom_alert" | "mom_ok" | "out_of_range" | "dating";

export type EvaluateContext = {
  gaWeeks?: number;
  gaDays?: number;
  crlMm?: number;
  bpdMm?: number;
  svdMm?: number;
  population?: FetometryPopulation;
};

export type MeasurementResult = {
  id: string;
  titleRu: string;
  unit: string;
  value: number | string;
  zone: ZoneFlag;
  zoneLabelRu: string;
  pLow?: number;
  p50?: number;
  pHigh?: number;
  median?: number;
  mom1_5?: number;
  nearestPercentileHint?: string;
  matchedLabel?: string;
  bookTableId: string;
};

export type PanelSummary = {
  below: number;
  normal: number;
  above: number;
  momAlert: number;
  other: number;
};

export type PanelResult = {
  results: MeasurementResult[];
  summary: PanelSummary;
  warnings: readonly { id: string; messageRu: string }[];
  disclaimer: string;
  sourceVersion: string;
};
