/**
 * II триместр: мозг, лицо, сердце — p5/p50/p95.
 * Медведев М.В. Пренатальная эхография, 2016, Прил. 5–10, 12.
 */

import { percentileFromMedvedevBand, type PercentileBand } from "./medvedevFirstTrimester";
import type { MedvedevBiometryAssessment } from "./medvedevBiometry";

export const MEDVEDEV_ANATOMY_SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 5–10, 12 (Козлова, Медведев и соавт.).";

export type MedvedevAnatomyMarker =
  | "corpusCallosum"
  | "opticTract"
  | "cerebellumCr"
  | "cerebellumAp"
  | "sylvianDepth"
  | "cerebellarAngle"
  | "csp"
  | "nasalBoneLength";

type WeekBandRow = { week: number; band: PercentileBand };

type RangeBandRow = { weekMin: number; weekMax: number; band: PercentileBand };

const band = (p5: number, p50: number, p95: number): PercentileBand => ({ p5, p50, p95 });

const CORPUS_CALLOSUM: WeekBandRow[] = [
  { week: 18, band: band(9.4, 12.0, 14.6) },
  { week: 19, band: band(12.5, 14.8, 17.4) },
  { week: 20, band: band(15.0, 17.6, 20.2) },
  { week: 21, band: band(17.7, 20.4, 23.1) },
  { week: 22, band: band(20.2, 22.9, 25.6) },
  { week: 23, band: band(22.7, 25.4, 28.1) },
  { week: 24, band: band(24.9, 27.7, 30.5) },
  { week: 25, band: band(27.0, 29.8, 32.6) },
  { week: 26, band: band(29.1, 31.9, 34.7) },
];

const OPTIC_TRACT: WeekBandRow[] = [
  { week: 21, band: band(1.7, 2.0, 2.3) },
  { week: 22, band: band(1.8, 2.1, 2.4) },
  { week: 23, band: band(1.9, 2.2, 2.5) },
  { week: 24, band: band(2.0, 2.3, 2.6) },
  { week: 25, band: band(2.1, 2.4, 2.6) },
  { week: 26, band: band(2.2, 2.5, 2.7) },
  { week: 27, band: band(2.3, 2.5, 2.8) },
  { week: 28, band: band(2.4, 2.6, 2.9) },
  { week: 29, band: band(2.4, 2.7, 3.0) },
  { week: 30, band: band(2.5, 2.8, 3.1) },
  { week: 31, band: band(2.6, 2.9, 3.2) },
  { week: 32, band: band(2.7, 3.0, 3.3) },
  { week: 33, band: band(2.8, 3.1, 3.4) },
  { week: 34, band: band(2.9, 3.2, 3.5) },
];

const CEREBELLUM_CR: WeekBandRow[] = [
  { week: 18, band: band(7.9, 10.6, 13.1) },
  { week: 19, band: band(8.7, 11.3, 13.9) },
  { week: 20, band: band(9.3, 12.0, 14.7) },
  { week: 21, band: band(10.0, 12.8, 15.6) },
  { week: 22, band: band(10.7, 13.6, 16.5) },
  { week: 23, band: band(11.6, 14.6, 17.6) },
  { week: 24, band: band(12.7, 15.8, 18.9) },
  { week: 25, band: band(13.9, 17.0, 20.1) },
  { week: 26, band: band(15.1, 18.2, 21.3) },
];

const CEREBELLUM_AP: WeekBandRow[] = [
  { week: 18, band: band(7.6, 8.6, 9.6) },
  { week: 19, band: band(8.1, 9.2, 10.3) },
  { week: 20, band: band(8.6, 9.8, 11.0) },
  { week: 21, band: band(9.3, 10.5, 11.8) },
  { week: 22, band: band(9.8, 11.2, 12.6) },
  { week: 23, band: band(10.5, 12.0, 13.5) },
  { week: 24, band: band(11.2, 12.8, 14.4) },
  { week: 25, band: band(11.9, 13.6, 15.3) },
  { week: 26, band: band(12.6, 14.4, 16.2) },
];

