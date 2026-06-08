/**
 * Estimated fetal weight (EFW) — all linear inputs in millimetres (mm).
 *
 * References:
 * - Hadlock FP, Harrist RB, Sharman RS, Deter RL, Park SK. Estimation of fetal weight with
 *   the use of head, body, and femur measurements. Radiology. 1985;151(2):333-337.
 * - Hadlock FP, Harrist RB, Carpenter RJ, Deter RL, Park SK. Sonographic estimation of fetal weight.
 *   Radiology. 1984;150(2):535-540. (HC-AC-FL)
 * - Shepard MJ, Richards VA, Berkowitz RL, Warsof SL, Hobbins JC. An accurate formula for sonographic
 *   estimation of fetal weight. Obstet Gynecol. 1982;60(6):653-657.
 * - Warsof SL et al. The estimation of fetal weight by computer-assisted ultrasound. Am J Obstet Gynecol. 1984.
 */

export type EfwFormulaId =
  | "hadlock4_bpd_hc_ac_fl"
  | "hadlock3_hc_ac_fl"
  | "shepard_bpd"
  | "warsof_bpd";

export type EfwInput = {
  bpdMm?: number;
  hcMm?: number;
  acMm?: number;
  flMm?: number;
};

export type EfwResult = {
  grams: number;
  formula: EfwFormulaId;
  label: string;
};

/**
 * Hadlock 4-parameter (BPD, HC, AC, FL) — Radiology 1985.
 * log10(EFW) = 1.3596 − 0.00386(AC×FL) + 0.0064(HC) + 0.00061(BPD×AC) + 0.0424(AC) + 0.174(FL)
 * All measurements in cm internally.
 */
export function efwHadlock4(input: EfwInput): EfwResult | null {
  const { bpdMm, hcMm, acMm, flMm } = input;
  if (![bpdMm, hcMm, acMm, flMm].every((x) => typeof x === "number" && x > 0)) return null;
  const bpd = bpdMm! / 10;
  const hc = hcMm! / 10;
  const ac = acMm! / 10;
  const fl = flMm! / 10;
  const log10 =
    1.3596 -
    0.00386 * ac * fl +
    0.0064 * hc +
    0.00061 * bpd * ac +
    0.0424 * ac +
    0.174 * fl;
  return {
    grams: Math.round(10 ** log10),
    formula: "hadlock4_bpd_hc_ac_fl",
    label: "Hadlock IV (BPD-HC-AC-FL, 1985)",
  };
}

/**
 * Hadlock 3-parameter (HC, AC, FL).
 * log10(EFW) = 1.5662 − 0.01086(HC) + 0.0468(AC) + 0.171(FL) + 0.00034(HC²) − 0.00368(AC×FL)
 */
export function efwHadlock3(input: EfwInput): EfwResult | null {
  const { hcMm, acMm, flMm } = input;
  if (![hcMm, acMm, flMm].every((x) => typeof x === "number" && x > 0)) return null;
  const hc = hcMm! / 10;
  const ac = acMm! / 10;
  const fl = flMm! / 10;
  const log10 =
    1.5662 - 0.01086 * hc + 0.0468 * ac + 0.171 * fl + 0.00034 * hc * hc - 0.00368 * ac * fl;
  return {
    grams: Math.round(10 ** log10),
    formula: "hadlock3_hc_ac_fl",
    label: "Hadlock III (HC-AC-FL, 1984)",
  };
}

/** Shepard 1982 — BPD only (cm). log10(EFW) = −1.7492 + 0.55(BPD) + 0.0460(BPD²) − 0.000546(BPD³) */
export function efwShepard(bpdMm: number): EfwResult | null {
  if (!Number.isFinite(bpdMm) || bpdMm <= 0) return null;
  const bpd = bpdMm / 10;
  const log10 = -1.7492 + 0.55 * bpd + 0.046 * bpd ** 2 - 0.000546 * bpd ** 3;
  return {
    grams: Math.round(10 ** log10),
    formula: "shepard_bpd",
    label: "Shepard (BPD, 1982)",
  };
}

/** Warsof 1984 — BPD only (cm). log10(EFW) = 1.599 + 0.144(BPD) + 0.032(BPD²) − 0.000111(BPD³) */
export function efwWarsof(bpdMm: number): EfwResult | null {
  if (!Number.isFinite(bpdMm) || bpdMm <= 0) return null;
  const bpd = bpdMm / 10;
  const log10 = 1.599 + 0.144 * bpd + 0.032 * bpd ** 2 - 0.000111 * bpd ** 3;
  return {
    grams: Math.round(10 ** log10),
    formula: "warsof_bpd",
    label: "Warsof (BPD, 1984)",
  };
}

/** Pick best available formula: Hadlock4 > Hadlock3 > Shepard/Warsof average if only BPD. */
export function estimateFetalWeight(input: EfwInput): EfwResult | null {
  const h4 = efwHadlock4(input);
  if (h4) return h4;
  const h3 = efwHadlock3(input);
  if (h3) return h3;
  if (input.bpdMm) {
    const shepard = efwShepard(input.bpdMm);
    const warsof = efwWarsof(input.bpdMm);
    if (shepard && warsof) {
      return {
        grams: Math.round((shepard.grams + warsof.grams) / 2),
        formula: "shepard_bpd",
        label: "Shepard/Warsof (BPD, среднее)",
      };
    }
    return shepard ?? warsof;
  }
  return null;
}

/** All applicable formulas for comparison UI. */
export function estimateFetalWeightAll(input: EfwInput): EfwResult[] {
  const results: EfwResult[] = [];
  const h4 = efwHadlock4(input);
  if (h4) results.push(h4);
  const h3 = efwHadlock3(input);
  if (h3) results.push(h3);
  if (input.bpdMm) {
    const s = efwShepard(input.bpdMm);
    if (s) results.push(s);
    const w = efwWarsof(input.bpdMm);
    if (w) results.push(w);
  }
  return results;
}
