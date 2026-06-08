/**
 * Допплер I скрининга и маточные артерии по таблицам Медведева.
 * Прил. 40 — ПИ венозного протока 11+0–14+0 (FMF).
 * Прил. 36 — ПИ маточных артерий по неделям (Медведев, 1996).
 */

import type { PercentileBand } from "./medvedevFirstTrimester";
import { percentileFromMedvedevBand } from "./medvedevFirstTrimester";

export const MEDVEDEV_DV_SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 40 (FMF, 11–14 нед).";

export const MEDVEDEV_DV_LATE_SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 41 (Kessler, 21–39 нед).";

export const MEDVEDEV_MCA_SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 39 (1996).";

export const MEDVEDEV_MCA_PSV_SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 38 (Mari, 2000).";

export const MEDVEDEV_UTA_SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 36 (1996).";

export const MEDVEDEV_UA_RI_SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 37 — ИР артерии пуповины (1996).";

export type MedvedevDopplerMarker =
  | "dvPi"
  | "uterinePiRight"
  | "uterinePiLeft"
  | "uterinePiMean"
  | "mcaPi"
  | "mcaPsv"
  | "uaRi";

export type McaPsvReference = {
  median: number;
  mom15Threshold: number;
};

export type MedvedevDopplerAssessment = {
  marker: MedvedevDopplerMarker;
  label: string;
  value?: number;
  reference:
    | PercentileBand
    | McaPsvReference
    | { min: number; meanLow: number; meanHigh: number; max: number }
    | null;
  percentile?: number;
  /** MoM для ПССК СМА (Прил. 38). */
  mom?: number;
  flag: "low" | "normal" | "high" | "unknown" | "out_of_range";
  summary: string;
};

type DvPiRow = {
  week: number;
  day: number;
  min: number;
  meanLow: number;
  meanHigh: number;
  max: number;
};

/** Прил. 40 — ПИ венозного протока по дням 11+0 … 14+0. */
const DV_PI_11_14: DvPiRow[] = [
  { week: 11, day: 0, min: 0.717, meanLow: 1.02, meanHigh: 1.053, max: 1.356 },
  { week: 11, day: 1, min: 0.702, meanLow: 1.005, meanHigh: 1.038, max: 1.341 },
  { week: 11, day: 2, min: 0.706, meanLow: 1.009, meanHigh: 1.042, max: 1.345 },
  { week: 11, day: 3, min: 0.71, meanLow: 1.013, meanHigh: 1.046, max: 1.35 },
  { week: 11, day: 4, min: 0.713, meanLow: 1.016, meanHigh: 1.049, max: 1.352 },
  { week: 11, day: 5, min: 0.715, meanLow: 1.019, meanHigh: 1.051, max: 1.355 },
  { week: 11, day: 6, min: 0.717, meanLow: 1.02, meanHigh: 1.053, max: 1.357 },
  { week: 12, day: 0, min: 0.718, meanLow: 1.022, meanHigh: 1.054, max: 1.358 },
  { week: 12, day: 1, min: 0.719, meanLow: 1.022, meanHigh: 1.055, max: 1.359 },
  { week: 12, day: 2, min: 0.719, meanLow: 1.022, meanHigh: 1.055, max: 1.358 },
  { week: 12, day: 3, min: 0.718, meanLow: 1.022, meanHigh: 1.054, max: 1.358 },
  { week: 12, day: 4, min: 0.717, meanLow: 1.02, meanHigh: 1.053, max: 1.356 },
  { week: 12, day: 5, min: 0.714, meanLow: 1.018, meanHigh: 1.051, max: 1.354 },
  { week: 12, day: 6, min: 0.711, meanLow: 1.015, meanHigh: 1.048, max: 1.351 },
  { week: 13, day: 0, min: 0.708, meanLow: 1.011, meanHigh: 1.044, max: 1.347 },
  { week: 13, day: 1, min: 0.703, meanLow: 1.006, meanHigh: 1.039, max: 1.342 },
  { week: 13, day: 2, min: 0.697, meanLow: 1.0, meanHigh: 1.033, max: 1.336 },
  { week: 13, day: 3, min: 0.69, meanLow: 0.994, meanHigh: 1.027, max: 1.33 },
  { week: 13, day: 4, min: 0.681, meanLow: 0.987, meanHigh: 1.019, max: 1.321 },
  { week: 13, day: 5, min: 0.672, meanLow: 0.976, meanHigh: 1.009, max: 1.312 },
  { week: 13, day: 6, min: 0.663, meanLow: 0.966, meanHigh: 0.999, max: 1.302 },
  { week: 14, day: 0, min: 0.652, meanLow: 0.956, meanHigh: 0.988, max: 1.292 },
];

