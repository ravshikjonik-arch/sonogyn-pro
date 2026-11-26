/**
 * FMF-скрининг трисомий 11–13 недель — УЧЕБНАЯ модель (educational).
 *
 * Принцип FMF: риск пациента = априорный риск (возраст + срок) × LR каждого теста.
 * LR-константы — упрощённые учебные интервалы, НЕ лицензированный алгоритм FMF
 * (см. knowledge-base/INTEGRATION_MODELS.md, канал К1 и дисклеймер ниже).
 * Первоисточники: FMF «The 11-13 weeks scan» (2025–2026);
 * Wright/Nicolaides UOG 2008 (NT mixture); prior — таблица Snijders/Nicolaides.
 *
 * Границы применения: справочный расчёт для врача; не диагноз; не заменяет
 * сертифицированный софт FMF. Красные флаги возвращаются отдельным полем —
 * их обязан озвучить врач/ассистент независимо от итогового числа.
 */

/** Prior Т21: 1 к N по возрасту матери (аппроксимация таблицы Snijders). */
const PRIOR_T21_ONE_IN: Record<number, number> = {
  20: 1068, 21: 1003, 22: 940, 23: 878, 24: 818, 25: 759, 26: 702, 27: 647,
  28: 594, 29: 543, 30: 494, 31: 447, 32: 402, 33: 359, 34: 318, 35: 279,
  36: 242, 37: 207, 38: 175, 39: 146, 40: 119, 41: 96, 42: 77, 43: 61, 44: 48, 45: 38,
};

const MIN_AGE = 20;
const MAX_AGE = 45;
const MIN_GW = 10;
const MAX_GW = 14;
/** Верхняя граница вероятности для отображения (учебное ограничение). */
const MAX_PROBABILITY = 0.9;

export type NasalBone = "present" | "absent";
export type DuctusVenosusAWave = "normal" | "reversed";

export interface FmfScreeningInput {
  /** Возраст матери, полных лет (20–45, вне диапазона — обрезается). */
  ageYears: number;
  /** Срок беременности в неделях (10–14, дробный, обрезается). */
  gestationalWeeks: number;
  /** Толщина NT в мм (0.5–10). */
  ntMm?: number;
  /** ЧСС плода, уд/мин. */
  fetalHeartRateBpm?: number;
  /** Носовая кость. */
  nasalBone?: NasalBone;
  /** Волна «a» в ductus venosus. */
  ductusVenosusAWave?: DuctusVenosusAWave;
  /** Трикуспидальная регургитация (Vmax > 60 см/с, ≥½ систолы). */
  tricuspidRegurgitation?: boolean;
  /** Свободный β-hCG, MoM. */
  freeBetaHcgMom?: number;
  /** PAPP-A, MoM. */
  pappaMom?: number;
}

export interface LrStep {
  test: string;
  lr: number;
  description: string;
  /** Риск Т21 (1 к N, строка) после применения этого шага. */
  cumulativeRisk: string;
}

export interface RedFlag {
  code: string;
  message: string;
}

export interface TrisomyRisk {
  /** Обозначение: T21 | T18 | T13 */
  trisomy: "T21" | "T18" | "T13";
  /** Вероятность (ограничена сверху MAX_PROBABILITY). */
  probability: number;
  /** «1 : N» для отображения. */
  display: string;
  category: "low" | "intermediate" | "high";
  /** Для T18/T13 — учебный ориентир (масштабирование LR Т21). */
  approximate: boolean;
}

export interface FmfScreeningResult {
  priorT21: string;
  finalT21: string;
  risks: TrisomyRisk[];
  /** Прозрачная цепочка: априорный риск × LR (только для Т21). */
  chain: LrStep[];
  redFlags: RedFlag[];
  disclaimer: string;
}

const DISCLAIMER =
  "Учебный расчёт по принципу FMF «априорный риск × LR» с упрощёнными LR. " +
  "Не воспроизводит лицензированный алгоритм FMF; не диагноз; решение за врачом.";

