import { getNomogramById } from "./dataset";
import type {
  EvaluateNomogramInput,
  EvaluateNomogramResult,
  Nomogram,
  NomogramPercentileZone,
  NomogramRow,
  NomogramSpecialZone,
} from "./types";

export function gaStringToTotalDays(ga: string): number {
  const [w, d] = ga.split("+").map(Number);
  return w * 7 + d;
}

function interpField(r1: NomogramRow, r2: NomogramRow, t: number, field: "p5" | "p50" | "p95"): number {
  const a = r1[field]!;
  const b = r2[field]!;
  return a + (b - a) * t;
}

function percentileLabels(nomogram: Nomogram): { low: string; mid: string; high: string } {
  const p = nomogram.percentiles;
  if (p?.length === 3 && p[0] === 2.5) {
    return { low: "p2,5", mid: "p50", high: "p97,5" };
  }
  if (p?.length === 3) {
    return { low: `p${p[0]}`, mid: `p${p[1]}`, high: `p${p[2]}` };
  }
  return { low: "p5", mid: "p50", high: "p95" };
}

function zoneFromPercentiles(value: number, p5?: number, p50?: number, p95?: number): NomogramPercentileZone {
  if (p5 == null || p50 == null || p95 == null) return "P50_P95";
  if (value < p5) return "BELOW_P5";
  if (value < p50) return "P5_P50";
  if (value > p95) return "ABOVE_P95";
  return "P50_P95";
}

const ZONE_SUMMARY: Record<NomogramPercentileZone, string> = {
  BELOW_P5: "Ниже нижней границы номограммы (≤5-й перцентиль или эквивалент)",
  P5_P50: "Между нижней границей и медианой",
  P50_P95: "Между медианой и верхней границей",
  ABOVE_P95: "Выше верхней границы номограммы (≥95-й перцентиль или эквивалент)",
};

function evaluateDvPi(
  row: NomogramRow,
  value: number,
): { flag: NomogramSpecialZone | "unknown"; summary: string } {
  const { min, mean_low, mean_high, max } = row;
  if (min == null || mean_low == null || mean_high == null || max == null) {
    return { flag: "unknown", summary: "Недостаточно референса в строке номограммы" };
  }
  if (value < min) return { flag: "BELOW_MIN", summary: "Ниже минимума референсного диапазона венозного протока" };
  if (value < mean_low) return { flag: "LOW_MEAN", summary: "Ниже среднего референса (mean low)" };
  if (value <= mean_high) return { flag: "WITHIN_MEAN", summary: "В пределах среднего референса" };
  if (value <= max) return { flag: "HIGH_MEAN", summary: "Выше среднего референса (mean high)" };
  return { flag: "ABOVE_MAX", summary: "Выше максимума референсного диапазона" };
}

function evaluateMcaPsv(
  row: NomogramRow,
  value: number,
): { flag: NomogramSpecialZone | "unknown"; summary: string } {
  const { median, mom_1_5 } = row;
  if (mom_1_5 == null) {
    return { flag: "unknown", summary: "Порог MoM не задан в номограмме" };
  }
  if (value >= mom_1_5) {
    return {
      flag: "AT_OR_ABOVE_MOM_THRESHOLD",
      summary: "ПССК в СМА ≥ порога 1,5 MoM — рассмотрите анемию плода по протоколу",
    };
  }
  return {
    flag: "BELOW_MOM_THRESHOLD",
    summary: `Ниже порога 1,5 MoM${median != null ? ` (медиана ${median} см/с)` : ""}`,
  };
}

function locateRowsByGaWeeks(nomogram: Nomogram, gaWeeksDecimal: number) {
  const rows = [...nomogram.rows].sort((a, b) => (a.ga_weeks ?? 0) - (b.ga_weeks ?? 0));
  const minW = rows[0]?.ga_weeks;
  const maxW = rows[rows.length - 1]?.ga_weeks;
  const i = rows.findIndex((r) => (r.ga_weeks ?? 0) >= gaWeeksDecimal);
  let row: NomogramRow;
  let r2: NomogramRow | undefined;
  let t = 0;
  if (i <= 0) {
    row = rows[0]!;
    r2 = rows[1];
    t = 0;
  } else {
    row = rows[i - 1]!;
    r2 = rows[i];
    t = (gaWeeksDecimal - row.ga_weeks!) / ((r2.ga_weeks ?? row.ga_weeks!) - row.ga_weeks!);
  }
  const warning =
    minW != null && maxW != null && (gaWeeksDecimal < minW || gaWeeksDecimal > maxW) ? ("OUT_OF_RANGE" as const) : undefined;
  return { row, r2, t, warning, minW, maxW };
}

