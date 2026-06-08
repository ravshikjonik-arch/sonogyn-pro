/**
 * Плацента, воды, длина пальцев — Медведев 2016.
 * Прил. 33 — длина пальцев кисти (Tovbin, 14–27 нед).
 * Прил. 34 — толщина плаценты (Яковенко, 14–40 нед).
 * Прил. 35 — ИАЖ (Moore, 16–42 нед).
 */

import { percentileFromMedvedevBand, type PercentileBand } from "./medvedevFirstTrimester";

export const MEDVEDEV_FINGER_SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 33 (Tovbin, 14–27 нед).";

export const MEDVEDEV_PLACENTA_SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 34 (Яковенко, 1994).";

export const MEDVEDEV_AFI_SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 35 (Moore, 1990).";

export type MedvedevFingerId = "fingerI" | "fingerII" | "fingerIII" | "fingerIV" | "fingerV";

export type MedvedevPlacentaAfiMarker =
  | MedvedevFingerId
  | "placentaThickness"
  | "afi";

export type MedvedevPlacentaAfiAssessment = {
  marker: MedvedevPlacentaAfiMarker;
  label: string;
  value?: number;
  unit: string;
  reference: PercentileBand | null;
  percentile?: number;
  flag: "low" | "normal" | "high" | "unknown" | "out_of_range";
  summary: string;
};

const band = (p5: number, p50: number, p95: number): PercentileBand => ({ p5, p50, p95 });

type FingerRow = Record<MedvedevFingerId, PercentileBand> & { week: number };

/** Прил. 33 — длина пальцев (мм), 14–27 нед. */
const FINGER_ROWS: FingerRow[] = [
  { week: 14, fingerI: band(3.1, 4.7, 6.4), fingerII: band(3.5, 5.9, 8.3), fingerIII: band(3.9, 6.4, 9.0), fingerIV: band(3.9, 6.3, 8.7), fingerV: band(3.4, 5.5, 7.5) },
  { week: 15, fingerI: band(3.8, 5.5, 7.1), fingerII: band(4.5, 6.9, 9.3), fingerIII: band(5.0, 7.6, 10.1), fingerIV: band(5.0, 7.4, 9.8), fingerV: band(4.3, 6.3, 8.3) },
  { week: 16, fingerI: band(4.5, 6.2, 7.9), fingerII: band(5.6, 8.0, 10.3), fingerIII: band(6.1, 8.7, 11.2), fingerIV: band(6.1, 8.5, 10.8), fingerV: band(5.1, 7.1, 9.1) },
  { week: 17, fingerI: band(5.2, 6.9, 8.6), fingerII: band(6.6, 9.0, 11.3), fingerIII: band(7.3, 9.8, 12.3), fingerIV: band(7.2, 9.6, 11.9), fingerV: band(5.9, 8.0, 10.0) },
  { week: 18, fingerI: band(6.0, 7.7, 9.3), fingerII: band(7.6, 10.0, 12.4), fingerIII: band(8.4, 10.9, 13.4), fingerIV: band(8.3, 10.6, 13.5), fingerV: band(6.8, 8.8, 10.8) },
  { week: 19, fingerI: band(6.7, 8.4, 10.1), fingerII: band(8.6, 11.0, 13.4), fingerIII: band(9.5, 12.0, 14.6), fingerIV: band(9.3, 11.7, 14.1), fingerV: band(7.6, 9.6, 11.6) },
  { week: 20, fingerI: band(7.4, 9.1, 10.8), fingerII: band(9.7, 12.1, 14.4), fingerIII: band(10.6, 13.2, 15.7), fingerIV: band(10.4, 12.8, 15.2), fingerV: band(8.4, 10.5, 12.5) },
  { week: 21, fingerI: band(8.2, 9.8, 11.5), fingerII: band(10.7, 13.1, 15.5), fingerIII: band(11.8, 14.3, 16.8), fingerIV: band(11.5, 13.9, 16.3), fingerV: band(9.3, 11.3, 13.3) },
  { week: 22, fingerI: band(8.9, 10.6, 12.2), fingerII: band(11.7, 14.1, 16.5), fingerIII: band(12.9, 15.4, 17.9), fingerIV: band(12.6, 15.0, 17.4), fingerV: band(10.1, 12.1, 14.1) },
  { week: 23, fingerI: band(9.6, 11.3, 13.0), fingerII: band(12.7, 15.1, 17.5), fingerIII: band(14.0, 16.5, 19.1), fingerIV: band(13.7, 16.1, 18.4), fingerV: band(10.9, 13.0, 15.0) },
  { week: 24, fingerI: band(10.3, 12.0, 13.7), fingerII: band(13.8, 16.2, 18.5), fingerIII: band(15.1, 17.7, 20.2), fingerIV: band(14.8, 17.2, 19.5), fingerV: band(11.8, 13.8, 15.8) },
  { week: 25, fingerI: band(11.1, 12.8, 14.4), fingerII: band(14.8, 17.2, 19.6), fingerIII: band(16.2, 18.8, 21.3), fingerIV: band(15.8, 18.2, 20.6), fingerV: band(12.6, 14.6, 16.6) },
  { week: 26, fingerI: band(11.8, 13.5, 15.2), fingerII: band(15.8, 18.2, 20.6), fingerIII: band(17.4, 19.9, 22.4), fingerIV: band(16.9, 19.3, 21.7), fingerV: band(13.4, 15.5, 17.5) },
  { week: 27, fingerI: band(12.5, 14.2, 15.9), fingerII: band(16.8, 19.2, 21.6), fingerIII: band(18.5, 21.0, 23.6), fingerIV: band(18.0, 20.4, 22.8), fingerV: band(14.3, 16.3, 18.3) },
];

