import type { PercentileBand, PercentileBandFull } from "./types";

const Z = {
  p3: 1.88,
  p5: 1.645,
  p10: 1.28,
  p90: 1.28,
  p95: 1.645,
  p97: 1.88,
} as const;

/** Расширяет p5/p50/p95 до P3–P97 (нормальное приближение). */
export function expandPercentileBand(band: PercentileBand): PercentileBandFull {
  const sigma = (band.p95 - band.p5) / (2 * Z.p5);
  if (!Number.isFinite(sigma) || sigma <= 0) {
    return {
      p3: band.p5,
      p5: band.p5,
      p10: band.p50,
      p50: band.p50,
      p90: band.p50,
      p95: band.p95,
      p97: band.p95,
    };
  }
  return {
    p3: round1(band.p50 - Z.p3 * sigma),
    p5: band.p5,
    p10: round1(band.p50 - Z.p10 * sigma),
    p50: band.p50,
    p90: round1(band.p50 + Z.p90 * sigma),
    p95: band.p95,
    p97: round1(band.p50 + Z.p97 * sigma),
  };
}

/** Перцентиль по полосе p5/p50/p95 (линейная интерполяция, как Медведев). */
export function percentileFromBand(valueMm: number, band: PercentileBand): number {
  if (valueMm <= band.p5) return 5;
  if (valueMm >= band.p95) return 95;
  if (valueMm <= band.p50) {
    return Math.round(5 + ((valueMm - band.p5) / (band.p50 - band.p5)) * 45);
  }
  return Math.round(50 + ((valueMm - band.p50) / (band.p95 - band.p50)) * 45);
}

export function flagFromPercentile(percentile: number): "low" | "normal" | "high" {
  if (percentile <= 5) return "low";
  if (percentile >= 95) return "high";
  return "normal";
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function formatMm(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

export function formatBandFull(band: PercentileBandFull): string {
  return `P3 ${formatMm(band.p3)} · P5 ${formatMm(band.p5)} · P50 ${formatMm(band.p50)} · P95 ${formatMm(band.p95)} · P97 ${formatMm(band.p97)} мм`;
}
