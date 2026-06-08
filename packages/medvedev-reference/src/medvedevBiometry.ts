/**
 * II/III скрининг: фетометрия и показатели мозга (p5 / p50 / p95).
 * Источник: Медведев М.В. Пренатальная эхография, 2016, Прил. 1 (Медведев и соавт., 1999).
 * Мозг (лат. желудочки, цистерна, мозжечок): таблица к Прил. 1, стр. 622.
 */

import { assessSecondTrimesterAnatomy } from "./medvedevSecondTrimesterAnatomy";
import { assessHeartOrbitsScreening, type HeartOrbitsInput } from "./medvedevHeartOrbits";
import { percentileFromMedvedevBand, type PercentileBand } from "./medvedevFirstTrimester";

/** Hadlock IV (BPD, HC, AC, FL in mm) — Radiology 1985. */
function hadlockEfwGrams(input: {
  bpd?: number;
  hc?: number;
  ac?: number;
  fl?: number;
}): number | null {
  const { bpd, hc, ac, fl } = input;
  if (![bpd, hc, ac, fl].every((x) => typeof x === "number" && x > 0)) return null;
  const bpdCm = bpd! / 10;
  const hcCm = hc! / 10;
  const acCm = ac! / 10;
  const flCm = fl! / 10;
  const log10 =
    1.3596 -
    0.00386 * acCm * flCm +
    0.0064 * hcCm +
    0.00061 * bpdCm * acCm +
    0.0424 * acCm +
    0.174 * flCm;
  return Math.round(10 ** log10);
}

export const MEDVEDEV_BIOMETRY_SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 1 (Медведев и соавт., 1999).";

export const MEDVEDEV_BIOMETRY_MIN_WEEK = 16;
export const MEDVEDEV_BIOMETRY_MAX_WEEK = 40;

export type MedvedevBiometryMarker =
  | "bpd"
  | "ofd"
  | "hc"
  | "ac"
  | "fl"
  | "hl"
  | "efw"
  | "lateralVentricle"
  | "cisternaMagna"
  | "cerebellumTransverse";

export type MedvedevBiometryAssessment = {
  marker: MedvedevBiometryMarker | string;
  label: string;
  value?: number;
  unit: string;
  reference: PercentileBand | null;
  percentile?: number;
  flag: "low" | "normal" | "high" | "unknown" | "out_of_range";
  summary: string;
};

type BiometryRow = {
  week: number;
  bpd: PercentileBand;
  ofd: PercentileBand;
  hc: PercentileBand;
  ac: PercentileBand;
  fl: PercentileBand;
  hl: PercentileBand;
};

type BrainRow = {
  week: number;
  lateralVentricle?: PercentileBand;
  cisternaMagna?: PercentileBand;
  cerebellumTransverse?: PercentileBand;
};

const band = (p5: number, p50: number, p95: number): PercentileBand => ({ p5, p50, p95 });