function priorT21(age: number): number {
  const a = Math.max(MIN_AGE, Math.min(MAX_AGE, age));
  const lo = Math.floor(a);
  const hi = Math.ceil(a);
  const nLo = PRIOR_T21_ONE_IN[lo]!;
  const nHi = PRIOR_T21_ONE_IN[hi]!;
  const n = lo === hi ? nLo : nLo + (nHi - nLo) * (a - lo);
  return 1 / n;
}

/** Биохимия информативнее в 11 нед, УЗИ — в 12: линейный учебный фактор. */
function gestationalFactor(weeks: number): number {
  const w = Math.max(MIN_GW, Math.min(MAX_GW, weeks));
  return 1 - 0.03 * (w - 12);
}

function lrNt(v: number): [number, string] {
  if (v < 1.2) return [0.4, "NT < 1.2 мм — ниже медианы"];
  if (v < 2.0) return [0.6, "NT 1.2–1.9 мм"];
  if (v < 2.5) return [1.2, "NT 2.0–2.4 мм"];
  if (v < 3.0) return [2.5, "NT 2.5–2.9 мм — выше 95-го центиля"];
  if (v < 3.5) return [6, "NT 3.0–3.4 мм"];
  if (v < 4.5) return [17, "NT 3.5–4.4 мм — ≥99-го центиля"];
  if (v < 5.5) return [28, "NT 4.5–5.4 мм"];
  return [40, "NT ≥ 5.5 мм"];
}

function lrNasalBone(s?: NasalBone): [number, string] | null {
  if (s === "absent") return [25, "носовая кость отсутствует"];
  if (s === "present") return [0.5, "носовая кость визуализируется"];
  return null;
}

function lrDuctusVenosus(s?: DuctusVenosusAWave): [number, string] | null {
  if (s === "reversed") return [20, "reversed a-wave в ductus venosus"];
  if (s === "normal") return [0.4, "поток DV без реверса волны «a»"];
  return null;
}

function lrTricuspid(tr?: boolean): [number, string] | null {
  if (tr === true) return [40, "трикуспидальная регургитация"];
  if (tr === false) return [0.5, "трикуспидальной регургитации нет"];
  return null;
}

function lrFhr(bpm?: number): [number, string] | null {
  if (bpm == null) return null;
  if (bpm >= 165) return [2, "ЧСС повышена (>95-го центиля)"];
  if (bpm <= 115) return [1.4, "ЧСС снижена (<5-го центиля)"];
  return null;
}

function lrHcg(mom?: number): [number, string] | null {
  if (mom == null) return null;
  if (mom >= 2.0) return [3, "β-hCG ≥2.0 MoM"];
  if (mom >= 1.5) return [1.8, "β-hCG 1.5–2.0 MoM"];
  if (mom >= 1.0) return [1, "β-hCG ~1.0 MoM"];
  if (mom >= 0.5) return [0.7, "β-hCG 0.5–1.0 MoM"];
  return [0.6, "β-hCG <0.5 MoM"];
}

function lrPappa(mom?: number): [number, string] | null {
  if (mom == null) return null;
  if (mom <= 0.3) return [5, "PAPP-A ≤0.3 MoM"];
  if (mom <= 0.5) return [3, "PAPP-A 0.3–0.5 MoM"];
  if (mom <= 0.7) return [1.8, "PAPP-A 0.5–0.7 MoM"];
  if (mom <= 1.2) return [1, "PAPP-A ~1.0 MoM"];
  return [0.7, "PAPP-A >1.2 MoM"];
}

function fmtRisk(p: number): string {
  if (p >= 0.5) return ">1:2";
  if (p <= 0) return "—";
  const inv = 1 / p;
  const rounded = inv >= 1000 ? Math.round(Math.round(inv) / 100) * 100 : Math.round(inv);
  return `1 : ${String(rounded)}`;
}

function categoryOf(p: number): TrisomyRisk["category"] {
  if (p >= 1 / 100) return "high";
  if (p >= 1 / 1000) return "intermediate";
  return "low";
}