/** Прил. 34 — толщина плаценты (мм), 14–40 нед. */
const PLACENTA_BY_WEEK: Record<number, PercentileBand> = {
  14: band(14.99, 19.0, 23.01),
  15: band(17.16, 20.59, 24.01),
  16: band(17.79, 20.98, 24.18),
  17: band(20.81, 23.98, 27.15),
  18: band(20.12, 23.68, 27.24),
  19: band(19.39, 23.02, 26.65),
  20: band(21.73, 25.12, 28.51),
  21: band(22.59, 25.38, 28.17),
  22: band(24.09, 26.96, 29.83),
  23: band(24.41, 27.92, 31.43),
  24: band(24.61, 27.64, 30.67),
  25: band(25.25, 28.84, 32.43),
  26: band(26.76, 29.74, 32.72),
  27: band(27.71, 32.74, 37.77),
  28: band(29.25, 34.66, 40.07),
  29: band(29.11, 34.12, 39.13),
  30: band(29.87, 35.32, 40.77),
  31: band(30.7, 36.1, 41.5),
  32: band(30.73, 35.32, 39.9),
  33: band(32.25, 36.03, 39.81),
  34: band(30.75, 37.11, 43.46),
  35: band(35.66, 42.26, 48.86),
  36: band(33.74, 40.53, 47.32),
  37: band(35.45, 41.0, 46.55),
  38: band(40.34, 42.93, 45.52),
  39: band(39.1, 43.15, 47.2),
  40: band(39.81, 43.25, 46.69),
};

/** Прил. 35 — ИАЖ (мм), 16–42 нед. */
const AFI_BY_WEEK: Record<number, PercentileBand> = {
  16: band(79, 121, 185),
  17: band(83, 127, 194),
  18: band(87, 133, 202),
  19: band(90, 137, 207),
  20: band(93, 141, 212),
  21: band(95, 143, 214),
  22: band(97, 145, 216),
  23: band(98, 146, 218),
  24: band(98, 147, 219),
  25: band(97, 147, 221),
  26: band(97, 147, 223),
  27: band(95, 156, 226),
  28: band(94, 146, 228),
  29: band(92, 145, 231),
  30: band(90, 145, 234),
  31: band(88, 144, 238),
  32: band(86, 144, 242),
  33: band(83, 143, 245),
  34: band(81, 142, 248),
  35: band(79, 140, 249),
  36: band(77, 138, 249),
  37: band(75, 135, 244),
  38: band(73, 132, 239),
  39: band(72, 127, 226),
  40: band(71, 123, 214),
  41: band(70, 116, 194),
  42: band(69, 110, 175),
};

const FINGER_WEEKS = FINGER_ROWS.map((r) => r.week);
const PLACENTA_WEEKS = Object.keys(PLACENTA_BY_WEEK).map(Number).sort((a, b) => a - b);
const AFI_WEEKS = Object.keys(AFI_BY_WEEK).map(Number).sort((a, b) => a - b);

const FINGER_LABELS: Record<MedvedevFingerId, string> = {
  fingerI: "Палец I",
  fingerII: "Палец II",
  fingerIII: "Палец III",
  fingerIV: "Палец IV",
  fingerV: "Палец V",
};

function lerpBand(a: PercentileBand, b: PercentileBand, t: number): PercentileBand {
  return {
    p5: a.p5 + (b.p5 - a.p5) * t,
    p50: a.p50 + (b.p50 - a.p50) * t,
    p95: a.p95 + (b.p95 - a.p95) * t,
  };
}