/** Прил. 1 — BPD, OFD, HC, AC, FL, HL по неделям 16–40. */
const BIOMETRY_ROWS: BiometryRow[] = [
  { week: 16, bpd: band(31, 34, 37), ofd: band(41, 45, 49), hc: band(112, 124, 136), ac: band(88, 102, 116), fl: band(17, 20, 23), hl: band(15, 18, 21) },
  { week: 17, bpd: band(34, 38, 42), ofd: band(46, 50, 54), hc: band(121, 135, 149), ac: band(93, 112, 131), fl: band(20, 24, 28), hl: band(17, 21, 25) },
  { week: 18, bpd: band(37, 42, 47), ofd: band(49, 54, 59), hc: band(131, 146, 161), ac: band(104, 124, 144), fl: band(23, 27, 31), hl: band(20, 24, 28) },
  { week: 19, bpd: band(41, 45, 49), ofd: band(53, 58, 63), hc: band(142, 158, 174), ac: band(114, 134, 154), fl: band(26, 30, 34), hl: band(23, 27, 31) },
  { week: 20, bpd: band(43, 48, 53), ofd: band(56, 62, 68), hc: band(154, 170, 186), ac: band(124, 144, 164), fl: band(29, 33, 37), hl: band(26, 30, 34) },
  { week: 21, bpd: band(46, 51, 56), ofd: band(60, 66, 72), hc: band(166, 183, 200), ac: band(137, 157, 177), fl: band(32, 36, 40), hl: band(29, 33, 37) },
  { week: 22, bpd: band(48, 54, 60), ofd: band(64, 70, 76), hc: band(178, 195, 212), ac: band(148, 169, 190), fl: band(35, 39, 43), hl: band(31, 35, 39) },
  { week: 23, bpd: band(52, 58, 64), ofd: band(67, 74, 81), hc: band(190, 207, 224), ac: band(160, 181, 202), fl: band(37, 41, 45), hl: band(34, 38, 42) },
  { week: 24, bpd: band(55, 61, 67), ofd: band(71, 78, 85), hc: band(201, 219, 237), ac: band(172, 193, 224), fl: band(40, 44, 48), hl: band(36, 40, 44) },
  { week: 25, bpd: band(58, 64, 70), ofd: band(73, 81, 89), hc: band(214, 232, 250), ac: band(183, 206, 229), fl: band(42, 46, 50), hl: band(39, 43, 47) },
  { week: 26, bpd: band(61, 67, 73), ofd: band(77, 85, 93), hc: band(224, 243, 262), ac: band(194, 217, 240), fl: band(45, 49, 53), hl: band(41, 45, 49) },
  { week: 27, bpd: band(64, 70, 76), ofd: band(80, 88, 96), hc: band(235, 254, 273), ac: band(205, 229, 253), fl: band(47, 51, 55), hl: band(43, 47, 51) },
  { week: 28, bpd: band(67, 73, 79), ofd: band(83, 91, 99), hc: band(245, 265, 285), ac: band(217, 241, 265), fl: band(49, 53, 57), hl: band(45, 49, 53) },
  { week: 29, bpd: band(70, 76, 82), ofd: band(86, 94, 102), hc: band(255, 275, 295), ac: band(228, 253, 278), fl: band(50, 55, 60), hl: band(47, 51, 55) },
  { week: 30, bpd: band(71, 78, 85), ofd: band(89, 97, 105), hc: band(265, 285, 305), ac: band(238, 264, 290), fl: band(52, 57, 62), hl: band(49, 53, 57) },
  { week: 31, bpd: band(73, 80, 87), ofd: band(93, 101, 109), hc: band(273, 294, 315), ac: band(247, 274, 301), fl: band(54, 59, 64), hl: band(51, 55, 59) },
  { week: 32, bpd: band(75, 82, 89), ofd: band(95, 104, 113), hc: band(283, 304, 325), ac: band(258, 286, 314), fl: band(56, 61, 66), hl: band(52, 56, 60) },
  { week: 33, bpd: band(77, 84, 91), ofd: band(98, 107, 116), hc: band(289, 311, 333), ac: band(267, 296, 325), fl: band(58, 63, 68), hl: band(54, 58, 62) },
  { week: 34, bpd: band(79, 86, 93), ofd: band(101, 110, 119), hc: band(295, 317, 339), ac: band(276, 306, 336), fl: band(60, 65, 70), hl: band(55, 59, 63) },
  { week: 35, bpd: band(81, 88, 95), ofd: band(103, 112, 121), hc: band(299, 322, 345), ac: band(285, 315, 345), fl: band(62, 67, 72), hl: band(57, 61, 65) },
  { week: 36, bpd: band(83, 90, 97), ofd: band(104, 114, 124), hc: band(303, 326, 349), ac: band(292, 323, 354), fl: band(64, 69, 74), hl: band(58, 62, 66) },
  { week: 37, bpd: band(85, 92, 98), ofd: band(106, 116, 126), hc: band(307, 330, 353), ac: band(299, 330, 361), fl: band(66, 71, 76), hl: band(59, 63, 67) },
  { week: 38, bpd: band(86, 94, 100), ofd: band(108, 118, 128), hc: band(309, 333, 357), ac: band(304, 336, 368), fl: band(68, 73, 78), hl: band(60, 64, 68) },
  { week: 39, bpd: band(88, 95, 102), ofd: band(109, 119, 129), hc: band(311, 335, 359), ac: band(310, 342, 374), fl: band(69, 74, 79), hl: band(60, 65, 70) },
  { week: 40, bpd: band(89, 96, 103), ofd: band(110, 120, 130), hc: band(312, 337, 362), ac: band(313, 347, 381), fl: band(70, 75, 80), hl: band(61, 66, 71) },
];

