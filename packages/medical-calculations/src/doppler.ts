/**
 * Umbilical / uterine artery Doppler indices.
 *
 * PI = (PSV − EDV) / TAMV  (simplified: (PSV − EDV) / PSV when TAMV unavailable)
 * RI = (PSV − EDV) / PSV
 *
 * Reference: Pourcelot L. Applications de l'examen Doppler. In: Perinatal Medicine.
 * Paris: CECOIC; 1989. (RI); standard obstetric Doppler practice for PI.
 */

export type DopplerVelocities = {
  /** Peak systolic velocity (cm/s). */
  psv: number;
  /** End-diastolic velocity (cm/s). */
  edv: number;
};

export function pulsatilityIndex(v: DopplerVelocities): number | null {
  const { psv, edv } = v;
  if (!Number.isFinite(psv) || !Number.isFinite(edv) || psv <= 0) return null;
  const tamv = (psv + 2 * edv) / 3;
  if (tamv <= 0) return null;
  return Math.round(((psv - edv) / tamv) * 100) / 100;
}

export function resistanceIndex(v: DopplerVelocities): number | null {
  const { psv, edv } = v;
  if (!Number.isFinite(psv) || !Number.isFinite(edv) || psv <= 0) return null;
  return Math.round(((psv - edv) / psv) * 100) / 100;
}

/** Uterine artery PI orienting thresholds (varies by GA and centre). */
export function interpretUterinePi(pi: number, gaWeeks: number): "normal" | "elevated" | "unknown" {
  if (!Number.isFinite(pi) || !Number.isFinite(gaWeeks)) return "unknown";
  const threshold = gaWeeks < 24 ? 2.0 : 1.5;
  return pi > threshold ? "elevated" : "normal";
}