function interpolateBandByWeeks(
  table: Record<number, PercentileBand>,
  weeks: number[],
  gaWeeksFraction: number,
): PercentileBand | null {
  if (!Number.isFinite(gaWeeksFraction) || gaWeeksFraction < weeks[0] || gaWeeksFraction > weeks[weeks.length - 1]) {
    return null;
  }
  if (gaWeeksFraction <= weeks[0]) return table[weeks[0]];
  if (gaWeeksFraction >= weeks[weeks.length - 1]) return table[weeks[weeks.length - 1]];
  for (let i = 0; i < weeks.length - 1; i += 1) {
    const w0 = weeks[i];
    const w1 = weeks[i + 1];
    if (gaWeeksFraction >= w0 && gaWeeksFraction <= w1) {
      const t = (gaWeeksFraction - w0) / (w1 - w0);
      return lerpBand(table[w0], table[w1], t);
    }
  }
  return table[weeks[weeks.length - 1]];
}

export function getFingerLengthReferenceBand(
  finger: MedvedevFingerId,
  gaWeeksFraction: number,
): PercentileBand | null {
  if (!Number.isFinite(gaWeeksFraction) || gaWeeksFraction < FINGER_WEEKS[0] || gaWeeksFraction > FINGER_WEEKS[FINGER_WEEKS.length - 1]) {
    return null;
  }
  if (gaWeeksFraction <= FINGER_WEEKS[0]) return FINGER_ROWS[0][finger];
  if (gaWeeksFraction >= FINGER_WEEKS[FINGER_WEEKS.length - 1]) {
    return FINGER_ROWS[FINGER_ROWS.length - 1][finger];
  }
  for (let i = 0; i < FINGER_ROWS.length - 1; i += 1) {
    const w0 = FINGER_ROWS[i].week;
    const w1 = FINGER_ROWS[i + 1].week;
    if (gaWeeksFraction >= w0 && gaWeeksFraction <= w1) {
      const t = (gaWeeksFraction - w0) / (w1 - w0);
      return lerpBand(FINGER_ROWS[i][finger], FINGER_ROWS[i + 1][finger], t);
    }
  }
  return FINGER_ROWS[FINGER_ROWS.length - 1][finger];
}

export function getPlacentaThicknessReferenceBand(gaWeeksFraction: number): PercentileBand | null {
  return interpolateBandByWeeks(PLACENTA_BY_WEEK, PLACENTA_WEEKS, gaWeeksFraction);
}

export function getAfiReferenceBand(gaWeeksFraction: number): PercentileBand | null {
  return interpolateBandByWeeks(AFI_BY_WEEK, AFI_WEEKS, gaWeeksFraction);
}

function formatMm(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

function assessPercentileMarker(
  marker: MedvedevPlacentaAfiMarker,
  label: string,
  unit: string,
  value: number | undefined,
  gaWeeksFraction: number | null | undefined,
  getReference: (ga: number) => PercentileBand | null,
  appendix: string,
  weekRange: string,
): MedvedevPlacentaAfiAssessment | null {
  if (value === undefined) return null;

  if (gaWeeksFraction == null) {
    return {
      marker,
      label,
      value,
      unit,
      reference: null,
      flag: "unknown",
      summary: `${label} ${formatMm(value)} ${unit}: укажите срок беременности.`,
    };
  }

  const reference = getReference(gaWeeksFraction);
  if (!reference) {
    return {
      marker,
      label,
      value,
      unit,
      reference: null,
      flag: "out_of_range",
      summary: `${label}: таблица ${appendix} для ${weekRange} (сейчас ~${gaWeeksFraction.toFixed(1)} нед).`,
    };
  }

  const percentile = percentileFromMedvedevBand(value, reference);
  const flag: MedvedevPlacentaAfiAssessment["flag"] =
    percentile <= 5 ? "low" : percentile >= 95 ? "high" : "normal";
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
    summary: `${label} ${formatMm(value)} ${unit} (~${gaWeeksFraction.toFixed(1)} нед) → ~${percentile}-й перц. (${flagText}; p5 ${formatMm(reference.p5)} · p50 ${formatMm(reference.p50)} · p95 ${formatMm(reference.p95)}).`,
  };
}

export type MedvedevPlacentaAfiInput = {
  gaWeeksByLmp?: number;
  gaDaysByLmp?: number;
  afiMm?: number;
  /** ИАЖ в см (как в формах FMF) — конвертируется в мм для таблицы Moore. */
  afiCm?: number;
  placentaThicknessMm?: number;
  fingerLengthIMm?: number;
  fingerLengthIIMm?: number;
  fingerLengthIIIMm?: number;
  fingerLengthIVMm?: number;
  fingerLengthVMm?: number;
};

