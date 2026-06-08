/**
 * I скрининг: нормы по КТР 45–84 мм (p5 / p50 / p95).
 * Источник: Медведев М.В. Пренатальная эхография, 2016, Прил. 11 (Алтынник, Медведев, 2012).
 */

export const MEDVEDEV_FIRST_TRIMESTER_SOURCE =
  "Медведев М.В. Пренатальная эхография, 2016. Прил. 11 (Алтынник, Медведев, 2012).";

export const MEDVEDEV_CRL_MIN_MM = 45;
export const MEDVEDEV_CRL_MAX_MM = 84;

export type MedvedevFirstMarker = "nt" | "nasalBone" | "ivVentricle";

export type PercentileBand = {
  p5: number;
  p50: number;
  p95: number;
};

export type MedvedevMarkerAssessment = {
  marker: MedvedevFirstMarker;
  label: string;
  valueMm?: number;
  reference: PercentileBand | null;
  percentile?: number;
  flag: "low" | "normal" | "high" | "unknown" | "out_of_range";
  summary: string;
};

type CrlRow = {
  crlMin: number;
  crlMax: number;
  nt: PercentileBand;
  nasalBone: PercentileBand;
  ivVentricle: PercentileBand;
};

/** Таблица Прил. 11 — диапазоны КТР и перцентильные полосы (мм). */
const CRL_ROWS: CrlRow[] = [
  {
    crlMin: 45,
    crlMax: 50,
    nt: { p5: 0.74, p50: 1.52, p95: 2.3 },
    nasalBone: { p5: 1.35, p50: 1.75, p95: 2.15 },
    ivVentricle: { p5: 1.29, p50: 1.62, p95: 1.95 },
  },
  {
    crlMin: 51,
    crlMax: 55,
    nt: { p5: 0.76, p50: 1.54, p95: 2.32 },
    nasalBone: { p5: 1.4, p50: 1.86, p95: 2.32 },
    ivVentricle: { p5: 1.37, p50: 1.72, p95: 2.07 },
  },
  {
    crlMin: 56,
    crlMax: 60,
    nt: { p5: 0.78, p50: 1.56, p95: 2.34 },
    nasalBone: { p5: 1.49, p50: 1.95, p95: 2.41 },
    ivVentricle: { p5: 1.46, p50: 1.86, p95: 2.26 },
  },
  {
    crlMin: 61,
    crlMax: 65,
    nt: { p5: 0.81, p50: 1.59, p95: 2.37 },
    nasalBone: { p5: 1.58, p50: 2.05, p95: 2.52 },
    ivVentricle: { p5: 1.54, p50: 1.96, p95: 2.38 },
  },
  {
    crlMin: 66,
    crlMax: 70,
    nt: { p5: 0.83, p50: 1.61, p95: 2.39 },
    nasalBone: { p5: 1.69, p50: 2.18, p95: 2.67 },
    ivVentricle: { p5: 1.62, p50: 2.07, p95: 2.52 },
  },
  {
    crlMin: 71,
    crlMax: 75,
    nt: { p5: 0.85, p50: 1.63, p95: 2.41 },
    nasalBone: { p5: 1.88, p50: 2.39, p95: 2.9 },
    ivVentricle: { p5: 1.7, p50: 2.17, p95: 2.64 },
  },
  {
    crlMin: 76,
    crlMax: 80,
    nt: { p5: 0.87, p50: 1.65, p95: 2.43 },
    nasalBone: { p5: 2.21, p50: 2.73, p95: 3.25 },
    ivVentricle: { p5: 1.78, p50: 2.26, p95: 2.74 },
  },
  {
    crlMin: 81,
    crlMax: 84,
    nt: { p5: 0.89, p50: 1.67, p95: 2.45 },
    nasalBone: { p5: 2.5, p50: 3.02, p95: 3.54 },
    ivVentricle: { p5: 1.86, p50: 2.34, p95: 2.82 },
  },
];