/** Мозг — лат. желудочки, большая цистерна, поперечный диаметр мозжечка. */
const BRAIN_ROWS: BrainRow[] = [
  { week: 16, cerebellumTransverse: band(12, 14, 16) },
  { week: 17, cerebellumTransverse: band(14, 16, 18) },
  { week: 18, lateralVentricle: band(4.9, 6.2, 7.5), cisternaMagna: band(2.8, 4.4, 6.0), cerebellumTransverse: band(15, 17, 19) },
  { week: 19, lateralVentricle: band(5.0, 6.3, 7.6), cisternaMagna: band(3.0, 4.6, 6.2), cerebellumTransverse: band(16, 18, 20) },
  { week: 20, lateralVentricle: band(5.1, 6.4, 7.7), cisternaMagna: band(3.2, 4.8, 6.4), cerebellumTransverse: band(18, 20, 22) },
  { week: 21, lateralVentricle: band(5.1, 6.5, 7.9), cisternaMagna: band(3.4, 5.1, 6.8), cerebellumTransverse: band(19, 21, 23) },
  { week: 22, lateralVentricle: band(5.2, 6.6, 8.0), cisternaMagna: band(3.6, 5.4, 7.2), cerebellumTransverse: band(20, 23, 26) },
  { week: 23, lateralVentricle: band(5.3, 6.8, 8.3), cisternaMagna: band(3.9, 5.7, 7.5), cerebellumTransverse: band(21, 24, 27) },
  { week: 24, lateralVentricle: band(5.4, 6.9, 8.4), cisternaMagna: band(4.1, 6.0, 7.9), cerebellumTransverse: band(23, 26, 29) },
  { week: 25, lateralVentricle: band(5.5, 7.0, 8.5), cisternaMagna: band(4.2, 6.2, 8.2), cerebellumTransverse: band(24, 27, 30) },
  { week: 26, lateralVentricle: band(5.6, 7.2, 8.7), cisternaMagna: band(4.4, 6.4, 8.4), cerebellumTransverse: band(26, 29, 32) },
];

const MARKER_LABELS: Record<MedvedevBiometryMarker, string> = {
  bpd: "BPD (БПР)",
  ofd: "OFD (ЛЗР)",
  hc: "HC (ОГ)",
  ac: "AC (ОЖ)",
  fl: "FL (ДБ)",
  hl: "HL (ДП)",
  efw: "EFW (масса плода)",
  lateralVentricle: "Лат. желудочки",
  cisternaMagna: "Большая цистерна",
  cerebellumTransverse: "Мозжечок (поперечный)",
};

const MARKER_UNITS: Record<MedvedevBiometryMarker, string> = {
  bpd: "мм",
  ofd: "мм",
  hc: "мм",
  ac: "мм",
  fl: "мм",
  hl: "мм",
  efw: "г",
  lateralVentricle: "мм",
  cisternaMagna: "мм",
  cerebellumTransverse: "мм",
};