function locateRowsByGaDays(nomogram: Nomogram, gaWeeksDecimal: number) {
  const targetDays = gaWeeksDecimal * 7;
  const rows = [...nomogram.rows].sort((a, b) => gaStringToTotalDays(a.ga!) - gaStringToTotalDays(b.ga!));
  const minD = gaStringToTotalDays(rows[0]!.ga!);
  const maxD = gaStringToTotalDays(rows[rows.length - 1]!.ga!);
  const i = rows.findIndex((r) => gaStringToTotalDays(r.ga!) >= targetDays);
  let row: NomogramRow;
  let r2: NomogramRow | undefined;
  let t = 0;
  if (i <= 0) {
    row = rows[0]!;
    r2 = rows[1];
  } else {
    row = rows[i - 1]!;
    r2 = rows[i];
    t = (targetDays - gaStringToTotalDays(row.ga!)) / (gaStringToTotalDays(r2.ga!) - gaStringToTotalDays(row.ga!));
  }
  const warning =
    targetDays < minD || targetDays > maxD ? ("OUT_OF_RANGE" as const) : undefined;
  return { row, r2, t, warning };
}

export function evaluateNomogram(input: EvaluateNomogramInput): EvaluateNomogramResult {
  const nomogram = getNomogramById(input.nomogramId);
  if (!nomogram) {
    return {
      ok: false,
      nomogramId: input.nomogramId,
      key: "",
      title: "Неизвестная номограмма",
      unit: "",
      value: input.value,
      flag: "unknown",
      summary: `Номограмма «${input.nomogramId}» не найдена`,
    };
  }

  const labels = percentileLabels(nomogram);
  let row: NomogramRow | undefined;
  let r2: NomogramRow | undefined;
  let t = 0;
  let warning: "OUT_OF_RANGE" | undefined;
  const gaUsed: EvaluateNomogramResult["gaUsed"] = {};

  if (nomogram.x_axis.type === "crl_range_mm") {
    const crl = input.crlMm;
    if (crl == null || !Number.isFinite(crl)) {
      return {
        ok: false,
        nomogramId: nomogram.id,
        key: nomogram.key,
        title: nomogram.title,
        unit: nomogram.unit,
        source: nomogram.source,
        value: input.value,
        flag: "unknown",
        summary: "Укажите КТР, мм, для выбора строки номограммы",
      };
    }
    row = nomogram.rows.find((r) => crl >= (r.crl_min ?? -Infinity) && crl <= (r.crl_max ?? Infinity));
    gaUsed.crlMm = crl;
    if (!row) {
      return {
        ok: false,
        nomogramId: nomogram.id,
        key: nomogram.key,
        title: nomogram.title,
        unit: nomogram.unit,
        source: nomogram.source,
        value: input.value,
        flag: "out_of_range",
        summary: `КТР ${crl} мм вне диапазона номограммы`,
        gaUsed,
      };
    }
  } else {
    const ga = input.gaWeeksDecimal;
    if (ga == null || !Number.isFinite(ga)) {
      return {
        ok: false,
        nomogramId: nomogram.id,
        key: nomogram.key,
        title: nomogram.title,
        unit: nomogram.unit,
        source: nomogram.source,
        value: input.value,
        flag: "unknown",
        summary: "Укажите срок беременности",
      };
    }
    gaUsed.weeksDecimal = ga;
    if (nomogram.x_axis.type === "ga_weeks") {
      const located = locateRowsByGaWeeks(nomogram, ga);
      row = located.row;
      r2 = located.r2;
      t = located.t;
      warning = located.warning;
    } else {
      const located = locateRowsByGaDays(nomogram, ga);
      row = located.row;
      r2 = located.r2;
      t = located.t;
      warning = located.warning;
      gaUsed.gaDaysString = row.ga;
    }
  }

  if (nomogram.id === "dv_pi" || nomogram.fields?.includes("min")) {
    const { flag, summary } = evaluateDvPi(row!, input.value);
    return {
      ok: flag !== "unknown",
      nomogramId: nomogram.id,
      key: nomogram.key,
      title: nomogram.title,
      unit: nomogram.unit,
      source: nomogram.source,
      value: input.value,
      flag,
      summary,
      interpolated: {
        min: row!.min,
        mean_low: row!.mean_low,
        mean_high: row!.mean_high,
        max: row!.max,
      },
      gaUsed,
      warning,
    };
  }

  if (nomogram.id === "mca_psv_16_39" || nomogram.fields?.includes("mom_1_5")) {
    const { flag, summary } = evaluateMcaPsv(row!, input.value);
    return {
      ok: true,
      nomogramId: nomogram.id,
      key: nomogram.key,
      title: nomogram.title,
      unit: nomogram.unit,
      source: nomogram.source,
      value: input.value,
      flag,
      summary,
      interpolated: { median: row!.median, mom_1_5: row!.mom_1_5 },
      gaUsed,
      warning,
    };
  }

  const interpFieldVal = (f: "p5" | "p50" | "p95") => {
    const v1 = row![f];
    if (r2 && t > 0 && t < 1 && r2[f] != null && v1 != null) return +interpField(row!, r2, t, f).toFixed(2);
    return v1;
  };

  const p5 = interpFieldVal("p5");
  const p50 = interpFieldVal("p50");
  const p95 = interpFieldVal("p95");
  const zone = zoneFromPercentiles(input.value, p5, p50, p95);

  return {
    ok: true,
    nomogramId: nomogram.id,
    key: nomogram.key,
    title: nomogram.title,
    unit: nomogram.unit,
    source: nomogram.source,
    value: input.value,
    flag: zone,
    summary: ZONE_SUMMARY[zone],
    percentileLabels: labels,
    interpolated: { p5, p50, p95 },
    gaUsed,
    warning,
  };
}