/** Прил. 36 — ПИ маточных артерий (p5 / p50 / p95) по неделям. */
const UTA_PI_BY_WEEK: Record<number, PercentileBand> = {
  11: { p5: 1.02, p50: 1.82, p95: 2.62 },
  12: { p5: 0.99, p50: 1.75, p95: 2.51 },
  13: { p5: 0.96, p50: 1.68, p95: 2.4 },
  14: { p5: 0.89, p50: 1.61, p95: 2.34 },
  15: { p5: 0.8, p50: 1.54, p95: 2.28 },
  16: { p5: 0.77, p50: 1.47, p95: 2.17 },
  17: { p5: 0.7, p50: 1.4, p95: 2.1 },
  18: { p5: 0.68, p50: 1.34, p95: 2.0 },
  19: { p5: 0.66, p50: 1.28, p95: 1.9 },
  20: { p5: 0.62, p50: 1.22, p95: 1.82 },
  21: { p5: 0.61, p50: 1.16, p95: 1.71 },
  22: { p5: 0.6, p50: 1.1, p95: 1.6 },
  23: { p5: 0.6, p50: 1.05, p95: 1.5 },
  24: { p5: 0.59, p50: 1.0, p95: 1.41 },
  25: { p5: 0.57, p50: 0.95, p95: 1.33 },
  26: { p5: 0.56, p50: 0.9, p95: 1.24 },
  27: { p5: 0.55, p50: 0.86, p95: 1.17 },
  28: { p5: 0.54, p50: 0.82, p95: 1.1 },
  29: { p5: 0.52, p50: 0.79, p95: 1.06 },
  30: { p5: 0.51, p50: 0.76, p95: 1.01 },
  31: { p5: 0.51, p50: 0.73, p95: 0.95 },
  32: { p5: 0.5, p50: 0.71, p95: 0.92 },
  33: { p5: 0.49, p50: 0.69, p95: 0.89 },
  34: { p5: 0.48, p50: 0.67, p95: 0.86 },
  35: { p5: 0.47, p50: 0.66, p95: 0.85 },
  36: { p5: 0.46, p50: 0.65, p95: 0.84 },
  37: { p5: 0.45, p50: 0.64, p95: 0.83 },
  38: { p5: 0.45, p50: 0.64, p95: 0.83 },
  39: { p5: 0.45, p50: 0.64, p95: 0.83 },
  40: { p5: 0.45, p50: 0.63, p95: 0.83 },
};

/** Прил. 39 — ПИ средней мозговой артерии по неделям 20–40. */
const MCA_PI_BY_WEEK: Record<number, PercentileBand> = {
  20: { p5: 1.36, p50: 1.83, p95: 2.31 },
  21: { p5: 1.4, p50: 1.87, p95: 2.34 },
  22: { p5: 1.44, p50: 1.91, p95: 2.37 },
  23: { p5: 1.47, p50: 1.93, p95: 2.4 },
  24: { p5: 1.49, p50: 1.96, p95: 2.42 },
  25: { p5: 1.51, p50: 1.97, p95: 2.44 },
  26: { p5: 1.52, p50: 1.98, p95: 2.45 },
  27: { p5: 1.53, p50: 1.99, p95: 2.45 },
  28: { p5: 1.53, p50: 1.99, p95: 2.45 },
  29: { p5: 1.53, p50: 1.99, p95: 2.45 },
  30: { p5: 1.52, p50: 1.98, p95: 2.44 },
  31: { p5: 1.51, p50: 1.97, p95: 2.43 },
  32: { p5: 1.49, p50: 1.95, p95: 2.41 },
  33: { p5: 1.46, p50: 1.93, p95: 2.39 },
  34: { p5: 1.43, p50: 1.9, p95: 2.36 },
  35: { p5: 1.4, p50: 1.86, p95: 2.32 },
  36: { p5: 1.36, p50: 1.82, p95: 2.28 },
  37: { p5: 1.32, p50: 1.78, p95: 2.24 },
  38: { p5: 1.27, p50: 1.73, p95: 2.19 },
  39: { p5: 1.21, p50: 1.67, p95: 2.14 },
  40: { p5: 1.15, p50: 1.61, p95: 2.08 },
};

const MCA_WEEKS = Object.keys(MCA_PI_BY_WEEK)
  .map(Number)
  .sort((a, b) => a - b);

