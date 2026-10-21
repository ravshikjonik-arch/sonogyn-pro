/** Loose SSOT shape for archive JSON (96 tables). */

export type GaPoint = { weeks: number; days?: number };

export type ArchiveParameter = {
  id: string;
  labelRu: string;
  unit: string;
};

export type PercentileTriplet = {
  p5?: number;
  p50?: number;
  p95?: number;
  p2_5?: number;
  p97_5?: number;
  p10?: number;
  p90?: number;
};

export type MeanRangeTriplet = {
  mean: number;
  rangeMin: number;
  rangeMax: number;
};

export type ArchiveTableDocument = {
  tableId: string;
  titleRu: string;
  source?: string;
  clinicalBlock?: string;
  tableType: string;
  parameter?: ArchiveParameter;
  parameters?: ArchiveParameter[];
  xAxis?: ArchiveParameter;
  gaAxis?: string;
  gaAxisNote?: string;
  outputGaFormat?: string;
  percentileLabels?: { low?: string; mid?: string; high?: string };
  partial?: boolean;
  partialNote?: string;
  rows: Record<string, unknown>[];
  verified?: boolean;
  verificationSource?: string;
  /** Internal scan reference — never show in product UI */
  sourceCard?: string;
};