function gaWeeksDecimal(weeks?: number, days?: number): number | null {
  if (weeks === undefined) return null;
  return weeks + (days ?? 0) / 7;
}

export function assessMedvedevPlacentaAfi(input: MedvedevPlacentaAfiInput): MedvedevPlacentaAfiAssessment[] {
  const gaWeeks = gaWeeksDecimal(input.gaWeeksByLmp, input.gaDaysByLmp);
  const afiMm = input.afiMm ?? (input.afiCm != null ? input.afiCm * 10 : undefined);

  const rows: MedvedevPlacentaAfiAssessment[] = [];

  const afi = assessPercentileMarker(
    "afi",
    "ИАЖ (амниотический индекс)",
    "мм",
    afiMm,
    gaWeeks,
    getAfiReferenceBand,
    "Прил. 35",
    "16–42 нед",
  );
  if (afi) rows.push(afi);

  const placenta = assessPercentileMarker(
    "placentaThickness",
    "Толщина плаценты",
    "мм",
    input.placentaThicknessMm,
    gaWeeks,
    getPlacentaThicknessReferenceBand,
    "Прил. 34",
    "14–40 нед",
  );
  if (placenta) rows.push(placenta);

  const fingerFields: Array<{ marker: MedvedevFingerId; value?: number }> = [
    { marker: "fingerI", value: input.fingerLengthIMm },
    { marker: "fingerII", value: input.fingerLengthIIMm },
    { marker: "fingerIII", value: input.fingerLengthIIIMm },
    { marker: "fingerIV", value: input.fingerLengthIVMm },
    { marker: "fingerV", value: input.fingerLengthVMm },
  ];

  for (const { marker, value } of fingerFields) {
    const row = assessPercentileMarker(
      marker,
      `Длина пальца · ${FINGER_LABELS[marker]}`,
      "мм",
      value,
      gaWeeks,
      (ga) => getFingerLengthReferenceBand(marker, ga),
      "Прил. 33",
      "14–27 нед",
    );
    if (row) rows.push(row);
  }

  return rows;
}

export const MEDVEDEV_PLACENTA_AFI_OPTIONS: Array<{
  id: MedvedevPlacentaAfiMarker;
  label: string;
  unit: string;
  group: "afi" | "placenta" | "finger";
}> = [
  { id: "afi", label: "ИАЖ", unit: "мм", group: "afi" },
  { id: "placentaThickness", label: "Толщина плаценты", unit: "мм", group: "placenta" },
  { id: "fingerI", label: "Палец I", unit: "мм", group: "finger" },
  { id: "fingerII", label: "Палец II", unit: "мм", group: "finger" },
  { id: "fingerIII", label: "Палец III", unit: "мм", group: "finger" },
  { id: "fingerIV", label: "Палец IV", unit: "мм", group: "finger" },
  { id: "fingerV", label: "Палец V", unit: "мм", group: "finger" },
];

export function listPlacentaAfiAtWeek(week: number): Array<{
  marker: MedvedevPlacentaAfiMarker;
  label: string;
  unit: string;
  reference: PercentileBand;
}> {
  const rows: Array<{ marker: MedvedevPlacentaAfiMarker; label: string; unit: string; reference: PercentileBand }> = [];

  const afiRef = getAfiReferenceBand(week);
  if (afiRef) rows.push({ marker: "afi", label: "ИАЖ", unit: "мм", reference: afiRef });

  const placentaRef = getPlacentaThicknessReferenceBand(week);
  if (placentaRef) {
    rows.push({ marker: "placentaThickness", label: "Толщина плаценты", unit: "мм", reference: placentaRef });
  }

  for (const opt of MEDVEDEV_PLACENTA_AFI_OPTIONS.filter((o) => o.group === "finger")) {
    const ref = getFingerLengthReferenceBand(opt.id as MedvedevFingerId, week);
    if (ref) rows.push({ marker: opt.id, label: opt.label, unit: opt.unit, reference: ref });
  }

  return rows;
}

export function formatMedvedevPlacentaAfiForProtocol(item: MedvedevPlacentaAfiAssessment): string {
  if (item.value !== undefined && item.percentile !== undefined) {
    return `- ${item.label}: ${formatMm(item.value)} ${item.unit} (~${item.percentile}-й перц.)`;
  }
  if (item.reference) {
    const ref = item.reference;
    return `- ${item.label}: p5 ${formatMm(ref.p5)} · p50 ${formatMm(ref.p50)} · p95 ${formatMm(ref.p95)} ${item.unit}`;
  }
  return `- ${item.summary}`;
}
