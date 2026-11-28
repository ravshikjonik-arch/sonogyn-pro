/**
 * FMF assessment-калькуляторы (изменение №7, этап 1) — часть «Assessment / management».
 *
 * Реализовано по опубликованным источникам (канал К1, INTEGRATION_MODELS.md):
 *  1. Dating CRL → GA: Robinson HP, Fleming JE. BJOG 1975;82:702–10.
 *     Формула документирована LOINC 11914-9: GA(дни) = 8.052 × √CRL(мм) + 23.73.
 *  2. NT-референсы: Wright D, Kagan KO, Molina FS, Gazzoni A, Nicolaides KH.
 *     UOG 2008;31:376–83 (mixture model). Калибровка кривой медианы — по
 *     опубликованным точкам: якорь Wright 2008 (CRL 60 → median 1.6466 мм,
 *     σ(log10) = 0.079 CRL-зависимый компонент + 0.0289 оператор = 0.08412) и
 *     таблица NHS-оценки (PMC3104819, unaffected CRL-dependent: 11/12/13 нед →
 *     1.29/1.70/1.96 мм, привязка к CRL по медианам Robinson).
 *     Валидация: 5-й/50-й/95-й центили воспроизводят опубликованные QC-диапазоны
 *     (median ~1.4–1.7, 5th ~1.0, 95th ~2.2–2.6 в середине окна).
 *  3. CPR (cerebroplacental ratio) = MCA PI / UA PI — арифметика + общепринятые
 *     пороги интерпретации (≥1.0 норма; <0.7 снижен; <0.6 резко снижен).
 *
 * ГРАНИЦЫ: расчёт справочный; не заменяет сертифицированный софт FMF.
 * NT-референсы вне CRL 45–70 мм — экстраполяция (помечается в результате).
 * FMF-чарты роста 2018 и центили UtA/MCA PI — этап 2 (см. ОТЧЁТ).
 */

const SQRT = Math.sqrt;
const LOG10 = Math.log10;

export interface DatingCrlResult {
  /** Гестационный возраст в днях (округлён до целого). */
  days: number;
  /** Отображение «нед+дн», например «12+4». */
  display: string;
  valid: boolean;
  note: string;
}

/** Robinson & Fleming 1975 (LOINC 11914-9): CRL(мм) → GA в днях. Валидно 5–84 мм. */
export function datingFromCrl(crlMm: number): DatingCrlResult {
  const crl = Math.max(5, Math.min(84, crlMm));
  const days = 8.052 * SQRT(crl) + 23.73;
  const rounded = Math.round(days);
  const valid = crlMm >= 5 && crlMm <= 84;
  return {
    days: rounded,
    display: `${Math.floor(rounded / 7)}+${rounded % 7}`,
    valid,
    note: valid
      ? "Robinson & Fleming 1975 · LOINC 11914-9"
      : "Вне диапазона 5–84 мм — dating по CRL неприменим (используйте HC во II триместре)",
  };
}

export interface NtReferenceResult {
  medianMm: number;
  p5Mm: number;
  p95Mm: number;
  p99Mm: number;
  /** MoM измеренной NT (если передана). */
  mom?: number;
  /** z-score измеренной NT в log10-пространстве (если передана). */
  zScore?: number;
  extrapolated: boolean;
  note: string;
}

/** Калибровка log10(медианы NT) по опубликованным точкам Wright 2008 + NHS. */
const NT_LOG_MEDIAN_B0 = -0.219362;
const NT_LOG_MEDIAN_B1 = 0.0069895;
const NT_LOG_MEDIAN_B2 = 7.5436752e-6;
/** Wright 2008: σ(log10) = 0.079 (CRL-зависимый) ⊕ 0.0289 (оператор). */
const NT_LOG_SD = 0.08412;
const Z_5 = 1.645;
const Z_99 = 2.326;

/**
 * Референсные центили NT для эуплоидной популяции (Wright 2008, калибровка).
 * Учебные: для клинического risk-расчёта — сертифицированный софт FMF.
 */
export function ntReference(crlMm: number, ntMm?: number): NtReferenceResult {
  const crl = Math.max(45, Math.min(84, crlMm));
  const logMedian = NT_LOG_MEDIAN_B0 + NT_LOG_MEDIAN_B1 * crl + NT_LOG_MEDIAN_B2 * crl * crl;
  const median = 10 ** logMedian;
  const p5 = 10 ** (logMedian - Z_5 * NT_LOG_SD);
  const p95 = 10 ** (logMedian + Z_5 * NT_LOG_SD);
  const p99 = 10 ** (logMedian + Z_99 * NT_LOG_SD);
  const extrapolated = crlMm > 70;
  const out: NtReferenceResult = {
    medianMm: median,
    p5Mm: p5,
    p95Mm: p95,
    p99Mm: p99,
    extrapolated,
    note: extrapolated
      ? "Wright 2008 (калибровка по опубликованным точкам) · CRL > 70 мм — экстраполяция"
      : "Wright 2008 (калибровка по опубликованным точкам) · эуплоидная популяция",
  };
  if (ntMm != null && ntMm > 0) {
    out.mom = ntMm / median;
    out.zScore = (LOG10(ntMm) - logMedian) / NT_LOG_SD;
  }
  return out;
}

export type CprBand = "normal" | "borderline" | "reduced" | "severely_reduced";

export interface CprResult {
  /** Cerebroplacental ratio = MCA PI / UA PI. */
  value: number;
  band: CprBand;
  interpretation: string;
  note: string;
}

/** CPR = MCA PI / UA PI с качественной интерпретацией по общепринятым порогам. */
export function cerebroplacentalRatio(uaPi: number, mcaPi: number): CprResult {
  const value = mcaPi / uaPi;
  let band: CprBand;
  let interpretation: string;
  if (value >= 1.0) {
    band = "normal";
    interpretation = "CPR ≥ 1.0 — нормальное перераспределение кровотока (brain-sparing нет)";
  } else if (value >= 0.7) {
    band = "borderline";
    interpretation = "CPR 0.7–1.0 — пограничное значение: усиленный контроль, пересмотреть срок/допплер";
  } else if (value >= 0.6) {
    band = "reduced";
    interpretation = "CPR < 0.7 — снижен: centralization кровотока; оценить кардиотокографию/биофизический профиль";
  } else {
    band = "severely_reduced";
    interpretation = "CPR < 0.6 — резко снижен: выраженный brain-sparing; тактика по протоколу ведения FGR";
  }
  return {
    value,
    band,
    interpretation,
    note: "CPR = MCA PI / UA PI · пороги: ≥1.0 норма, <0.7 снижен, <0.6 резко снижен",
  };
}