export const MEDVEDEV_BIOMETRY_METRIC_OPTIONS: {
  id: MedvedevBiometryMarker;
  label: string;
  unit: string;
  group: "fetometry" | "brain";
}[] = [
  { id: "bpd", label: MARKER_LABELS.bpd, unit: "мм", group: "fetometry" },
  { id: "ofd", label: MARKER_LABELS.ofd, unit: "мм", group: "fetometry" },
  { id: "hc", label: MARKER_LABELS.hc, unit: "мм", group: "fetometry" },
  { id: "ac", label: MARKER_LABELS.ac, unit: "мм", group: "fetometry" },
  { id: "fl", label: MARKER_LABELS.fl, unit: "мм", group: "fetometry" },
  { id: "hl", label: MARKER_LABELS.hl, unit: "мм", group: "fetometry" },
  { id: "efw", label: MARKER_LABELS.efw, unit: "г", group: "fetometry" },
  { id: "lateralVentricle", label: MARKER_LABELS.lateralVentricle, unit: "мм", group: "brain" },
  { id: "cisternaMagna", label: MARKER_LABELS.cisternaMagna, unit: "мм", group: "brain" },
  { id: "cerebellumTransverse", label: MARKER_LABELS.cerebellumTransverse, unit: "мм", group: "brain" },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpBand(a: PercentileBand, b: PercentileBand, t: number): PercentileBand {
  return { p5: lerp(a.p5, b.p5, t), p50: lerp(a.p50, b.p50, t), p95: lerp(a.p95, b.p95, t) };
}

function pickBiometryBand(row: BiometryRow, marker: MedvedevBiometryMarker): PercentileBand | null {
  if (marker === "bpd") return row.bpd;
  if (marker === "ofd") return row.ofd;
  if (marker === "hc") return row.hc;
  if (marker === "ac") return row.ac;
  if (marker === "fl") return row.fl;
  if (marker === "hl") return row.hl;
  return null;
}

function pickBrainBand(row: BrainRow, marker: MedvedevBiometryMarker): PercentileBand | null {
  if (marker === "lateralVentricle") return row.lateralVentricle ?? null;
  if (marker === "cisternaMagna") return row.cisternaMagna ?? null;
  if (marker === "cerebellumTransverse") return row.cerebellumTransverse ?? null;
  return null;
}

function interpolateRows<T extends { week: number }>(
  rows: T[],
  gaWeeks: number,
  pick: (row: T) => PercentileBand | null,
): PercentileBand | null {
  if (rows.length === 0) return null;
  const minWeek = rows[0].week;
  const maxWeek = rows[rows.length - 1].week;

  if (gaWeeks <= minWeek) return pick(rows[0]);
  if (gaWeeks >= maxWeek) return pick(rows[rows.length - 1]);

  for (const row of rows) {
    if (Math.abs(gaWeeks - row.week) < 0.001) return pick(row);
  }

  for (let i = 0; i < rows.length - 1; i += 1) {
    const left = rows[i];
    const right = rows[i + 1];
    if (gaWeeks > left.week && gaWeeks < right.week) {
      const leftBand = pick(left);
      const rightBand = pick(right);
      if (!leftBand || !rightBand) return leftBand ?? rightBand;
      const t = (gaWeeks - left.week) / (right.week - left.week);
      return lerpBand(leftBand, rightBand, t);
    }
  }

  return pick(rows[rows.length - 1]);
}

export function gaWeeksDecimal(weeks?: number, days?: number): number | null {
  if (weeks === undefined || !Number.isFinite(weeks)) return null;
  return weeks + (days ?? 0) / 7;
}

function efwReferenceBand(gaWeeks: number): PercentileBand | null {
  const bpd = getMedvedevBiometryBand(gaWeeks, "bpd");
  const hc = getMedvedevBiometryBand(gaWeeks, "hc");
  const ac = getMedvedevBiometryBand(gaWeeks, "ac");
  const fl = getMedvedevBiometryBand(gaWeeks, "fl");
  if (!bpd || !hc || !ac || !fl) return null;

  const p5 = hadlockEfwGrams({ bpd: bpd.p5, hc: hc.p5, ac: ac.p5, fl: fl.p5 });
  const p50 = hadlockEfwGrams({ bpd: bpd.p50, hc: hc.p50, ac: ac.p50, fl: fl.p50 });
  const p95 = hadlockEfwGrams({ bpd: bpd.p95, hc: hc.p95, ac: ac.p95, fl: fl.p95 });

  if (p5 == null || p50 == null || p95 == null) return null;
  return { p5, p50, p95 };
}

/** Референс p5/p50/p95 для GA 16–40 нед с интерполяцией. */
export function getMedvedevBiometryBand(
  gaWeeks: number,
  marker: MedvedevBiometryMarker,
): PercentileBand | null {
  if (!Number.isFinite(gaWeeks)) return null;

  if (marker === "efw") {
    if (gaWeeks < MEDVEDEV_BIOMETRY_MIN_WEEK || gaWeeks > MEDVEDEV_BIOMETRY_MAX_WEEK) return null;
    return efwReferenceBand(gaWeeks);
  }

  if (
    marker === "lateralVentricle" ||
    marker === "cisternaMagna" ||
    marker === "cerebellumTransverse"
  ) {
    return interpolateRows(BRAIN_ROWS, gaWeeks, (row) => pickBrainBand(row, marker));
  }

  if (gaWeeks < MEDVEDEV_BIOMETRY_MIN_WEEK || gaWeeks > MEDVEDEV_BIOMETRY_MAX_WEEK) return null;
  return interpolateRows(BIOMETRY_ROWS, gaWeeks, (row) => pickBiometryBand(row, marker));
}

function flagFromPercentile(percentile: number): MedvedevBiometryAssessment["flag"] {
  if (percentile <= 5) return "low";
  if (percentile >= 95) return "high";
  return "normal";
}

function formatValue(value: number, unit: string): string {
  const rounded = unit === "г" ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, "");
  return `${rounded} ${unit}`;
}

