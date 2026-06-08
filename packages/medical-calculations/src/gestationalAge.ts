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

/** Tabulated CRL (mm) → GA days — linear interpolation (1st trimester screening tables). */
const CRL_TABLE: [number, number][] = [
  [2, 29],
  [5, 36],
  [10, 49],
  [15, 55],
  [20, 60],
  [25, 64],
  [30, 67],
  [35, 70],
  [40, 73],
  [45, 76],
  [50, 79],
  [55, 81],
  [60, 84],
  [65, 87],
  [70, 90],
  [75, 93],
  [80, 96],
  [84, 98],
];

export function gaDaysFromCrlTable(crlMm: number): number | null {
  if (!Number.isFinite(crlMm) || crlMm < 2 || crlMm > 84) return null;
  for (let i = 0; i < CRL_TABLE.length - 1; i++) {
    const [x0, y0] = CRL_TABLE[i];
    const [x1, y1] = CRL_TABLE[i + 1];
    if (crlMm >= x0 && crlMm <= x1) {
      const t = (crlMm - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return null;
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
