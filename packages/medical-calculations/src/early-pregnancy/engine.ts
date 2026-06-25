import { referenceTableFor, PARAMETER_LABELS_RU } from "./tables";
import {
  expandPercentileBand,
  flagFromPercentile,
  formatBandFull,
  formatMm,
  percentileFromBand,
} from "./percentiles";
import type {
  EarlyBiometryAssessment,
  EarlyBiometryFlag,
  EarlyBiometryParameter,
  EarlyPregnancyGrowthInput,
  GaReferenceRow,
  PercentileBand,
} from "./types";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpBand(a: PercentileBand, b: PercentileBand, t: number): PercentileBand {
  return { p5: lerp(a.p5, b.p5, t), p50: lerp(a.p50, b.p50, t), p95: lerp(a.p95, b.p95, t) };
}

function formatGaLabel(gaDays: number): string {
  const weeks = Math.floor(gaDays / 7);
  const days = gaDays % 7;
  return `${weeks}+${days}`;
}

/** Интерполяция p5/p50/p95 между опорными строками таблицы. */
export function getEarlyReferenceBand(
  parameter: EarlyBiometryParameter,
  gaDays: number,
): { gaLabel: string; band: PercentileBand } | null {
  const rows = referenceTableFor(parameter);
  if (!Number.isFinite(gaDays) || gaDays < rows[0]!.gaDays || gaDays > rows[rows.length - 1]!.gaDays) {
    return null;
  }

  for (const row of rows) {
    if (row.gaDays === gaDays) {
      return { gaLabel: row.gaLabel, band: row.band };
    }
  }

  for (let i = 0; i < rows.length - 1; i += 1) {
    const left = rows[i]!;
    const right = rows[i + 1]!;
    if (gaDays >= left.gaDays && gaDays <= right.gaDays) {
      const t = (gaDays - left.gaDays) / (right.gaDays - left.gaDays);
      return {
        gaLabel: formatGaLabel(gaDays),
        band: lerpBand(left.band, right.band, t),
      };
    }
  }

  return null;
}

function ysdClinicalFlag(valueMm: number): EarlyBiometryFlag | null {
  if (valueMm < 2) return "critical_low";
  if (valueMm >= 6) return "critical_high";
  return null;
}

function assessParameter(
  parameter: EarlyBiometryParameter,
  valueMm: number | undefined,
  gaDays: number | undefined,
): EarlyBiometryAssessment {
  const label = PARAMETER_LABELS_RU[parameter];

  if (valueMm === undefined || !Number.isFinite(valueMm)) {
    return {
      parameter,
      label,
      valueMm: NaN,
      gaDays: gaDays ?? NaN,
      gaLabel: gaDays != null ? formatGaLabel(gaDays) : "—",
      reference: null,
      flag: "unknown",
      summary: `${label}: введите измерение (мм).`,
    };
  }

  if (gaDays == null || !Number.isFinite(gaDays)) {
    return {
      parameter,
      label,
      valueMm,
      gaDays: NaN,
      gaLabel: "—",
      reference: null,
      flag: "unknown",
      summary: `${label} ${formatMm(valueMm)} мм: укажите срок (ДПМ или КТР).`,
    };
  }

  const ref = getEarlyReferenceBand(parameter, gaDays);
  if (!ref) {
    const rows = referenceTableFor(parameter);
    return {
      parameter,
      label,
      valueMm,
      gaDays,
      gaLabel: formatGaLabel(gaDays),
      reference: null,
      flag: "out_of_range",
      summary: `${label}: таблица для срока ${formatGaLabel(gaDays)} (${rows[0]!.gaLabel}–${rows[rows.length - 1]!.gaLabel}).`,
    };
  }

  const reference = expandPercentileBand(ref.band);
  const percentile = percentileFromBand(valueMm, ref.band);
  let flag: EarlyBiometryFlag = flagFromPercentile(percentile);

  if (parameter === "ysd") {
    const clinical = ysdClinicalFlag(valueMm);
    if (clinical) flag = clinical;
  }

  const flagText =
    flag === "critical_low"
      ? "⚠️ <2 мм — подозрительный признак"
      : flag === "critical_high"
        ? "⚠️ ≥6 мм — высокий риск неразвивающейся беременности"
        : flag === "high"
          ? "выше 95-го перцентиля"
          : flag === "low"
            ? "ниже 5-го перцентиля"
            : "в пределах референса";

  return {
    parameter,
    label,
    valueMm,
    gaDays,
    gaLabel: ref.gaLabel,
    reference,
    percentile,
    flag,
    summary: `${label} ${formatMm(valueMm)} мм при ${ref.gaLabel} → ~${percentile}-й перц. (${flagText}; ${formatBandFull(reference)}).`,
  };
}

/** Оценка MSD, YSD и CRL малого срока по референсным кривым. */
export function assessEarlyPregnancyGrowth(input: EarlyPregnancyGrowthInput): EarlyBiometryAssessment[] {
  const gaDays = input.gaDays;
  const out: EarlyBiometryAssessment[] = [];

  if (input.msdMm != null) out.push(assessParameter("msd", input.msdMm, gaDays));
  if (input.ysdMm != null) out.push(assessParameter("ysd", input.ysdMm, gaDays));
  if (input.crlMm != null) out.push(assessParameter("crl", input.crlMm, gaDays));

  return out;
}

/** Точки кривой для графика (p5/p50/p95 по всей таблице). */
export function growthCurveSeries(parameter: EarlyBiometryParameter): GaReferenceRow[] {
  return referenceTableFor(parameter);
}
