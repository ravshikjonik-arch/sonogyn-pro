/**
 * Референсы биометрии плода для obstetric-expert (INTERGROWTH-21st / FMF p5–p95).
 * Упрощённая интерполяция — для CDS; локальные протоколы могут отличаться.
 */

export type BiometryParameter = "bpd" | "hc" | "ac" | "fl" | "hl" | "efw";

export type PercentileBand = {
  p5: number;
  p50: number;
  p95: number;
};

const ANCHOR_P50: Record<BiometryParameter, Record<number, number>> = {
  bpd: {
    14: 28.5, 16: 34.5, 18: 40.5, 20: 46.5, 22: 52.5, 24: 58.5, 26: 64.5, 28: 70.5,
    30: 75.5, 32: 80.5, 34: 84.5, 36: 88.5, 38: 91.5, 40: 94.5,
  },
  hc: {
    14: 104, 16: 124, 18: 142, 20: 160, 22: 178, 24: 196, 26: 214, 28: 232,
    30: 248, 32: 262, 34: 274, 36: 284, 38: 292, 40: 298,
  },
  ac: {
    14: 89, 16: 108, 18: 127, 20: 147, 22: 168, 24: 190, 26: 213, 28: 237,
    30: 262, 32: 288, 34: 314, 36: 340, 38: 365, 40: 388,
  },
  fl: {
    14: 15, 16: 22, 18: 29, 20: 36, 22: 43, 24: 50, 26: 57, 28: 64,
    30: 70, 32: 76, 34: 81, 36: 86, 38: 90, 40: 93,
  },
  hl: {
    14: 14, 16: 20, 18: 27, 20: 33, 22: 40, 24: 47, 26: 54, 28: 60,
    30: 66, 32: 72, 34: 77, 36: 81, 38: 85, 40: 88,
  },
  efw: {
    14: 110, 16: 180, 18: 260, 20: 350, 22: 480, 24: 650, 26: 850, 28: 1100,
    30: 1400, 32: 1750, 34: 2150, 36: 2600, 38: 3050, 40: 3400,
  },
};

const SPREAD: Record<BiometryParameter, { low: number; high: number }> = {
  bpd: { low: 0.9, high: 1.1 },
  hc: { low: 0.92, high: 1.08 },
  ac: { low: 0.88, high: 1.12 },
  fl: { low: 0.87, high: 1.13 },
  hl: { low: 0.87, high: 1.13 },
  efw: { low: 0.75, high: 1.25 },
};

/** WHO — те же медианы, чуть шире p5/p95 (ориентир для глобальных когорт). */
const WHO_SPREAD_FACTOR = { low: 0.98, high: 1.02 };

function interpolateAnchors(anchors: Record<number, number>, week: number): number | null {
  const keys = Object.keys(anchors)
    .map(Number)
    .sort((a, b) => a - b);
  if (keys.length === 0) return null;
  if (week <= keys[0]) return anchors[keys[0]];
  if (week >= keys[keys.length - 1]) return anchors[keys[keys.length - 1]];

  let lo = keys[0];
  for (const k of keys) {
    if (k <= week) lo = k;
    if (k >= week) {
      const hi = k;
      if (lo === hi) return anchors[lo];
      const t = (week - lo) / (hi - lo);
      return anchors[lo] + t * (anchors[hi] - anchors[lo]);
    }
  }
  return anchors[keys[keys.length - 1]];
}

export function getReferenceBand(
  parameter: BiometryParameter,
  gaWeeks: number,
  standard: "intergrowth" | "who" = "intergrowth",
): PercentileBand | null {
  const p50 = interpolateAnchors(ANCHOR_P50[parameter], gaWeeks);
  if (p50 == null) return null;

  const spread = SPREAD[parameter];
  const lowMul = standard === "who" ? spread.low * WHO_SPREAD_FACTOR.low : spread.low;
  const highMul = standard === "who" ? spread.high * WHO_SPREAD_FACTOR.high : spread.high;

  return {
    p5: p50 * lowMul,
    p50: p50,
    p95: p50 * highMul,
  };
}

export function percentileFromBand(value: number, band: PercentileBand): number {
  if (value <= band.p5) return 5;
  if (value >= band.p95) return 95;
  return Math.round(5 + ((value - band.p5) / (band.p95 - band.p5)) * 90);
}

export function zScoreFromBand(value: number, band: PercentileBand): number {
  const sd = (band.p95 - band.p5) / (2 * 1.645);
  if (sd <= 0) return 0;
  return Math.round(((value - band.p50) / sd) * 100) / 100;
}

export const PARAMETER_LABELS_RU: Record<BiometryParameter, string> = {
  bpd: "BPD",
  hc: "HC",
  ac: "AC",
  fl: "FL",
  hl: "HL",
  efw: "EFW",
};

export const PARAMETER_UNITS: Record<BiometryParameter, string> = {
  bpd: "mm",
  hc: "mm",
  ac: "mm",
  fl: "mm",
  hl: "mm",
  efw: "g",
};