const SYLVIAN: WeekBandRow[] = [
  { week: 18, band: band(3.46, 4.46, 5.46) },
  { week: 19, band: band(4.22, 5.1, 5.98) },
  { week: 20, band: band(4.84, 5.85, 6.86) },
  { week: 21, band: band(5.12, 6.4, 7.68) },
  { week: 22, band: band(6.05, 7.38, 8.71) },
  { week: 23, band: band(6.86, 8.21, 9.56) },
  { week: 24, band: band(7.77, 9.15, 10.53) },
  { week: 25, band: band(9.12, 10.52, 11.92) },
  { week: 26, band: band(10.48, 11.94, 13.4) },
];

const CEREBELLAR_ANGLE: RangeBandRow[] = [
  { weekMin: 18, weekMax: 20, band: band(3.7, 9.25, 14.8) },
  { weekMin: 21, weekMax: 23, band: band(3.74, 7.94, 12.14) },
  { weekMin: 24, weekMax: 26, band: band(3.72, 7.79, 11.86) },
];

const CSP: WeekBandRow[] = [
  { week: 16, band: band(1.8, 2.8, 3.8) },
  { week: 17, band: band(2.1, 3.2, 4.3) },
  { week: 18, band: band(2.4, 3.6, 4.8) },
  { week: 19, band: band(2.7, 4.0, 5.3) },
  { week: 20, band: band(2.9, 4.3, 5.7) },
  { week: 21, band: band(3.2, 4.6, 6.0) },
  { week: 22, band: band(3.5, 4.9, 6.4) },
  { week: 23, band: band(3.7, 5.2, 6.7) },
  { week: 24, band: band(3.9, 5.5, 7.1) },
  { week: 25, band: band(4.1, 5.7, 7.3) },
  { week: 26, band: band(4.3, 5.9, 7.5) },
];

/** Прил. 12 — середина недельного диапазона. */
const NASAL_BONE_II: WeekBandRow[] = [
  { week: 14, band: band(2.8, 3.3, 3.8) },
  { week: 15, band: band(3.6, 4.1, 4.6) },
  { week: 16, band: band(3.9, 4.4, 4.9) },
  { week: 17, band: band(4.1, 4.6, 5.1) },
  { week: 18, band: band(4.6, 5.2, 5.8) },
  { week: 19, band: band(4.9, 5.5, 6.1) },
  { week: 20, band: band(5.5, 6.3, 7.1) },
  { week: 21, band: band(5.8, 6.6, 7.4) },
  { week: 22, band: band(6.1, 6.9, 7.7) },
  { week: 23, band: band(6.5, 7.4, 8.3) },
  { week: 24, band: band(6.9, 7.9, 8.9) },
  { week: 25, band: band(7.2, 8.4, 9.6) },
  { week: 26, band: band(7.5, 8.8, 10.1) },
];

const MARKER_LABELS: Record<MedvedevAnatomyMarker, string> = {
  corpusCallosum: "ДМТ (мозолистое тело)",
  opticTract: "Толщина зрительных трактов",
  cerebellumCr: "ККР мозжечка",
  cerebellumAp: "ПЗР мозжечка",
  sylvianDepth: "Глубина сильвиевой борозды",
  cerebellarAngle: "Угол ствол–мозжечок",
  csp: "Ширина ППП",
  nasalBoneLength: "Длина кости носа (II трим.)",
};

const MARKER_UNITS: Record<MedvedevAnatomyMarker, string> = {
  corpusCallosum: "мм",
  opticTract: "мм",
  cerebellumCr: "мм",
  cerebellumAp: "мм",
  sylvianDepth: "мм",
  cerebellarAngle: "°",
  csp: "мм",
  nasalBoneLength: "мм",
};

export type SecondTrimesterAnatomyInput = {
  gaWeeksByLmp?: number;
  gaDaysByLmp?: number;
  corpusCallosumLengthMm?: number;
  opticTractThicknessMm?: number;
  cerebellumCrMm?: number;
  cerebellumApMm?: number;
  sylvianDepthMm?: number;
  cerebellarAngleDeg?: number;
  cspWidthMm?: number;
  nasalBoneLengthMm?: number;
};

export type SecondTrimesterSliceItem = {
  id: string;
  block: string;
  slice: string;
  structures: string[];
  markers: string[];
  appendix: string;
};