function collectRedFlags(input: FmfScreeningInput): RedFlag[] {
  const flags: RedFlag[] = [];
  if (input.ntMm != null && input.ntMm >= 5.5) {
    flags.push({
      code: "NT_SEVERE",
      message: "NT ≥ 5.5 мм: риск ВПС у эуплоидов ≈ 12.5% — эхокардиография 14–16 нед и 20–22 нед.",
    });
  } else if (input.ntMm != null && input.ntMm >= 3.5) {
    flags.push({
      code: "NT_HIGH",
      message: "NT ≥ 3.5 мм: CVS + кариотип + микроаррей независимо от риска; детальный скан 11–13 нед → повтор ~через 2 нед → 20 нед.",
    });
  }
  if (input.ductusVenosusAWave === "reversed") {
    flags.push({
      code: "DV_REVERSED",
      message: "Reversed a-wave DV: ↑ риск ВПС и гибели плода (особенно при низком PAPP-A) — детальное исследование сердца.",
    });
  }
  if (input.tricuspidRegurgitation === true) {
    flags.push({
      code: "TR_POSITIVE",
      message: "Трикуспидальная регургитация: ↑ риск анеуплоидий и ВПС — детальное УЗИ сердца.",
    });
  }
  if (input.pappaMom != null && input.pappaMom <= 0.4) {
    flags.push({
      code: "PAPPA_LOW",
      message: "PAPP-A ≤ 0.4 MoM: скрининг преэклампсии и FGR; профилактика аспирином по локальному протоколу.",
    });
  }
  return flags;
}

/**
 * Учебный расчёт риска трисомий. Прозрачная LR-цепочка возвращается целиком —
 * это и обучение, и доверие: врач видит вклад каждого теста.
 */
export function fmfScreening(input: FmfScreeningInput): FmfScreeningResult {
  const gf = gestationalFactor(input.gestationalWeeks);
  let p21 = priorT21(input.ageYears) * gf;
  const priorP21 = p21;

  const steps: Array<{ test: string; lr: number; description: string }> = [];
  const apply = (test: string, pair: [number, string] | null) => {
    if (!pair) return;
    const [lr, description] = pair;
    p21 = Math.min(p21 * lr, MAX_PROBABILITY);
    steps.push({ test, lr, description });
  };

  if (input.ntMm != null) apply("NT", lrNt(input.ntMm));
  apply("Носовая кость", lrNasalBone(input.nasalBone));
  apply("DV", lrDuctusVenosus(input.ductusVenosusAWave));
  apply("Трикуспидид", lrTricuspid(input.tricuspidRegurgitation));
  apply("ЧСС", lrFhr(input.fetalHeartRateBpm));
  apply("β-hCG", lrHcg(input.freeBetaHcgMom));
  apply("PAPP-A", lrPappa(input.pappaMom));

  const p18 = Math.min((priorP21 / 2.5) * (p21 / priorP21), MAX_PROBABILITY);
  const p13 = Math.min((priorP21 / 7) * (p21 / priorP21), MAX_PROBABILITY);

  const toRisk = (trisomy: TrisomyRisk["trisomy"], p: number, approximate: boolean): TrisomyRisk => ({
    trisomy,
    probability: p,
    display: fmtRisk(p),
    category: categoryOf(p),
    approximate,
  });

  const chain: LrStep[] = [];
  let acc = priorP21;
  for (const s of steps) {
    acc = Math.min(acc * s.lr, MAX_PROBABILITY);
    chain.push({ ...s, cumulativeRisk: fmtRisk(acc) });
  }

  return {
    priorT21: fmtRisk(priorP21),
    finalT21: fmtRisk(p21),
    risks: [toRisk("T21", p21, false), toRisk("T18", p18, true), toRisk("T13", p13, true)],
    chain,
    redFlags: collectRedFlags(input),
    disclaimer: DISCLAIMER,
  };
}
