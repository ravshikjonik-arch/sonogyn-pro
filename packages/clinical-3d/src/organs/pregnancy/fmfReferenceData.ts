/**
 * Референсные значения биометрии плода.
 * Источники: FMF Fetal Biometry Charts (Nicolaides, 2018), INTERGROWTH-21st, WHO fetal growth.
 *
 * Примечание: p5/p95 для промежуточных недель — интерполяция между опорными точками.
 * TODO: валидация процентилей с локальными протоколами (GE Voluson / FMF cert).
 */

import type { FmfBiometryParameter, PercentileBand } from "../../types";

/** Опорные медианы (p50) по неделям — INTERGROWTH-21st / FMF (мм или г для efw). */
const ANCHOR_P50: Record<FmfBiometryParameter, Record<number, number>> = {
  crl: { 6: 5, 7: 13, 8: 16, 9: 23, 10: 31, 11: 41, 12: 54, 13: 71 },
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
  efw: {
    14: 110, 16: 180, 18: 260, 20: 350, 22: 480, 24: 650, 26: 850, 28: 1100,
    30: 1400, 32: 1750, 34: 2150, 36: 2600, 38: 3050, 40: 3400,
  },
};

/** Относительные полосы p5/p95 от p50 (упрощение; TODO: табличные значения FMF). */
const SPREAD: Record<FmfBiometryParameter, { low: number; high: number }> = {
  crl: { low: 0.82, high: 1.18 },
  bpd: { low: 0.9, high: 1.1 },
  hc: { low: 0.92, high: 1.08 },
  ac: { low: 0.88, high: 1.12 },
  fl: { low: 0.87, high: 1.13 },
  efw: { low: 0.75, high: 1.25 },
};

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

function buildWeekTable(parameter: FmfBiometryParameter): Record<number, PercentileBand> {
  const anchors = ANCHOR_P50[parameter];
  const spread = SPREAD[parameter];
  const minWeek = parameter === "crl" ? 6 : 14;
  const maxWeek = parameter === "crl" ? 13 : 40;
  const out: Record<number, PercentileBand> = {};

  for (let w = minWeek; w <= maxWeek; w += 1) {
    const p50 = interpolateAnchors(anchors, w);
    if (p50 == null) continue;
    out[w] = {
      p5: Math.round(p50 * spread.low * 10) / 10,
      p50: Math.round(p50 * 10) / 10,
      p95: Math.round(p50 * spread.high * 10) / 10,
    };
  }
  return out;
}

export const FMF_BIOMETRY: Record<FmfBiometryParameter, Record<number, PercentileBand>> = {
  crl: buildWeekTable("crl"),
  bpd: buildWeekTable("bpd"),
  hc: buildWeekTable("hc"),
  ac: buildWeekTable("ac"),
  fl: buildWeekTable("fl"),
  efw: buildWeekTable("efw"),
};

export function getReferenceForWeek(
  week: number,
  parameter: FmfBiometryParameter,
): PercentileBand | null {
  const rounded = Math.round(week);
  const direct = FMF_BIOMETRY[parameter][rounded];
  if (direct) return direct;

  const p50 = interpolateAnchors(ANCHOR_P50[parameter], week);
  if (p50 == null) return null;
  const spread = SPREAD[parameter];
  return {
    p5: p50 * spread.low,
    p50: p50,
    p95: p50 * spread.high,
  };
}

export function getPercentile(value: number, week: number, parameter: FmfBiometryParameter): number {
  const ref = getReferenceForWeek(week, parameter);
  if (!ref) throw new Error(`Нет данных FMF для ${parameter} на ${week} нед.`);
  if (value <= ref.p5) return 5;
  if (value >= ref.p95) return 95;
  return Math.round(5 + ((value - ref.p5) / (ref.p95 - ref.p5)) * 90);
}

/** Допплер — отдельный виджет (не смешиваем с биометрическими процентилями). */
export const DOPPLER_WIDGET_NOTE_RU =
  "Показатели допплера (UtA PI, MCA PI, CPR, DV a-wave) вынесены в отдельный виджет FMF Doppler.";