/** Чеклист срезов II скрининга (18–22 нед) — привязка к показателям Медведева. */
export const SECOND_TRIMESTER_SLICE_CHECKLIST: SecondTrimesterSliceItem[] = [
  {
    id: "head-trans",
    block: "Голова",
    slice: "Аксиально на уровне BPD (таламус, бугры)",
    structures: ["BPD/HC", "лат. желудочки", "ППП", "мозолистое тело"],
    markers: ["csp", "corpusCallosum"],
    appendix: "1, 10, 5",
  },
  {
    id: "head-cerebellum",
    block: "Голова",
    slice: "Transthalamic + мозжечок",
    structures: ["мозжечок ККР/ПЗР", "большая цистерна", "сильвиева борозда"],
    markers: ["cerebellumCr", "cerebellumAp", "sylvianDepth"],
    appendix: "1, 7, 8",
  },
  {
    id: "face-profile",
    block: "Лицо",
    slice: "Срединный профиль",
    structures: ["носовая кость", "верхняя/нижняя челюсть", "губы"],
    markers: ["nasalBoneLength"],
    appendix: "12",
  },
  {
    id: "face-orbit",
    block: "Лицо",
    slice: "Орбиты (аксиально)",
    structures: ["глазницы", "линза", "межорбитное расстояние"],
    markers: ["orbitExtra", "orbitIntra", "orbitDiameter"],
    appendix: "13",
  },
  {
    id: "heart-4ch",
    block: "Сердце",
    slice: "4-камерный",
    structures: ["камеры", "перегородки", "перикард"],
    markers: ["leftAtrium", "rightAtrium", "leftVentricle", "rightVentricle"],
    appendix: "16–19",
  },
  {
    id: "heart-outflow",
    block: "Сердце",
    slice: "Выходные тракты + 3 сосуда",
    structures: ["ЛЖ/ПЖ", "aorta", "ductus", "трахея", "тимус"],
    markers: ["aorta", "thymusPerimeter", "thymusTransverse"],
    appendix: "14–15, 20",
  },
  {
    id: "spine",
    block: "Позвоночник",
    slice: "Сагитталь и попереч",
    structures: ["целостность позвонков", "кожа"],
    markers: [],
    appendix: "протокол",
  },
  {
    id: "abdomen",
    block: "ЖКТ",
    slice: "Поперечный верх живота",
    structures: ["желудок", "ворота печени", "пупочная вена"],
    markers: [],
    appendix: "протокол",
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpBand(a: PercentileBand, b: PercentileBand, t: number): PercentileBand {
  return { p5: lerp(a.p5, b.p5, t), p50: lerp(a.p50, b.p50, t), p95: lerp(a.p95, b.p95, t) };
}

function interpolateWeekRows(rows: WeekBandRow[], gaWeeks: number): PercentileBand | null {
  if (rows.length === 0) return null;
  if (gaWeeks <= rows[0].week) return rows[0].band;
  if (gaWeeks >= rows[rows.length - 1].week) return rows[rows.length - 1].band;
  for (const row of rows) {
    if (Math.abs(gaWeeks - row.week) < 0.001) return row.band;
  }
  for (let i = 0; i < rows.length - 1; i += 1) {
    const left = rows[i];
    const right = rows[i + 1];
    if (gaWeeks > left.week && gaWeeks < right.week) {
      const t = (gaWeeks - left.week) / (right.week - left.week);
      return lerpBand(left.band, right.band, t);
    }
  }
  return rows[rows.length - 1].band;
}

function interpolateRangeRows(rows: RangeBandRow[], gaWeeks: number): PercentileBand | null {
  for (const row of rows) {
    if (gaWeeks >= row.weekMin && gaWeeks <= row.weekMax + 6 / 7) return row.band;
  }
  return null;
}

function gaWeeksDecimal(weeks?: number, days?: number): number | null {
  if (weeks === undefined || !Number.isFinite(weeks)) return null;
  return weeks + (days ?? 0) / 7;
}

function getAnatomyBand(marker: MedvedevAnatomyMarker, gaWeeks: number): PercentileBand | null {
  switch (marker) {
    case "corpusCallosum":
      return interpolateWeekRows(CORPUS_CALLOSUM, gaWeeks);
    case "opticTract":
      return interpolateWeekRows(OPTIC_TRACT, gaWeeks);
    case "cerebellumCr":
      return interpolateWeekRows(CEREBELLUM_CR, gaWeeks);
    case "cerebellumAp":
      return interpolateWeekRows(CEREBELLUM_AP, gaWeeks);
    case "sylvianDepth":
      return interpolateWeekRows(SYLVIAN, gaWeeks);
    case "cerebellarAngle":
      return interpolateRangeRows(CEREBELLAR_ANGLE, gaWeeks);
    case "csp":
      return interpolateWeekRows(CSP, gaWeeks);
    case "nasalBoneLength":
      return interpolateWeekRows(NASAL_BONE_II, gaWeeks);
    default:
      return null;
  }
}

function flagFromPercentile(percentile: number): MedvedevBiometryAssessment["flag"] {
  if (percentile <= 5) return "low";
  if (percentile >= 95) return "high";
  return "normal";
}

function formatValue(value: number, unit: string): string {
  const rounded = unit === "°" ? value.toFixed(1).replace(/\.0$/, "") : value.toFixed(1).replace(/\.0$/, "");
  return `${rounded} ${unit}`;
}

function formatBandRef(band: PercentileBand, unit: string): string {
  return `p5 ${band.p5} · p50 ${band.p50} · p95 ${band.p95} ${unit}`;
}

function assessAnatomyMarker(
  marker: MedvedevAnatomyMarker,
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
      summary: `${label}: укажите срок беременности.`,
    };
  }

  const reference = getAnatomyBand(marker, gaWeeks);
  if (!reference) {
    return {
      marker,
      label,
      value,
      unit,
      reference: null,
      flag: "out_of_range",
      summary: `${label}: таблица недоступна для ${gaWeeks.toFixed(1)} нед.`,
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

export function assessSecondTrimesterAnatomy(input: SecondTrimesterAnatomyInput): MedvedevBiometryAssessment[] {
  const gaWeeks = gaWeeksDecimal(input.gaWeeksByLmp, input.gaDaysByLmp);
  return [
    assessAnatomyMarker("corpusCallosum", input.corpusCallosumLengthMm, gaWeeks),
    assessAnatomyMarker("opticTract", input.opticTractThicknessMm, gaWeeks),
    assessAnatomyMarker("cerebellumCr", input.cerebellumCrMm, gaWeeks),
    assessAnatomyMarker("cerebellumAp", input.cerebellumApMm, gaWeeks),
    assessAnatomyMarker("sylvianDepth", input.sylvianDepthMm, gaWeeks),
    assessAnatomyMarker("cerebellarAngle", input.cerebellarAngleDeg, gaWeeks),
    assessAnatomyMarker("csp", input.cspWidthMm, gaWeeks),
    assessAnatomyMarker("nasalBoneLength", input.nasalBoneLengthMm, gaWeeks),
  ].filter((row) => row.reference !== null || row.value !== undefined);
}

export function listAnatomyAtWeek(week: number): MedvedevBiometryAssessment[] {
  return (
    [
      "corpusCallosum",
      "opticTract",
      "cerebellumCr",
      "cerebellumAp",
      "sylvianDepth",
      "cerebellarAngle",
      "csp",
      "nasalBoneLength",
    ] as MedvedevAnatomyMarker[]
  ).map((marker) => assessAnatomyMarker(marker, undefined, week));
}

export function formatMedvedevAnatomyForProtocol(item: MedvedevBiometryAssessment): string {
  if (item.value !== undefined && item.percentile !== undefined) {
    return `- ${item.label}: ${item.value} ${item.unit} (~${item.percentile}-й перц., Медведев)`;
  }
  if (item.reference) {
    return `- ${item.label}: ${item.summary.replace(/^[^:]+:\s*/, "")}`;
  }
  return `- ${item.summary}`;
}

export const PROTOCOL_FIELD_TO_MEDVEDEV_MARKER: Record<string, string> = {
  bpd_mm: "bpd",
  hc_mm: "hc",
  ac_mm: "ac",
  fl_mm: "fl",
  hl_mm: "hl",
  efw_grams: "efw",
  nt_mm: "nt",
  crl_mm: "crl",
};

export function normsUrlForField(fieldName: string, gaWeeks?: number): string | null {
  const marker = PROTOCOL_FIELD_TO_MEDVEDEV_MARKER[fieldName];
  if (!marker) return null;
  const week = gaWeeks != null ? Math.round(gaWeeks) : 22;
  return `/reference/norms?week=${week}&q=${encodeURIComponent(marker)}`;
}