/** Прил. 41 — ПИ венозного протока 21–39 нед (Kessler). */
const DV_PI_LATE_BY_WEEK: Record<number, PercentileBand> = {
  21: { p5: 0.32, p50: 0.57, p95: 0.83 },
  22: { p5: 0.32, p50: 0.57, p95: 0.83 },
  23: { p5: 0.32, p50: 0.57, p95: 0.83 },
  24: { p5: 0.32, p50: 0.57, p95: 0.83 },
  25: { p5: 0.32, p50: 0.57, p95: 0.83 },
  26: { p5: 0.31, p50: 0.57, p95: 0.82 },
  27: { p5: 0.31, p50: 0.56, p95: 0.82 },
  28: { p5: 0.31, p50: 0.56, p95: 0.81 },
  29: { p5: 0.3, p50: 0.55, p95: 0.81 },
  30: { p5: 0.29, p50: 0.54, p95: 0.8 },
  31: { p5: 0.28, p50: 0.53, p95: 0.79 },
  32: { p5: 0.28, p50: 0.53, p95: 0.78 },
  33: { p5: 0.27, p50: 0.52, p95: 0.77 },
  34: { p5: 0.26, p50: 0.51, p95: 0.76 },
  35: { p5: 0.25, p50: 0.5, p95: 0.75 },
  36: { p5: 0.24, p50: 0.49, p95: 0.74 },
  37: { p5: 0.23, p50: 0.48, p95: 0.73 },
  38: { p5: 0.22, p50: 0.46, p95: 0.72 },
  39: { p5: 0.21, p50: 0.45, p95: 0.71 },
  40: { p5: 0.21, p50: 0.45, p95: 0.71 },
};

const DV_LATE_WEEKS = Object.keys(DV_PI_LATE_BY_WEEK)
  .map(Number)
  .sort((a, b) => a - b);

/** Прил. 37 — индекс резистентности (RI) артерии пуповины, 14–40 нед. */
const UA_RI_BY_WEEK: Record<number, PercentileBand> = {
  14: { p5: 0.69, p50: 0.79, p95: 0.89 },
  15: { p5: 0.68, p50: 0.78, p95: 0.88 },
  16: { p5: 0.67, p50: 0.77, p95: 0.87 },
  17: { p5: 0.66, p50: 0.76, p95: 0.86 },
  18: { p5: 0.65, p50: 0.75, p95: 0.85 },
  19: { p5: 0.64, p50: 0.74, p95: 0.84 },
  20: { p5: 0.63, p50: 0.74, p95: 0.84 },
  21: { p5: 0.62, p50: 0.73, p95: 0.83 },
  22: { p5: 0.61, p50: 0.72, p95: 0.82 },
  23: { p5: 0.6, p50: 0.71, p95: 0.82 },
  24: { p5: 0.59, p50: 0.7, p95: 0.81 },
  25: { p5: 0.58, p50: 0.69, p95: 0.8 },
  26: { p5: 0.58, p50: 0.68, p95: 0.79 },
  27: { p5: 0.57, p50: 0.67, p95: 0.79 },
  28: { p5: 0.56, p50: 0.66, p95: 0.78 },
  29: { p5: 0.55, p50: 0.65, p95: 0.78 },
  30: { p5: 0.54, p50: 0.64, p95: 0.77 },
  31: { p5: 0.53, p50: 0.63, p95: 0.76 },
  32: { p5: 0.52, p50: 0.62, p95: 0.75 },
  33: { p5: 0.51, p50: 0.61, p95: 0.74 },
  34: { p5: 0.49, p50: 0.6, p95: 0.73 },
  35: { p5: 0.48, p50: 0.59, p95: 0.72 },
  36: { p5: 0.46, p50: 0.58, p95: 0.71 },
  37: { p5: 0.44, p50: 0.57, p95: 0.7 },
  38: { p5: 0.43, p50: 0.56, p95: 0.69 },
  39: { p5: 0.42, p50: 0.55, p95: 0.68 },
  40: { p5: 0.41, p50: 0.54, p95: 0.67 },
};

const UA_RI_WEEKS = Object.keys(UA_RI_BY_WEEK)
  .map(Number)
  .sort((a, b) => a - b);

/** Прил. 38 — ПССК СМА (см/с): медиана и порог 1,5 MoM (Mari, 2000), 14–40 нед. */
const MCA_PSV_BY_WEEK: Record<number, McaPsvReference> = {
  14: { median: 19.9, mom15Threshold: 28.9 },
  15: { median: 20.2, mom15Threshold: 30.3 },
  16: { median: 21.1, mom15Threshold: 31.7 },
  17: { median: 22.1, mom15Threshold: 33.2 },
  18: { median: 23.2, mom15Threshold: 34.8 },
  19: { median: 24.3, mom15Threshold: 36.5 },
  20: { median: 25.5, mom15Threshold: 38.2 },
  21: { median: 26.7, mom15Threshold: 40.0 },
  22: { median: 27.9, mom15Threshold: 41.9 },
  23: { median: 29.3, mom15Threshold: 43.9 },
  24: { median: 30.7, mom15Threshold: 46.0 },
  25: { median: 32.1, mom15Threshold: 48.2 },
  26: { median: 33.6, mom15Threshold: 50.4 },
  27: { median: 35.2, mom15Threshold: 52.8 },
  28: { median: 36.9, mom15Threshold: 55.4 },
  29: { median: 38.7, mom15Threshold: 58.0 },
  30: { median: 40.5, mom15Threshold: 60.7 },
  31: { median: 42.4, mom15Threshold: 63.6 },
  32: { median: 44.4, mom15Threshold: 66.6 },
  33: { median: 46.5, mom15Threshold: 69.8 },
  34: { median: 48.7, mom15Threshold: 73.1 },
  35: { median: 51.1, mom15Threshold: 76.6 },
  36: { median: 53.5, mom15Threshold: 80.2 },
  37: { median: 56.0, mom15Threshold: 84.0 },
  38: { median: 58.7, mom15Threshold: 88.0 },
  39: { median: 61.5, mom15Threshold: 92.2 },
  40: { median: 64.4, mom15Threshold: 96.6 },
};

