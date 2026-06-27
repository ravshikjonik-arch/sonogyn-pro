/**
 * Gestational age (GA) estimation from biometry.
 *
 * References:
 * - Robinson HP, Fleming JEH. A critical evaluation of sonar "crown-rump length" measurements.
 *   Br J Obstet Gynaecol. 1975;82(9):702-710. (CRL formula, widely cited)
 * - Hadlock FP et al. Estimation of fetal weight with the use of head, body, and femur measurements.
 *   Radiology. 1985;151(2):333-337. (2nd/3rd trimester biometry tables — approximated here)
 */

/** CRL (mm) → gestational age in days (Robinson-Fleming approximation). */
export function gaDaysFromCrlMm(crlMm: number): number | null {
  if (!Number.isFinite(crlMm) || crlMm < 2 || crlMm > 84) return null;
  return Math.round(8.052 * Math.sqrt(crlMm) + 23.73);
}

import crlMedvedev12 from "./data/crl-medvedev-12-p50.json";
import msdMedvedev11 from "./data/msd-medvedev-11-p50.json";

/** Medvedev table 1.2 (Altynnik 2001): CRL p50 → GA days, inverse linear interpolation. */
const CRL_MEDVEDEV_P50: [number, number][] = crlMedvedev12.points as [number, number][];

function interpolateInverseCrlToGa(crlMm: number, table: [number, number][]): number | null {
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i];
    const [x1, y1] = table[i + 1];
    if (crlMm >= x0 && crlMm <= x1) {
      const t = (crlMm - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return null;
}

/** Tabulated CRL (mm) → GA days — Medvedev 1.2 p50; Robinson fallback at edges. */
export function gaDaysFromCrlTable(crlMm: number): number | null {
  if (!Number.isFinite(crlMm) || crlMm < 2 || crlMm > 84) return null;
  if (crlMm >= crlMedvedev12.minCrl && crlMm <= crlMedvedev12.maxCrl) {
    return interpolateInverseCrlToGa(crlMm, CRL_MEDVEDEV_P50);
  }
  return gaDaysFromCrlMm(crlMm);
}

const MSD_MEDVEDEV_P50: [number, number][] = msdMedvedev11.points as [number, number][];

function interpolateInverseMsdToGa(msdMm: number, table: [number, number][]): number | null {
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i];
    const [x1, y1] = table[i + 1];
    if (msdMm >= x0 && msdMm <= x1) {
      const t = (msdMm - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return null;
}

/** Tabulated MSD/SVD (mm) → GA days — Medvedev 1.1 gaP50 (Grisolia 1993). */
export function gaDaysFromMsdTable(msdMm: number): number | null {
  if (!Number.isFinite(msdMm) || msdMm < msdMedvedev11.minMsd || msdMm > msdMedvedev11.maxMsd) {
    return null;
  }
  return interpolateInverseMsdToGa(msdMm, MSD_MEDVEDEV_P50);
}

export type BiometryKind = "BPD" | "HC" | "FL" | "AC" | "HL";

/**
 * Single-parameter GA estimate (II–III trimester orienting values; not for 1st trimester dating).
 * Values in mm.
 */
export function approximateGaDaysFromBiometry(kind: BiometryKind, mm: number): number | null {
  if (!Number.isFinite(mm) || mm <= 0) return null;
  let days: number;
  switch (kind) {
    case "BPD":
      if (mm < 15 || mm > 120) return null;
      days = Math.round(42 + 2.1 * mm);
      break;
    case "HC":
      if (mm < 80 || mm > 380) return null;
      days = Math.round(52 + 0.62 * mm);
      break;
    case "FL":
      if (mm < 8 || mm > 90) return null;
      days = Math.round(46 + 2.7 * mm);
      break;
    case "AC":
      if (mm < 80 || mm > 400) return null;
      days = Math.round(48 + 0.35 * mm);
      break;
    case "HL":
      if (mm < 8 || mm > 70) return null;
      days = Math.round(44 + 2.8 * mm);
      break;
    default:
      return null;
  }
  return Math.max(49, Math.min(287, days));
}

/** Combined GA from multiple biometry parameters — median of valid estimates. */
export function combinedGaDaysFromBiometry(
  values: Partial<Record<BiometryKind, number>>,
): number | null {
  const estimates: number[] = [];
  for (const [kind, mm] of Object.entries(values) as [BiometryKind, number][]) {
    if (typeof mm === "number" && Number.isFinite(mm)) {
      const ga = approximateGaDaysFromBiometry(kind, mm);
      if (ga != null) estimates.push(ga);
    }
  }
  if (estimates.length === 0) return null;
  estimates.sort((a, b) => a - b);
  const mid = Math.floor(estimates.length / 2);
  return estimates.length % 2 === 1
    ? estimates[mid]
    : Math.round((estimates[mid - 1] + estimates[mid]) / 2);
}

export function formatGestationalAge(totalDays: number | null): string {
  if (totalDays == null || totalDays <= 0) return "не определён";
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return `${weeks} нед ${days} д`;
}

export function splitGaDays(totalDays: number): { weeks: number; days: number; totalDays: number } {
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days, totalDays };
}

/** EDD from GA at ultrasound date: GA in days from LMP equivalent. */
export function eddFromGaAtStudy(studyDate: Date, gaDays: number): Date {
  const remaining = 280 - gaDays;
  const result = new Date(studyDate);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + remaining);
  return result;
}

/** GA from LMP to reference date. */
export function gaDaysFromLmp(lmp: Date, reference: Date): number {
  const l = startOfDay(lmp);
  const r = startOfDay(reference);
  return Math.max(0, Math.floor((r.getTime() - l.getTime()) / 86_400_000));
}

export function eddFromLmp(lmp: Date): Date {
  const d = startOfDay(lmp);
  d.setDate(d.getDate() + 280);
  return d;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