function formatBandRef(band: PercentileBand, unit: string): string {
  if (unit === "г") {
    return `p5 ${Math.round(band.p5)} · p50 ${Math.round(band.p50)} · p95 ${Math.round(band.p95)} г`;
  }
  return `p5 ${band.p5} · p50 ${band.p50} · p95 ${band.p95} мм`;
}

function assessMarker(
  marker: MedvedevBiometryMarker,
  value: number | undefined,
  gaWeeks: number | null,
): MedvedevBiometryAssessment {
  const label = MARKER_LABELS[marker];
  const unit = MARKER_UNITS[marker];

  if (gaWeeks == null) {
    return {
      marker,
      label,
      value,
      unit,
      reference: null,
      flag: "unknown",
      summary: `${label}: укажите срок беременности (нед + дни).`,
    };
  }

  const reference = getMedvedevBiometryBand(gaWeeks, marker);
  if (!reference) {
    return {
      marker,
      label,
      value,
      unit,
      reference: null,
      flag: "out_of_range",
      summary: `${label}: таблица Прил. 1 для ${MEDVEDEV_BIOMETRY_MIN_WEEK}–${MEDVEDEV_BIOMETRY_MAX_WEEK} нед (сейчас ${gaWeeks.toFixed(1)} нед).`,
    };
  }

  if (value === undefined) {
    return {
      marker,
      label,
      unit,
      reference,
      flag: "unknown",
      summary: `${label}: норма при ${gaWeeks.toFixed(1)} нед — ${formatBandRef(reference, unit)}.`,
    };
  }

  const percentile = percentileFromMedvedevBand(value, reference);
  const flag = flagFromPercentile(percentile);
  const flagText =
    flag === "high" ? "выше 95-го перцентиля" : flag === "low" ? "ниже 5-го перцентиля" : "в пределах нормы";

  return {
    marker,
    label,
    value,
    unit,
    reference,
    percentile,
    flag,
    summary: `${label} ${formatValue(value, unit)} → ~${percentile}-й перц. (${flagText}; ref ${formatBandRef(reference, unit)}).`,
  };
}