const MCA_PSV_WEEKS = Object.keys(MCA_PSV_BY_WEEK)
  .map(Number)
  .sort((a, b) => a - b);

const UTA_WEEKS = Object.keys(UTA_PI_BY_WEEK)
  .map(Number)
  .sort((a, b) => a - b);

function formatPi(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/, "");
}

function formatPsv(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

function lerpMcaPsv(a: McaPsvReference, b: McaPsvReference, t: number): McaPsvReference {
  return {
    median: a.median + (b.median - a.median) * t,
    mom15Threshold: a.mom15Threshold + (b.mom15Threshold - a.mom15Threshold) * t,
  };
}

function formatGaKey(week: number, day: number): string {
  return `${week}+${day}`;
}

export function gaDaysToWeekDay(totalDays: number): { week: number; day: number } {
  const week = Math.floor(totalDays / 7);
  const day = totalDays % 7;
  return { week, day };
}

export function getDvPiReference(gaDaysTotal: number): DvPiRow | null {
  const { week, day } = gaDaysToWeekDay(gaDaysTotal);
  if (week < 11 || week > 14) return null;
  if (week === 14 && day > 0) return null;
  return DV_PI_11_14.find((row) => row.week === week && row.day === day) ?? null;
}

function lerpBand(a: PercentileBand, b: PercentileBand, t: number): PercentileBand {
  return {
    p5: a.p5 + (b.p5 - a.p5) * t,
    p50: a.p50 + (b.p50 - a.p50) * t,
    p95: a.p95 + (b.p95 - a.p95) * t,
  };
}

/** Референс ПИ маточных артерий для дробного срока (нед + дни). */
export function getUterinePiReferenceBand(gaWeeksFraction: number): PercentileBand | null {
  if (!Number.isFinite(gaWeeksFraction) || gaWeeksFraction < UTA_WEEKS[0] || gaWeeksFraction > UTA_WEEKS[UTA_WEEKS.length - 1]) {
    return null;
  }

  if (gaWeeksFraction <= UTA_WEEKS[0]) return UTA_PI_BY_WEEK[UTA_WEEKS[0]];
  if (gaWeeksFraction >= UTA_WEEKS[UTA_WEEKS.length - 1]) return UTA_PI_BY_WEEK[UTA_WEEKS[UTA_WEEKS.length - 1]];

  for (let i = 0; i < UTA_WEEKS.length - 1; i += 1) {
    const w0 = UTA_WEEKS[i];
    const w1 = UTA_WEEKS[i + 1];
    if (gaWeeksFraction >= w0 && gaWeeksFraction <= w1) {
      const t = (gaWeeksFraction - w0) / (w1 - w0);
      return lerpBand(UTA_PI_BY_WEEK[w0], UTA_PI_BY_WEEK[w1], t);
    }
  }

  return UTA_PI_BY_WEEK[UTA_WEEKS[UTA_WEEKS.length - 1]];
}

export function getMcaPiReferenceBand(gaWeeksFraction: number): PercentileBand | null {
  if (!Number.isFinite(gaWeeksFraction) || gaWeeksFraction < MCA_WEEKS[0] || gaWeeksFraction > MCA_WEEKS[MCA_WEEKS.length - 1]) {
    return null;
  }
  if (gaWeeksFraction <= MCA_WEEKS[0]) return MCA_PI_BY_WEEK[MCA_WEEKS[0]];
  if (gaWeeksFraction >= MCA_WEEKS[MCA_WEEKS.length - 1]) return MCA_PI_BY_WEEK[MCA_WEEKS[MCA_WEEKS.length - 1]];
  for (let i = 0; i < MCA_WEEKS.length - 1; i += 1) {
    const w0 = MCA_WEEKS[i];
    const w1 = MCA_WEEKS[i + 1];
    if (gaWeeksFraction >= w0 && gaWeeksFraction <= w1) {
      const t = (gaWeeksFraction - w0) / (w1 - w0);
      return lerpBand(MCA_PI_BY_WEEK[w0], MCA_PI_BY_WEEK[w1], t);
    }
  }
  return MCA_PI_BY_WEEK[MCA_WEEKS[MCA_WEEKS.length - 1]];
}

export function listMcaPiAtWeek(week: number): { marker: "mcaPi"; label: string; reference: PercentileBand | null } {
  const reference = getMcaPiReferenceBand(week);
  return { marker: "mcaPi", label: "ПИ средней мозговой артерии (СМА)", reference };
}

export function getDvPiLateReferenceBand(gaWeeksFraction: number): PercentileBand | null {
  if (!Number.isFinite(gaWeeksFraction) || gaWeeksFraction < DV_LATE_WEEKS[0] || gaWeeksFraction > DV_LATE_WEEKS[DV_LATE_WEEKS.length - 1]) {
    return null;
  }
  if (gaWeeksFraction <= DV_LATE_WEEKS[0]) return DV_PI_LATE_BY_WEEK[DV_LATE_WEEKS[0]];
  if (gaWeeksFraction >= DV_LATE_WEEKS[DV_LATE_WEEKS.length - 1]) {
    return DV_PI_LATE_BY_WEEK[DV_LATE_WEEKS[DV_LATE_WEEKS.length - 1]];
  }
  for (let i = 0; i < DV_LATE_WEEKS.length - 1; i += 1) {
    const w0 = DV_LATE_WEEKS[i];
    const w1 = DV_LATE_WEEKS[i + 1];
    if (gaWeeksFraction >= w0 && gaWeeksFraction <= w1) {
      const t = (gaWeeksFraction - w0) / (w1 - w0);
      return lerpBand(DV_PI_LATE_BY_WEEK[w0], DV_PI_LATE_BY_WEEK[w1], t);
    }
  }
  return DV_PI_LATE_BY_WEEK[DV_LATE_WEEKS[DV_LATE_WEEKS.length - 1]];
}

export function getUaRiReferenceBand(gaWeeksFraction: number): PercentileBand | null {
  if (!Number.isFinite(gaWeeksFraction) || gaWeeksFraction < UA_RI_WEEKS[0] || gaWeeksFraction > UA_RI_WEEKS[UA_RI_WEEKS.length - 1]) {
    return null;
  }
  if (gaWeeksFraction <= UA_RI_WEEKS[0]) return UA_RI_BY_WEEK[UA_RI_WEEKS[0]];
  if (gaWeeksFraction >= UA_RI_WEEKS[UA_RI_WEEKS.length - 1]) {
    return UA_RI_BY_WEEK[UA_RI_WEEKS[UA_RI_WEEKS.length - 1]];
  }
  for (let i = 0; i < UA_RI_WEEKS.length - 1; i += 1) {
    const w0 = UA_RI_WEEKS[i];
    const w1 = UA_RI_WEEKS[i + 1];
    if (gaWeeksFraction >= w0 && gaWeeksFraction <= w1) {
      const t = (gaWeeksFraction - w0) / (w1 - w0);
      return lerpBand(UA_RI_BY_WEEK[w0], UA_RI_BY_WEEK[w1], t);
    }
  }
  return UA_RI_BY_WEEK[UA_RI_WEEKS[UA_RI_WEEKS.length - 1]];
}

export function listUaRiAtWeek(week: number): { marker: "uaRi"; label: string; reference: PercentileBand | null } {
  return {
    marker: "uaRi",
    label: "ИР артерии пуповины (UA RI)",
    reference: getUaRiReferenceBand(week),
  };
}

export function getMcaPsvReference(gaWeeksFraction: number): McaPsvReference | null {
  if (
    !Number.isFinite(gaWeeksFraction) ||
    gaWeeksFraction < MCA_PSV_WEEKS[0] ||
    gaWeeksFraction > MCA_PSV_WEEKS[MCA_PSV_WEEKS.length - 1]
  ) {
    return null;
  }
  if (gaWeeksFraction <= MCA_PSV_WEEKS[0]) return MCA_PSV_BY_WEEK[MCA_PSV_WEEKS[0]];
  if (gaWeeksFraction >= MCA_PSV_WEEKS[MCA_PSV_WEEKS.length - 1]) {
    return MCA_PSV_BY_WEEK[MCA_PSV_WEEKS[MCA_PSV_WEEKS.length - 1]];
  }
  for (let i = 0; i < MCA_PSV_WEEKS.length - 1; i += 1) {
    const w0 = MCA_PSV_WEEKS[i];
    const w1 = MCA_PSV_WEEKS[i + 1];
    if (gaWeeksFraction >= w0 && gaWeeksFraction <= w1) {
      const t = (gaWeeksFraction - w0) / (w1 - w0);
      return lerpMcaPsv(MCA_PSV_BY_WEEK[w0], MCA_PSV_BY_WEEK[w1], t);
    }
  }
  return MCA_PSV_BY_WEEK[MCA_PSV_WEEKS[MCA_PSV_WEEKS.length - 1]];
}

export function listMcaPsvAtWeek(week: number): {
  marker: "mcaPsv";
  label: string;
  reference: McaPsvReference | null;
} {
  return {
    marker: "mcaPsv",
    label: "ПССК средней мозговой артерии (СМА)",
    reference: getMcaPsvReference(week),
  };
}

export function listDvPiAtWeek(week: number): {
  marker: "dvPi";
  label: string;
  reference: PercentileBand | { min: number; meanLow: number; meanHigh: number; max: number } | null;
  source: "40" | "41" | null;
} {
  if (week >= 21) {
    return {
      marker: "dvPi",
      label: "ПИ венозного протока (DV)",
      reference: getDvPiLateReferenceBand(week),
      source: "41",
    };
  }
  if (week >= 11 && week <= 14) {
    const ref = getDvPiReference(week * 7 + 3);
    return {
      marker: "dvPi",
      label: "ПИ венозного протока (DV)",
      reference: ref,
      source: ref ? "40" : null,
    };
  }
  return { marker: "dvPi", label: "ПИ венозного протока (DV)", reference: null, source: null };
}

function assessUaRi(
  value: number | undefined,
  gaWeeksFraction: number | null | undefined,
): MedvedevDopplerAssessment | null {
  const marker = "uaRi" as const;
  const label = "ИР артерии пуповины (UA RI)";
  if (value === undefined) return null;

  if (gaWeeksFraction == null) {
    return {
      marker,
      label,
      value,
      reference: null,
      flag: "unknown",
      summary: `${label} ${formatPi(value)}: укажите срок беременности (нед + дни).`,
    };
  }

  const reference = getUaRiReferenceBand(gaWeeksFraction);
  if (!reference) {
    return {
      marker,
      label,
      value,
      reference: null,
      flag: "out_of_range",
      summary: `${label}: таблица Прил. 37 для 14–40 нед (сейчас ~${gaWeeksFraction.toFixed(1)} нед).`,
    };
  }

  const percentile = percentileFromMedvedevBand(value, reference);
  const flag: MedvedevDopplerAssessment["flag"] =
    percentile <= 5 ? "low" : percentile >= 95 ? "high" : "normal";
  const flagText =
    flag === "high"
      ? "выше 95-го перцентиля (плацентарная недостаточность)"
      : flag === "low"
        ? "ниже 5-го перцентиля"
        : "в пределах нормы";

  return {
    marker,
    label,
    value,
    reference,
    percentile,
    flag,
    summary: `${label} ${formatPi(value)} (~${gaWeeksFraction.toFixed(1)} нед) → ~${percentile}-й перц. (${flagText}; p5 ${formatPi(reference.p5)} · p50 ${formatPi(reference.p50)} · p95 ${formatPi(reference.p95)}).`,
  };
}

function assessMcaPsv(
  value: number | undefined,
  gaWeeksFraction: number | null | undefined,
): MedvedevDopplerAssessment | null {
  const marker = "mcaPsv" as const;
  const label = "ПССК средней мозговой артерии (СМА)";
  if (value === undefined) return null;

  if (gaWeeksFraction == null) {
    return {
      marker,
      label,
      value,
      reference: null,
      flag: "unknown",
      summary: `${label} ${formatPsv(value)} см/с: укажите срок беременности (нед + дни).`,
    };
  }

  const reference = getMcaPsvReference(gaWeeksFraction);
  if (!reference) {
    return {
      marker,
      label,
      value,
      reference: null,
      flag: "out_of_range",
      summary: `${label}: таблица Прил. 38 для 14–40 нед (сейчас ~${gaWeeksFraction.toFixed(1)} нед).`,
    };
  }

  const mom = value / reference.median;
  const flag: MedvedevDopplerAssessment["flag"] =
    value > reference.mom15Threshold ? "high" : "normal";
  const flagText =
    flag === "high"
      ? ">1,5 MoM — подозрение на анемию плода"
      : "≤1,5 MoM (в пределах референса Mari)";

  return {
    marker,
    label,
    value,
    reference,
    mom,
    flag,
    summary: `${label} ${formatPsv(value)} см/с (~${gaWeeksFraction.toFixed(1)} нед) → ${mom.toFixed(2)} MoM (${flagText}; медиана ${formatPsv(reference.median)} · порог 1,5 MoM ${formatPsv(reference.mom15Threshold)}).`,
  };
}

function assessMcaPi(
  value: number | undefined,
  gaWeeksFraction: number | null | undefined,
): MedvedevDopplerAssessment | null {
  const marker = "mcaPi" as const;
  const label = "ПИ средней мозговой артерии (СМА)";
  if (value === undefined) return null;

  if (gaWeeksFraction == null) {
    return {
      marker,
      label,
      value,
      reference: null,
      flag: "unknown",
      summary: `${label} ${formatPi(value)}: укажите срок беременности (нед + дни).`,
    };
  }

  const reference = getMcaPiReferenceBand(gaWeeksFraction);
  if (!reference) {
    return {
      marker,
      label,
      value,
      reference: null,
      flag: "out_of_range",
      summary: `${label}: таблица Прил. 39 для 20–40 нед (сейчас ~${gaWeeksFraction.toFixed(1)} нед).`,
    };
  }

  const percentile = percentileFromMedvedevBand(value, reference);
  const flag: MedvedevDopplerAssessment["flag"] =
    percentile <= 5 ? "low" : percentile >= 95 ? "high" : "normal";
  const flagText =
    flag === "high"
      ? "выше 95-го перцентиля"
      : flag === "low"
        ? "ниже 5-го перцентиля (централизация кровотока)"
        : "в пределах нормы";

  return {
    marker,
    label,
    value,
    reference,
    percentile,
    flag,
    summary: `${label} ${formatPi(value)} (~${gaWeeksFraction.toFixed(1)} нед) → ~${percentile}-й перц. (${flagText}; p5 ${formatPi(reference.p5)} · p50 ${formatPi(reference.p50)} · p95 ${formatPi(reference.p95)}).`,
  };
}

function assessDvPiFirstTrimester(
  value: number | undefined,
  gaDaysTotal: number | null | undefined,
): MedvedevDopplerAssessment | null {
  const label = "ПИ венозного протока (DV) · I скрининг";

  if (value === undefined) return null;

  if (gaDaysTotal == null) {
    return {
      marker: "dvPi",
      label,
      value,
      reference: null,
      flag: "unknown",
      summary: `${label} ${formatPi(value)}: укажите срок (или КТР) для таблицы 11+0–14+0.`,
    };
  }

  const { week, day } = gaDaysToWeekDay(gaDaysTotal);
  const ref = getDvPiReference(gaDaysTotal);
  if (!ref) {
    return {
      marker: "dvPi",
      label,
      value,
      reference: null,
      flag: "out_of_range",
      summary: `${label}: таблица FMF Прил. 40 для 11+0–14+0 (сейчас ${formatGaKey(week, day)}).`,
    };
  }

  let flag: MedvedevDopplerAssessment["flag"] = "normal";
  if (value > ref.max) flag = "high";
  else if (value < ref.min) flag = "low";

  const band: PercentileBand = {
    p5: ref.min,
    p50: (ref.meanLow + ref.meanHigh) / 2,
    p95: ref.max,
  };
  const percentile = percentileFromMedvedevBand(value, band);
  const flagText =
    flag === "high"
      ? "выше максимума FMF для данного дня"
      : flag === "low"
        ? "ниже минимума"
        : "в пределах референса FMF";

  return {
    marker: "dvPi",
    label,
    value,
    reference: ref,
    percentile,
    flag,
    summary: `${label} ${formatPi(value)} при ${formatGaKey(week, day)} → ~${percentile}-й перц. (${flagText}; min ${formatPi(ref.min)} · mean ${formatPi(ref.meanLow)}–${formatPi(ref.meanHigh)} · max ${formatPi(ref.max)}).`,
  };
}

function assessDvPiLate(
  value: number | undefined,
  gaWeeksFraction: number | null | undefined,
): MedvedevDopplerAssessment | null {
  const label = "ПИ венозного протока (DV) · II/III";
  if (value === undefined) return null;

  if (gaWeeksFraction == null) {
    return {
      marker: "dvPi",
      label,
      value,
      reference: null,
      flag: "unknown",
      summary: `${label} ${formatPi(value)}: укажите срок беременности (нед + дни).`,
    };
  }

  const reference = getDvPiLateReferenceBand(gaWeeksFraction);
  if (!reference) {
    return {
      marker: "dvPi",
      label,
      value,
      reference: null,
      flag: "out_of_range",
      summary: `${label}: таблица Прил. 41 для 21–40 нед (сейчас ~${gaWeeksFraction.toFixed(1)} нед).`,
    };
  }

  const percentile = percentileFromMedvedevBand(value, reference);
  const flag: MedvedevDopplerAssessment["flag"] =
    percentile <= 5 ? "low" : percentile >= 95 ? "high" : "normal";
  const flagText =
    flag === "high"
      ? "выше 95-го перцентиля"
      : flag === "low"
        ? "ниже 5-го перцентиля"
        : "в пределах нормы";

  return {
    marker: "dvPi",
    label,
    value,
    reference,
    percentile,
    flag,
    summary: `${label} ${formatPi(value)} (~${gaWeeksFraction.toFixed(1)} нед) → ~${percentile}-й перц. (${flagText}; p5 ${formatPi(reference.p5)} · p50 ${formatPi(reference.p50)} · p95 ${formatPi(reference.p95)}; Kessler).`,
  };
}

function assessDvPi(
  value: number | undefined,
  gaDaysTotal: number | null | undefined,
  gaWeeksFraction: number | null | undefined,
): MedvedevDopplerAssessment | null {
  if (value === undefined) return null;
  if (gaWeeksFraction != null && gaWeeksFraction >= 21) {
    return assessDvPiLate(value, gaWeeksFraction);
  }
  if (gaDaysTotal != null) {
    const { week } = gaDaysToWeekDay(gaDaysTotal);
    if (week >= 11 && week <= 14) {
      return assessDvPiFirstTrimester(value, gaDaysTotal);
    }
    if (gaWeeksFraction != null && gaWeeksFraction >= 21) {
      return assessDvPiLate(value, gaWeeksFraction);
    }
  }
  if (gaWeeksFraction != null && gaWeeksFraction < 21) {
    return {
      marker: "dvPi",
      label: "ПИ венозного протока (DV)",
      value,
      reference: null,
      flag: "out_of_range",
      summary: `ПИ DV: для ${gaWeeksFraction.toFixed(1)} нед используйте Прил. 41 (с 21 нед) или I скрининг 11–14 (Прил. 40).`,
    };
  }
  return assessDvPiFirstTrimester(value, gaDaysTotal);
}

function assessUterinePi(
  marker: "uterinePiRight" | "uterinePiLeft" | "uterinePiMean",
  label: string,
  value: number | undefined,
  gaWeeksFraction: number | null | undefined,
): MedvedevDopplerAssessment | null {
  if (value === undefined) return null;

  if (gaWeeksFraction == null) {
    return {
      marker,
      label,
      value,
      reference: null,
      flag: "unknown",
      summary: `${label} ${formatPi(value)}: укажите срок беременности (нед + дни).`,
    };
  }

  const reference = getUterinePiReferenceBand(gaWeeksFraction);
  if (!reference) {
    return {
      marker,
      label,
      value,
      reference: null,
      flag: "out_of_range",
      summary: `${label}: таблица Прил. 36 для 11–40 нед (сейчас ~${gaWeeksFraction.toFixed(1)} нед).`,
    };
  }

  const percentile = percentileFromMedvedevBand(value, reference);
  const flag: MedvedevDopplerAssessment["flag"] =
    percentile <= 5 ? "low" : percentile >= 95 ? "high" : "normal";
  const flagText =
    flag === "high" ? "выше 95-го перцентиля" : flag === "low" ? "ниже 5-го перцентиля" : "в пределах нормы";

  return {
    marker,
    label,
    value,
    reference,
    percentile,
    flag,
    summary: `${label} ${formatPi(value)} (~${gaWeeksFraction.toFixed(1)} нед) → ~${percentile}-й перц. (${flagText}; p5 ${formatPi(reference.p5)} · p50 ${formatPi(reference.p50)} · p95 ${formatPi(reference.p95)}).`,
  };
}

export type MedvedevDopplerInput = {
  gaDaysTotal?: number | null;
  dvPi?: number;
  uterinePiRight?: number;
  uterinePiLeft?: number;
  uterinePiMean?: number;
  mcaPi?: number;
  mcaPsv?: number;
  uaRi?: number;
};

export function assessMedvedevDoppler(input: MedvedevDopplerInput): MedvedevDopplerAssessment[] {
  const gaWeeksFraction =
    input.gaDaysTotal != null && Number.isFinite(input.gaDaysTotal) ? input.gaDaysTotal / 7 : null;

  const meanPi =
    input.uterinePiMean ??
    (input.uterinePiRight !== undefined && input.uterinePiLeft !== undefined
      ? (input.uterinePiRight + input.uterinePiLeft) / 2
      : undefined);

  const rows: MedvedevDopplerAssessment[] = [];
  const dv = assessDvPi(input.dvPi, input.gaDaysTotal, gaWeeksFraction);
  if (dv) rows.push(dv);

  const right = assessUterinePi("uterinePiRight", "ПИ маточной артерии справа", input.uterinePiRight, gaWeeksFraction);
  if (right) rows.push(right);

  const left = assessUterinePi("uterinePiLeft", "ПИ маточной артерии слева", input.uterinePiLeft, gaWeeksFraction);
  if (left) rows.push(left);

  if (input.uterinePiMean !== undefined || (input.uterinePiRight !== undefined && input.uterinePiLeft !== undefined)) {
    const mean = assessUterinePi("uterinePiMean", "ПИ маточных артерий (средний)", meanPi, gaWeeksFraction);
    if (mean) rows.push(mean);
  }

  const mca = assessMcaPi(input.mcaPi, gaWeeksFraction);
  if (mca) rows.push(mca);

  const mcaPsv = assessMcaPsv(input.mcaPsv, gaWeeksFraction);
  if (mcaPsv) rows.push(mcaPsv);

  const uaRi = assessUaRi(input.uaRi, gaWeeksFraction);
  if (uaRi) rows.push(uaRi);

  return rows;
}

export function formatMedvedevDopplerForProtocol(item: MedvedevDopplerAssessment): string {
  if (item.marker === "mcaPsv" && item.value !== undefined && item.mom !== undefined) {
    return `- ${item.label}: ${formatPsv(item.value)} см/с (${item.mom.toFixed(2)} MoM)`;
  }
  if (item.value !== undefined && item.percentile !== undefined) {
    return `- ${item.label}: ${formatPi(item.value)} (~${item.percentile}-й перц.)`;
  }
  return `- ${item.summary}`;
}