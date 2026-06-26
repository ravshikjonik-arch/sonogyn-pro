/**
 * II/III скрининг: фетометрия и показатели мозга (p5 / p50 / p95).
 * Источник: Медведев М.В. Пренатальная эхография, 2016, Прил. 1 (Медведев и соавт., 1999).
 * Мозг (лат. желудочки, цистерна, мозжечок): таблица к Прил. 1, стр. 622.
 */

import biometryTable from "../data/biometry-rows.json";

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

/** Прил. 1 — SSOT: packages/medvedev-reference/data/biometry-rows.json */
const BIOMETRY_ROWS = biometryTable.biometry as BiometryRow[];
const BRAIN_ROWS = biometryTable.brain as BrainRow[];

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
  const rounded = unit === "г" ? Math.round(value).toString() : (Math.round(value * 10) / 10).toFixed(1);
  return `${rounded} ${unit}`;
}

function formatBandRef(band: PercentileBand, unit: string): string {
  if (unit === "г") {
    return `p5 ${Math.round(band.p5)} · p50 ${Math.round(band.p50)} · p95 ${Math.round(band.p95)} г`;
  }
  return `p5 ${formatValue(band.p5, unit)} · p50 ${formatValue(band.p50, unit)} · p95 ${formatValue(band.p95, unit)}`;
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
