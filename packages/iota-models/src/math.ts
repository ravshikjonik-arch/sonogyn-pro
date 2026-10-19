import type { PapillaryCount } from "./types";

export function log2(x: number): number {
  return Math.log(x) / Math.LN2;
}

export function logistic(probability: number): number {
  if (probability <= 0) return Number.NEGATIVE_INFINITY;
  if (probability >= 1) return Number.POSITIVE_INFINITY;
  return Math.log(probability / (1 - probability));
}

export function expLogistic(score: number): number {
  if (score >= 0) {
    const e = Math.exp(-score);
    return 1 / (1 + e);
  }
  const e = Math.exp(score);
  return e / (1 + e);
}

/** Multinomial ADNEX: benign vs four malignant logits z1..z4. */
export function adnexProbabilities(z: [number, number, number, number]): {
  benign: number;
  borderline: number;
  stage1: number;
  stage2_4: number;
  metastatic: number;
} {
  const e1 = Math.exp(z[0]);
  const e2 = Math.exp(z[1]);
  const e3 = Math.exp(z[2]);
  const e4 = Math.exp(z[3]);
  const denom = 1 + e1 + e2 + e3 + e4;
  return {
    benign: 1 / denom,
    borderline: e1 / denom,
    stage1: e2 / denom,
    stage2_4: e3 / denom,
    metastatic: e4 / denom,
  };
}

export function papillaryCoefficient(count: PapillaryCount): number {
  if (count === "4plus") return 4;
  return count;
}