export type SecondThirdMedvedevInput = HeartOrbitsInput & {
  gaWeeksByLmp?: number;
  gaDaysByLmp?: number;
  bpd?: number;
  ofd?: number;
  hc?: number;
  ac?: number;
  fl?: number;
  lateralVentriclesMm?: number;
  cerebellumMm?: number;
  cisternaMagnaMm?: number;
  corpusCallosumLengthMm?: number;
  opticTractThicknessMm?: number;
  cerebellumCrMm?: number;
  cerebellumApMm?: number;
  sylvianDepthMm?: number;
  cerebellarAngleDeg?: number;
  cspWidthMm?: number;
  nasalBoneLengthMm?: number;
  /** Hadlock EFW (г) — если уже рассчитана. */
  efwGrams?: number;
};

/** Оценка фетометрии, мозга и анатомии II/III по Медведеву. */
export function assessSecondThirdMedvedev(input: SecondThirdMedvedevInput): MedvedevBiometryAssessment[] {
  const gaWeeks = gaWeeksDecimal(input.gaWeeksByLmp, input.gaDaysByLmp);
  const efw =
    input.efwGrams ??
    hadlockEfwGrams({ bpd: input.bpd, hc: input.hc, ac: input.ac, fl: input.fl }) ??
    undefined;

  const biometry = [
    assessMarker("bpd", input.bpd, gaWeeks),
    assessMarker("ofd", input.ofd, gaWeeks),
    assessMarker("hc", input.hc, gaWeeks),
    assessMarker("ac", input.ac, gaWeeks),
    assessMarker("fl", input.fl, gaWeeks),
    assessMarker("efw", efw, gaWeeks),
    assessMarker("lateralVentricle", input.lateralVentriclesMm, gaWeeks),
    assessMarker("cisternaMagna", input.cisternaMagnaMm, gaWeeks),
    assessMarker("cerebellumTransverse", input.cerebellumMm, gaWeeks),
  ];

  const anatomy = assessSecondTrimesterAnatomy(input);
  const heartOrbits = assessHeartOrbitsScreening(input);

  return [...biometry, ...anatomy, ...heartOrbits].filter((row) => row.reference !== null || row.value !== undefined);
}

export function listBiometryAtWeek(week: number): MedvedevBiometryAssessment[] {
  const gaWeeks = week;
  return MEDVEDEV_BIOMETRY_METRIC_OPTIONS.map((opt) => assessMarker(opt.id, undefined, gaWeeks));
}

export function formatMedvedevBiometryForProtocol(item: MedvedevBiometryAssessment): string {
  if (item.value !== undefined && item.percentile !== undefined) {
    const unit = item.unit === "г" ? " г" : " мм";
    return `- ${item.label}: ${item.value}${unit} (~${item.percentile}-й перц., Медведев Прил. 1)`;
  }
  if (item.reference) {
    return `- ${item.label}: ${item.summary.replace(/^[^:]+:\s*/, "")}`;
  }
  return `- ${item.summary}`;
}

export type FmfLegacyMetric = "ac" | "bpd" | "hc" | "fl" | "efw";

function quickPercentileFromBand(value: number, reference: PercentileBand): number {
  const ratio = value / reference.p50;
  if (ratio < 0.85) return 5;
  if (ratio < 0.95) return 15;
  if (ratio > 1.15) return 95;
  if (ratio > 1.05) return 85;
  return 50;
}

/** Замена fmfPercentiles: strict → Медведев Прил. 1, quick → отношение к p50. */
export function calcPercentile(
  metric: FmfLegacyMetric,
  value: number | undefined,
  gaWeeks: number | undefined,
  gaDays: number | undefined,
  mode: "quick" | "strict" = "strict",
): number | null {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return null;
  const ga = gaWeeksDecimal(gaWeeks, gaDays);
  if (ga == null) return null;

  const marker: MedvedevBiometryMarker =
    metric === "efw" ? "efw" : metric === "bpd" ? "bpd" : metric === "hc" ? "hc" : metric === "ac" ? "ac" : "fl";

  const reference = getMedvedevBiometryBand(ga, marker);
  if (!reference) return null;

  if (mode === "quick") return quickPercentileFromBand(value, reference);
  return percentileFromMedvedevBand(value, reference);
}
