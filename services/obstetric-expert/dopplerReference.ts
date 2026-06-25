/**
 * Упрощённые референсы PI по сроку (II–III триместр + I трим. DV/UTA).
 * Ориентир: ISUOG / Mari / Baschat; локальные протоколы могут отличаться.
 */

export type PercentileBand = { p5: number; p50: number; p95: number };

/** Пуповинная артерия PI — p50/p95 по неделям (approx.). */
const UA_PI: Record<number, PercentileBand> = {
  20: { p5: 0.85, p50: 1.05, p95: 1.25 },
  24: { p5: 0.82, p50: 1.0, p95: 1.2 },
  28: { p5: 0.78, p50: 0.95, p95: 1.15 },
  32: { p5: 0.72, p50: 0.88, p95: 1.08 },
  36: { p5: 0.68, p50: 0.82, p95: 1.0 },
  40: { p5: 0.65, p50: 0.78, p95: 0.95 },
};

/** СМА PI — p5/p95 (approx.). */
const MCA_PI: Record<number, PercentileBand> = {
  20: { p5: 1.4, p50: 1.75, p95: 2.1 },
  24: { p5: 1.35, p50: 1.65, p95: 2.0 },
  28: { p5: 1.3, p50: 1.55, p95: 1.85 },
  32: { p5: 1.25, p50: 1.48, p95: 1.75 },
  36: { p5: 1.2, p50: 1.42, p95: 1.68 },
  40: { p5: 1.15, p50: 1.38, p95: 1.62 },
};

/** DV PI — III триместр (approx.). */
const DV_PI: Record<number, PercentileBand> = {
  20: { p5: 0.55, p50: 0.75, p95: 1.0 },
  24: { p5: 0.5, p50: 0.7, p95: 0.95 },
  28: { p5: 0.48, p50: 0.68, p95: 0.92 },
  32: { p5: 0.45, p50: 0.65, p95: 0.88 },
  36: { p5: 0.42, p50: 0.62, p95: 0.85 },
  40: { p5: 0.4, p50: 0.6, p95: 0.82 },
};

/** Маточные артерии PI (mean) — I трим. скрининг + II трим. */
const UTA_PI: Record<number, PercentileBand> = {
  11: { p5: 1.02, p50: 1.82, p95: 2.62 },
  12: { p5: 0.99, p50: 1.75, p95: 2.51 },
  13: { p5: 0.96, p50: 1.68, p95: 2.4 },
  14: { p5: 0.89, p50: 1.61, p95: 2.34 },
  20: { p5: 0.62, p50: 1.22, p95: 1.82 },
  24: { p5: 0.59, p50: 1.0, p95: 1.41 },
  28: { p5: 0.54, p50: 0.82, p95: 1.1 },
  32: { p5: 0.5, p50: 0.71, p95: 0.92 },
};

function interpolateBand(table: Record<number, PercentileBand>, gaWeeks: number): PercentileBand | null {
  const keys = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  if (!keys.length) return null;
  if (gaWeeks <= keys[0]) return table[keys[0]];
  if (gaWeeks >= keys[keys.length - 1]) return table[keys[keys.length - 1]];

  let lo = keys[0];
  for (const k of keys) {
    if (k <= gaWeeks) lo = k;
    if (k >= gaWeeks) {
      const hi = k;
      if (lo === hi) return table[lo];
      const t = (gaWeeks - lo) / (hi - lo);
      const lerp = (a: number, b: number) => a + (b - a) * t;
      const a = table[lo];
      const b = table[hi];
      return {
        p5: lerp(a.p5, b.p5),
        p50: lerp(a.p50, b.p50),
        p95: lerp(a.p95, b.p95),
      };
    }
  }
  return table[keys[keys.length - 1]];
}

export function getUaPiBand(gaWeeks: number): PercentileBand | null {
  return interpolateBand(UA_PI, gaWeeks);
}

export function getMcaPiBand(gaWeeks: number): PercentileBand | null {
  return interpolateBand(MCA_PI, gaWeeks);
}

export function getDvPiBand(gaWeeks: number): PercentileBand | null {
  return interpolateBand(DV_PI, gaWeeks);
}

export function getUtaPiBand(gaWeeks: number): PercentileBand | null {
  return interpolateBand(UTA_PI, gaWeeks);
}

export function percentileFromBand(value: number, band: PercentileBand): number {
  if (value <= band.p5) return 5;
  if (value >= band.p95) return 95;
  return Math.round(5 + ((value - band.p5) / (band.p95 - band.p5)) * 90);
}

/** CPR пороги по ISUOG practice (approx.). */
export function cprThreshold(gaWeeks: number): number {
  if (gaWeeks < 28) return 1.08;
  if (gaWeeks < 32) return 1.05;
  return 1.0;
}
