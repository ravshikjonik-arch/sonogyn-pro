/**
 * Упрощённые LR маркеров I–II триместра (ориентир FMF / Woodward).
 * Не заменяет сертифицированный калькулятор FMF.
 */

export type AneuploidyCondition = "trisomy-21" | "trisomy-18" | "trisomy-13" | "turner-syndrome" | "triploidy";

export const CONDITION_LABELS: Record<AneuploidyCondition, string> = {
  "trisomy-21": "Трисомия 21",
  "trisomy-18": "Трисомия 18",
  "trisomy-13": "Трисомия 13",
  "turner-syndrome": "Синдром Turner",
  triploidy: "Триплоидия",
};

/** Prior risk T21 at 12 weeks by maternal age (approx. Snijders / FMF). */
const PRIOR_T21_BY_AGE: Record<number, number> = {
  20: 1 / 1500,
  25: 1 / 900,
  30: 1 / 450,
  35: 1 / 270,
  40: 1 / 100,
  45: 1 / 50,
};

function interpolatePrior(ageYears: number): number {
  const ages = Object.keys(PRIOR_T21_BY_AGE)
    .map(Number)
    .sort((a, b) => a - b);
  if (ageYears <= ages[0]) return PRIOR_T21_BY_AGE[ages[0]];
  if (ageYears >= ages[ages.length - 1]) return PRIOR_T21_BY_AGE[ages[ages.length - 1]];
  let lo = ages[0];
  for (const hi of ages) {
    if (hi >= ageYears) {
      if (lo === hi) return PRIOR_T21_BY_AGE[lo];
      const t = (ageYears - lo) / (hi - lo);
      return PRIOR_T21_BY_AGE[lo] + t * (PRIOR_T21_BY_AGE[hi] - PRIOR_T21_BY_AGE[lo]);
    }
    lo = hi;
  }
  return PRIOR_T21_BY_AGE[ages[ages.length - 1]];
}

/** Prior risk at 12 weeks by maternal age (approx. Snijders / ACCE). */
export function priorRiskAt12Weeks(ageYears: number, condition: AneuploidyCondition): number {
  if (!Number.isFinite(ageYears) || ageYears < 15 || ageYears > 55) return 0.001;

  const baseT21 = interpolatePrior(ageYears);
  const scale: Record<AneuploidyCondition, number> = {
    "trisomy-21": 1,
    "trisomy-18": 0.25,
    "trisomy-13": 0.1,
    "turner-syndrome": 0.06,
    triploidy: 0.04,
  };
  return Math.min(0.25, baseT21 * scale[condition]);
}

export type MarkerId =
  | "increased_nt"
  | "absent_nasal_bone"
  | "tricuspid_regurgitation"
  | "reversed_dv_a_wave"
  | "high_dv_pi"
  | "echogenic_bowel"
  | "short_fl"
  | "short_hl"
  | "echogenic_focus"
  | "pyelectasis"
  | "ventriculomegaly";

/** LR+ по маркерам (упрощённо, по литературе FMF/Woodward). */
export const MARKER_LIKELIHOOD_RATIOS: Record<
  MarkerId,
  Partial<Record<AneuploidyCondition, number>>
> = {
  increased_nt: {
    "trisomy-21": 18,
    "trisomy-18": 44,
    "trisomy-13": 21,
    "turner-syndrome": 8,
    triploidy: 12,
  },
  absent_nasal_bone: {
    "trisomy-21": 17,
    "trisomy-18": 4,
    "trisomy-13": 3,
  },
  tricuspid_regurgitation: {
    "trisomy-21": 2.5,
    "trisomy-18": 3,
    "trisomy-13": 2.8,
    triploidy: 4,
  },
  reversed_dv_a_wave: {
    "trisomy-21": 5.5,
    "trisomy-18": 6,
    "trisomy-13": 4,
    triploidy: 8,
  },
  high_dv_pi: {
    "trisomy-21": 2.2,
    "trisomy-18": 3,
    triploidy: 5,
  },
  echogenic_bowel: { "trisomy-21": 6.5 },
  short_fl: { "trisomy-21": 2.5, "trisomy-18": 4 },
  short_hl: { "trisomy-21": 2.3, "trisomy-18": 3.5 },
  echogenic_focus: { "trisomy-21": 2.8 },
  pyelectasis: { "trisomy-21": 1.9 },
  ventriculomegaly: { "trisomy-21": 2.5 },
};

/** NT порог мм (скрининг) — если нет CRL-специфичного расчёта. */
export const NT_ABNORMAL_MM = 3.5;

/** CRL → GA days (Robinson, approx.) */
export function gaDaysFromCrl(crlMm: number): number {
  if (!Number.isFinite(crlMm) || crlMm <= 0) return 0;
  return Math.round(Math.exp(1.684 + 0.3156 * crlMm - 0.0043 * crlMm ** 2));
}

export function isNtIncreased(ntMm: number, crlMm?: number): boolean {
  if (ntMm >= NT_ABNORMAL_MM) return true;
  if (crlMm != null && crlMm >= 45 && crlMm <= 84) {
    const expectedMedian = 1.0 + crlMm * 0.015;
    return ntMm >= expectedMedian * 1.5;
  }
  return ntMm >= 2.5;
}

export function updatePosteriorRisk(prior: number, likelihoodRatio: number): number {
  if (prior <= 0 || prior >= 1) return prior;
  const odds = prior / (1 - prior);
  const postOdds = odds * likelihoodRatio;
  return Math.min(0.95, postOdds / (1 + postOdds));
}