const MARKER_LABELS: Record<MedvedevFirstMarker, string> = {
  nt: "ТВП (NT)",
  nasalBone: "Длина носовой кости (ДНК)",
  ivVentricle: "IV желудочек (ПЗР)",
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpBand(a: PercentileBand, b: PercentileBand, t: number): PercentileBand {
  return {
    p5: lerp(a.p5, b.p5, t),
    p50: lerp(a.p50, b.p50, t),
    p95: lerp(a.p95, b.p95, t),
  };
}

function rowMid(row: CrlRow): number {
  return (row.crlMin + row.crlMax) / 2;
}

function pickBand(row: CrlRow, marker: MedvedevFirstMarker): PercentileBand {
  if (marker === "nt") return row.nt;
  if (marker === "nasalBone") return row.nasalBone;
  return row.ivVentricle;
}

/** Референс p5/p50/p95 для КТР 45–84 мм с интерполяцией между диапазонами таблицы. */
export function getMedvedevReferenceBand(
  crlMm: number,
  marker: MedvedevFirstMarker,
): PercentileBand | null {
  if (!Number.isFinite(crlMm) || crlMm < MEDVEDEV_CRL_MIN_MM || crlMm > MEDVEDEV_CRL_MAX_MM) {
    return null;
  }

  for (const row of CRL_ROWS) {
    if (crlMm >= row.crlMin && crlMm <= row.crlMax) {
      return pickBand(row, marker);
    }
  }

  for (let i = 0; i < CRL_ROWS.length - 1; i += 1) {
    const left = CRL_ROWS[i];
    const right = CRL_ROWS[i + 1];
    if (crlMm > left.crlMax && crlMm < right.crlMin) {
      const t = (crlMm - left.crlMax) / (right.crlMin - left.crlMax);
      return lerpBand(pickBand(left, marker), pickBand(right, marker), t);
    }
  }

  const mids = CRL_ROWS.map((row) => ({ mid: rowMid(row), row }));
  if (crlMm <= mids[0].mid) return pickBand(mids[0].row, marker);
  if (crlMm >= mids[mids.length - 1].mid) return pickBand(mids[mids.length - 1].row, marker);

  for (let i = 0; i < mids.length - 1; i += 1) {
    if (crlMm >= mids[i].mid && crlMm <= mids[i + 1].mid) {
      const t = (crlMm - mids[i].mid) / (mids[i + 1].mid - mids[i].mid);
      return lerpBand(pickBand(mids[i].row, marker), pickBand(mids[i + 1].row, marker), t);
    }
  }

  return pickBand(CRL_ROWS[CRL_ROWS.length - 1], marker);
}

export function percentileFromMedvedevBand(valueMm: number, band: PercentileBand): number {
  if (valueMm <= band.p5) return 5;
  if (valueMm >= band.p95) return 95;
  if (valueMm <= band.p50) {
    return Math.round(5 + ((valueMm - band.p5) / (band.p50 - band.p5)) * 45);
  }
  return Math.round(50 + ((valueMm - band.p50) / (band.p95 - band.p50)) * 45);
}

function flagFromPercentile(percentile: number): "low" | "normal" | "high" {
  if (percentile <= 5) return "low";
  if (percentile >= 95) return "high";
  return "normal";
}

function formatMm(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function formatBandRef(band: PercentileBand): string {
  return `p5 ${formatMm(band.p5)} · p50 ${formatMm(band.p50)} · p95 ${formatMm(band.p95)} мм`;
}

function assessValueMarker(
  marker: MedvedevFirstMarker,
  valueMm: number | undefined,
  crlMm: number | undefined,
): MedvedevMarkerAssessment {
  const label = MARKER_LABELS[marker];

  if (!crlMm) {
    return {
      marker,
      label,
      valueMm,
      reference: null,
      flag: "unknown",
      summary: `${label}: укажите КТР для расчёта по таблице Медведева.`,
    };
  }

  const reference = getMedvedevReferenceBand(crlMm, marker);
  if (!reference) {
    return {
      marker,
      label,
      valueMm,
      reference: null,
      flag: "out_of_range",
      summary: `${label}: таблица Прил. 11 для КТР ${MEDVEDEV_CRL_MIN_MM}–${MEDVEDEV_CRL_MAX_MM} мм (сейчас ${formatMm(crlMm)} мм).`,
    };
  }

  if (valueMm === undefined) {
    return {
      marker,
      label,
      reference,
      flag: "unknown",
      summary: `${label}: норма при КТР ${formatMm(crlMm)} мм — ${formatBandRef(reference)}.`,
    };
  }

  const percentile = percentileFromMedvedevBand(valueMm, reference);
  const flag = flagFromPercentile(percentile);
  const flagText =
    flag === "high" ? "выше 95-го перцентиля" : flag === "low" ? "ниже 5-го перцентиля" : "в пределах нормы";

  return {
    marker,
    label,
    valueMm,
    reference,
    percentile,
    flag,
    summary: `${label} ${formatMm(valueMm)} мм → ~${percentile}-й перц. (${flagText}; ref ${formatBandRef(reference)}).`,
  };
}

export type FirstTrimesterMedvedevInput = {
  crlMm?: number;
  ntMm?: number;
  nasalBoneLengthMm?: number;
  ivVentricleMm?: number;
  nasalBone?: "seen" | "not_seen" | "uncertain";
};

/** Оценка маркеров I скрининга по Прил. 11. */
export function assessFirstTrimesterMedvedev(input: FirstTrimesterMedvedevInput): MedvedevMarkerAssessment[] {
  const { crlMm, ntMm, nasalBoneLengthMm, ivVentricleMm, nasalBone } = input;

  const nt = assessValueMarker("nt", ntMm, crlMm);
  const nb = assessValueMarker("nasalBone", nasalBoneLengthMm, crlMm);
  const iv = assessValueMarker("ivVentricle", ivVentricleMm, crlMm);

  if (nasalBone === "not_seen" && nb.reference) {
    nb.flag = "high";
    nb.summary = `Носовая кость не визуализируется (маркер риска). Ожидаемая ДНК при КТР ${formatMm(crlMm ?? 0)} мм: ${formatBandRef(nb.reference)}.`;
  } else if (nasalBone === "seen" && nasalBoneLengthMm === undefined && nb.reference) {
    nb.summary = `Носовая кость визуализируется. Для перцентиля введите длину (мм). Норма: ${formatBandRef(nb.reference)}.`;
  }

  return [nt, nb, iv];
}

export function formatMedvedevMarkerForProtocol(item: MedvedevMarkerAssessment): string {
  if (item.valueMm !== undefined && item.percentile !== undefined) {
    return `- ${item.label}: ${formatMm(item.valueMm)} мм (~${item.percentile}-й перц., Медведев Прил. 11)`;
  }
  if (item.reference && item.marker === "nasalBone") {
    return `- ${item.label}: ${item.summary.replace(/^Длина носовой кости \(ДНК\): /, "")}`;
  }
  return `- ${item.summary}`;
}
