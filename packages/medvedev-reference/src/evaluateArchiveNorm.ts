/**
 * Runtime для archive-tables: срок / ось → перцентиль или обратный dating.
 * Без JPEG/PDF — только JSON SSOT.
 */

import { ARCHIVE_CATALOG, findArchiveCardByTableId } from "./archiveTables";
import { ARCHIVE_TABLES_BY_ID } from "./archiveTableRegistry.generated";
import type { ArchiveParameter, ArchiveTableDocument, GaPoint, MeanRangeTriplet, PercentileTriplet } from "./archiveTableTypes";
import { gaWeeksDecimal } from "./medvedevBiometry";
import { percentileFromMedvedevBand, type PercentileBand } from "./medvedevFirstTrimester";

export { gaWeeksDecimal } from "./medvedevBiometry";

export const ARCHIVE_CALCULATOR_DISCLAIMER =
  "Справочный расчёт по табличным нормам. Не заменяет клиническое суждение и протокол УЗИ.";

export type ArchiveCalculatorCard = {
  tableId: string;
  titleRu: string;
  clinicalBlock: string;
  tableType: string;
  extractionStatus: string;
  verified: boolean;
  source?: string;
  partial?: boolean;
  /** Одна JPEG-карточка → несколько JSON (выбор подтаблицы в UI) */
  multiTable?: string[];
};

export type EvaluateArchiveNormInput = {
  tableId: string;
  /** При catalog.tableId вида «1.3+1.4» — id одной из multiTable */
  subTableId?: string;
  parameterId?: string;
  gaWeeks?: number;
  gaDays?: number;
  value?: number;
  crlMm?: number;
  /** X-axis for percentile_by_measurement (e.g. MSD mm) */
  axisValue?: number;
};

export type EvaluateArchiveNormResult = {
  ok: boolean;
  tableId: string;
  titleRu: string;
  source?: string;
  tableType: string;
  parameterLabel?: string;
  unit?: string;
  flag: "low" | "normal" | "high" | "unknown" | "out_of_range" | "unsupported";
  percentile?: number;
  reference?: PercentileBand & { lowLabel?: string; highLabel?: string };
  summary: string;
  gaUsed?: GaPoint;
  partial?: boolean;
  verified?: boolean;
};

const MULTI_PARAM_LABELS: Record<string, ArchiveParameter> = {
  fl: { id: "fl", labelRu: "Длина бедренной кости (ДБ)", unit: "mm" },
  tl: { id: "tl", labelRu: "Длина большеберцовой кости (ДКГ)", unit: "mm" },
  hl: { id: "hl", labelRu: "Длина плечевой кости (ДПК)", unit: "mm" },
  ul: { id: "ul", labelRu: "Длина локтевой кости (ДКП)", unit: "mm" },
  yolkSac: { id: "yolkSac", labelRu: "Желточный мешок (СВДЖМ)", unit: "mm" },
  gestationalSac: { id: "gestationalSac", labelRu: "СДПЯ", unit: "mm" },
  embryonicHeartRate: { id: "embryonicHeartRate", labelRu: "ЧСС эмбриона", unit: "bpm" },
  herniaLength: { id: "herniaLength", labelRu: "Длина пупочной грыжи", unit: "mm" },
  cordDiameter: { id: "cordDiameter", labelRu: "Диаметр пуповины", unit: "mm" },
};

function isPercentileTriplet(v: unknown): v is PercentileTriplet {
  if (!v || typeof v !== "object") return false;
  const o = v as PercentileTriplet;
  return typeof o.p50 === "number" || typeof o.p5 === "number" || typeof o.p10 === "number";
}

function isMeanRange(v: unknown): v is MeanRangeTriplet {
  if (!v || typeof v !== "object") return false;
  const o = v as MeanRangeTriplet;
  return typeof o.mean === "number" && typeof o.rangeMin === "number" && typeof o.rangeMax === "number";
}

function gaFromRow(row: Record<string, unknown>): number | null {
  const ga = row.ga as GaPoint | undefined;
  if (!ga || typeof ga.weeks !== "number") return null;
  return gaWeeksDecimal(ga.weeks, ga.days ?? 0);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpBand(left: PercentileBand, right: PercentileBand, t: number): PercentileBand {
  return {
    p5: lerp(left.p5, right.p5, t),
    p50: lerp(left.p50, right.p50, t),
    p95: lerp(left.p95, right.p95, t),
  };
}

function tripletToBand(t: PercentileTriplet, labels?: ArchiveTableDocument["percentileLabels"]): PercentileBand & {
  lowLabel?: string;
  highLabel?: string;
} {
  const low = t.p5 ?? t.p2_5 ?? t.p10 ?? t.p50;
  const mid = t.p50 ?? low;
  const high = t.p95 ?? t.p97_5 ?? t.p90 ?? mid;
  return {
    p5: low,
    p50: mid,
    p95: high,
    lowLabel: labels?.low ?? (t.p2_5 != null ? "p2.5" : t.p10 != null ? "p10" : "p5"),
    highLabel: labels?.high ?? (t.p97_5 != null ? "p97.5" : t.p90 != null ? "p90" : "p95"),
  };
}

function interpolateGaRows(
  rows: Record<string, unknown>[],
  gaDecimal: number,
  pick: (row: Record<string, unknown>) => PercentileTriplet | MeanRangeTriplet | null,
): PercentileTriplet | MeanRangeTriplet | null {
  const sorted = [...rows]
    .map((row) => ({ row, ga: gaFromRow(row) }))
    .filter((x): x is { row: Record<string, unknown>; ga: number } => x.ga != null)
    .sort((a, b) => a.ga - b.ga);

  if (sorted.length === 0) return null;
  const min = sorted[0].ga;
  const max = sorted[sorted.length - 1].ga;
  if (gaDecimal <= min) return pick(sorted[0].row);
  if (gaDecimal >= max) return pick(sorted[sorted.length - 1].row);

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const left = sorted[i];
    const right = sorted[i + 1];
    if (gaDecimal >= left.ga && gaDecimal <= right.ga) {
      if (Math.abs(gaDecimal - left.ga) < 0.001) return pick(left.row);
      if (Math.abs(gaDecimal - right.ga) < 0.001) return pick(right.row);
      const t = (gaDecimal - left.ga) / (right.ga - left.ga);
      const leftPick = pick(left.row);
      const rightPick = pick(right.row);
      if (!leftPick || !rightPick) return leftPick ?? rightPick;
      if (isMeanRange(leftPick) && isMeanRange(rightPick)) {
        return {
          mean: lerp(leftPick.mean, rightPick.mean, t),
          rangeMin: lerp(leftPick.rangeMin, rightPick.rangeMin, t),
          rangeMax: lerp(leftPick.rangeMax, rightPick.rangeMax, t),
        };
      }
      if (isPercentileTriplet(leftPick) && isPercentileTriplet(rightPick)) {
        const lb = tripletToBand(leftPick);
        const rb = tripletToBand(rightPick);
        const band = lerpBand(lb, rb, t);
        return { p5: band.p5, p50: band.p50, p95: band.p95 };
      }
      return leftPick;
    }
  }
  return pick(sorted[sorted.length - 1].row);
}

function pickParamFromRow(row: Record<string, unknown>, parameterId: string): PercentileTriplet | MeanRangeTriplet | null {
  const direct = row[parameterId];
  if (isPercentileTriplet(direct) || isMeanRange(direct)) return direct;
  if (typeof row.p50 === "number" || typeof row.p5 === "number") {
    return row as PercentileTriplet;
  }
  return null;
}

function flagFromPercentile(percentile: number): "low" | "normal" | "high" {
  if (percentile <= 5) return "low";
  if (percentile >= 95) return "high";
  return "normal";
}

function formatGa(ga: GaPoint): string {
  const d = ga.days ?? 0;
  return d > 0 ? `${ga.weeks}+${d}` : `${ga.weeks}`;
}

export function resolveArchiveTableId(tableId: string, subTableId?: string): string {
  const card = findArchiveCardByTableId(tableId);
  const multi = card && "multiTable" in card && Array.isArray(card.multiTable) ? card.multiTable : undefined;
  if (multi?.length) {
    if (subTableId && multi.includes(subTableId)) return subTableId;
    return multi[0];
  }
  return tableId;
}

export function getArchiveTableDocument(tableId: string, subTableId?: string): ArchiveTableDocument | null {
  const resolved = resolveArchiveTableId(tableId, subTableId);
  return ARCHIVE_TABLES_BY_ID[resolved] ?? null;
}

/** Catalog entries safe for UI — no filenames or image paths. */
export function listArchiveCalculatorCards(): ArchiveCalculatorCard[] {
  return ARCHIVE_CATALOG.cards.map((c) => {
    const doc = c.dataFile ? getArchiveTableDocument(c.tableId) : null;
    const multi =
      "multiTable" in c && Array.isArray(c.multiTable) ? (c.multiTable as string[]) : undefined;
    return {
      tableId: c.tableId,
      titleRu: c.titleRu,
      clinicalBlock: c.clinicalBlock,
      tableType: c.tableType,
      extractionStatus: c.extractionStatus,
      verified: c.verified === true,
      source: doc?.source,
      partial: doc?.partial === true || c.extractionStatus === "partial",
      multiTable: multi,
    };
  });
}

export function listArchiveTableParameters(tableId: string, subTableId?: string): ArchiveParameter[] {
  const doc = getArchiveTableDocument(tableId, subTableId);
  if (!doc?.rows?.length) return [];
  if (doc.parameter) return [doc.parameter];
  if (doc.parameters?.length) return doc.parameters;

  const row = doc.rows[0] as Record<string, unknown>;
  const skip = new Set(["ga", "crlMm", "msdMm", "bpdMm", "crlMmFrom", "crlMmTo"]);
  const ids = Object.keys(row).filter((k) => !skip.has(k) && (isPercentileTriplet(row[k]) || isMeanRange(row[k])));

  return ids.map((id) => MULTI_PARAM_LABELS[id] ?? { id, labelRu: id, unit: doc.parameter?.unit ?? "mm" });
}

function fail(table: ArchiveTableDocument, summary: string, flag: EvaluateArchiveNormResult["flag"] = "unknown"): EvaluateArchiveNormResult {
  return {
    ok: false,
    tableId: table.tableId,
    titleRu: table.titleRu,
    source: table.source,
    tableType: table.tableType,
    flag,
    summary,
    partial: table.partial,
    verified: table.verified,
  };
}

function success(
  table: ArchiveTableDocument,
  parts: Omit<EvaluateArchiveNormResult, "ok" | "tableId" | "titleRu" | "source" | "tableType" | "partial" | "verified">,
): EvaluateArchiveNormResult {
  return {
    ok: true,
    tableId: table.tableId,
    titleRu: table.titleRu,
    source: table.source,
    tableType: table.tableType,
    partial: table.partial,
    verified: table.verified,
    ...parts,
  };
}

function evaluatePercentileByGa(table: ArchiveTableDocument, input: EvaluateArchiveNormInput): EvaluateArchiveNormResult {
  const ga = gaWeeksDecimal(input.gaWeeks, input.gaDays ?? 0);
  if (ga == null) return fail(table, "Укажите срок беременности (недели и дни).");
  if (input.value == null || !Number.isFinite(input.value) || input.value <= 0) {
    return fail(table, "Укажите измерение (положительное число).");
  }

  const params = listArchiveTableParameters(table.tableId);
  const parameterId = input.parameterId ?? params[0]?.id ?? table.parameter?.id;
  if (!parameterId) return fail(table, "Не удалось определить параметр таблицы.");

  const paramMeta = params.find((p) => p.id === parameterId) ?? table.parameter;
  const refRaw = interpolateGaRows(table.rows as Record<string, unknown>[], ga, (row) =>
    pickParamFromRow(row, parameterId),
  );

  if (!refRaw) return fail(table, "Нет норм для указанного срока.", "out_of_range");

  if (isMeanRange(refRaw)) {
    const flag =
      input.value < refRaw.rangeMin ? "low" : input.value > refRaw.rangeMax ? "high" : "normal";
    return success(table, {
      parameterLabel: paramMeta?.labelRu,
      unit: paramMeta?.unit,
      flag,
      reference: { p5: refRaw.rangeMin, p50: refRaw.mean, p95: refRaw.rangeMax, lowLabel: "min", highLabel: "max" },
      summary: `${paramMeta?.labelRu ?? parameterId}: ${input.value} ${paramMeta?.unit ?? ""} · среднее ${refRaw.mean} (диапазон ${refRaw.rangeMin}–${refRaw.rangeMax})`,
      gaUsed: { weeks: Math.floor(input.gaWeeks ?? 0), days: input.gaDays ?? 0 },
    });
  }

  const band = tripletToBand(refRaw, table.percentileLabels);
  const percentile = percentileFromMedvedevBand(input.value, band);
  const flag = flagFromPercentile(percentile);
  const lowL = band.lowLabel ?? "p5";
  const highL = band.highLabel ?? "p95";

  return success(table, {
    parameterLabel: paramMeta?.labelRu,
    unit: paramMeta?.unit,
    flag,
    percentile,
    reference: band,
    summary: `${paramMeta?.labelRu ?? parameterId}: ${input.value} ${paramMeta?.unit ?? "мм"} → ~${percentile}-й перцентиль · ${lowL} ${band.p5.toFixed(1)} · p50 ${band.p50.toFixed(1)} · ${highL} ${band.p95.toFixed(1)}`,
    gaUsed: { weeks: Math.floor(input.gaWeeks ?? 0), days: input.gaDays ?? 0 },
  });
}

function evaluatePercentileByCrl(table: ArchiveTableDocument, input: EvaluateArchiveNormInput): EvaluateArchiveNormResult {
  if (input.crlMm == null || !Number.isFinite(input.crlMm)) return fail(table, "Укажите КТР (мм).");
  if (input.value == null || !Number.isFinite(input.value) || input.value <= 0) {
    return fail(table, "Укажите измерение.");
  }

  const params = listArchiveTableParameters(table.tableId);
  const parameterId = input.parameterId ?? params[0]?.id;
  if (!parameterId) return fail(table, "Выберите параметр (желточный мешок, СДПЯ, ЧСС…).");

  const paramMeta = params.find((p) => p.id === parameterId);
  const sorted = [...(table.rows as Record<string, unknown>[])].sort(
    (a, b) => (a.crlMm as number) - (b.crlMm as number),
  );
  const crl = input.crlMm;
  let row = sorted.find((r) => r.crlMm === crl);
  if (!row) {
    const min = sorted[0]?.crlMm as number;
    const max = sorted[sorted.length - 1]?.crlMm as number;
    if (crl < min || crl > max) return fail(table, `КТР вне таблицы (${min}–${max} мм).`, "out_of_range");
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const left = sorted[i].crlMm as number;
      const right = sorted[i + 1].crlMm as number;
      if (crl >= left && crl <= right) {
        const t = (crl - left) / (right - left);
        const leftPick = pickParamFromRow(sorted[i], parameterId);
        const rightPick = pickParamFromRow(sorted[i + 1], parameterId);
        if (leftPick && rightPick && isPercentileTriplet(leftPick) && isPercentileTriplet(rightPick)) {
          const band = lerpBand(tripletToBand(leftPick), tripletToBand(rightPick), t);
          const percentile = percentileFromMedvedevBand(input.value, band);
          return success(table, {
            parameterLabel: paramMeta?.labelRu,
            unit: paramMeta?.unit,
            flag: flagFromPercentile(percentile),
            percentile,
            reference: band,
            summary: `КТР ${crl} мм · ${paramMeta?.labelRu}: ${input.value} → ~${percentile}-й перцентиль`,
          });
        }
        row = sorted[i];
        break;
      }
    }
  }
  if (!row) return fail(table, "Не удалось интерполировать по КТР.");

  const refRaw = pickParamFromRow(row, parameterId);
  if (!refRaw || !isPercentileTriplet(refRaw)) return fail(table, "Нет норм для параметра.");

  const band = tripletToBand(refRaw, table.percentileLabels);
  const percentile = percentileFromMedvedevBand(input.value, band);
  return success(table, {
    parameterLabel: paramMeta?.labelRu,
    unit: paramMeta?.unit,
    flag: flagFromPercentile(percentile),
    percentile,
    reference: band,
    summary: `КТР ${crl} мм · ${paramMeta?.labelRu}: ${input.value} → ~${percentile}-й перцентиль`,
  });
}

function evaluateDatingInverse(table: ArchiveTableDocument, input: EvaluateArchiveNormInput): EvaluateArchiveNormResult {
  if (input.value == null || !Number.isFinite(input.value) || input.value <= 0) {
    return fail(table, "Укажите измерение (мм).");
  }
  const rows = table.rows as Record<string, unknown>[];
  const xKey = Object.keys(rows[0] ?? {}).find((k) => k.endsWith("Mm") && k !== "crlMm");
  if (!xKey) return fail(table, "Неподдерживаемая ось таблицы.", "unsupported");

  const sorted = [...rows].sort((a, b) => (a[xKey] as number) - (b[xKey] as number));
  const x = input.value;
  const min = sorted[0][xKey] as number;
  const max = sorted[sorted.length - 1][xKey] as number;
  if (x < min || x > max) return fail(table, `Измерение вне таблицы (${min}–${max} мм).`, "out_of_range");

  const pickGa = (row: Record<string, unknown>, key: "gaP5" | "gaP50" | "gaP95"): GaPoint | null => {
    const g = row[key] as GaPoint | undefined;
    return g && typeof g.weeks === "number" ? g : null;
  };

  let gaP50: GaPoint | null = null;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const leftX = sorted[i][xKey] as number;
    const rightX = sorted[i + 1][xKey] as number;
    if (x >= leftX && x <= rightX) {
      if (x === leftX) gaP50 = pickGa(sorted[i], "gaP50");
      else if (x === rightX) gaP50 = pickGa(sorted[i + 1], "gaP50");
      else {
        const t = (x - leftX) / (rightX - leftX);
        const g0 = pickGa(sorted[i], "gaP50");
        const g1 = pickGa(sorted[i + 1], "gaP50");
        if (g0 && g1) {
          const d0 = g0.weeks * 7 + (g0.days ?? 0);
          const d1 = g1.weeks * 7 + (g1.days ?? 0);
          const d = Math.round(d0 + (d1 - d0) * t);
          gaP50 = { weeks: Math.floor(d / 7), days: d % 7 };
        }
      }
      break;
    }
  }
  if (!gaP50) gaP50 = pickGa(sorted[sorted.length - 1], "gaP50");
  if (!gaP50) return fail(table, "Не удалось оценить срок.");

  const unit = table.parameter?.unit ?? "mm";
  return success(table, {
    parameterLabel: table.parameter?.labelRu,
    unit,
    flag: "normal",
    summary: `${table.parameter?.labelRu ?? "Измерение"} ${x} ${unit} → срок ~${formatGa(gaP50)} нед (p50 таблицы)`,
    gaUsed: gaP50,
  });
}

function evaluateP50ByMeasurement(table: ArchiveTableDocument, input: EvaluateArchiveNormInput): EvaluateArchiveNormResult {
  if (input.axisValue == null || !Number.isFinite(input.axisValue)) {
    return fail(table, `Укажите ${table.xAxis?.labelRu ?? "ось X"} (${table.xAxis?.unit ?? "мм"}).`);
  }
  if (input.value == null || !Number.isFinite(input.value)) return fail(table, "Укажите измерение.");

  const xKey = `${table.xAxis?.id ?? "msd"}Mm`.replace(/^msdMm$/, "msdMm");
  const rows = table.rows as Record<string, unknown>[];
  const row = rows.find((r) => r[xKey] === input.axisValue || r.msdMm === input.axisValue);
  const p50 = row && typeof (row as { p50?: number }).p50 === "number" ? (row as { p50: number }).p50 : null;
  if (p50 == null) {
    return fail(table, "Нет строки таблицы для указанного СДПЯ — выберите ближайшее значение из таблицы.", "out_of_range");
  }
  const diff = input.value - p50;
  const flag = Math.abs(diff) < 0.01 ? "normal" : diff < 0 ? "low" : "high";
  return success(table, {
    parameterLabel: table.parameter?.labelRu,
    unit: table.parameter?.unit,
    flag,
    reference: { p5: p50, p50, p95: p50 },
    summary: `${table.xAxis?.labelRu} ${input.axisValue} мм → p50 ${table.parameter?.labelRu} = ${p50} мм (у вас ${input.value} мм)`,
  });
}

/** Map legacy types onto percentile_by_ga handler. */
const GA_PERCENTILE_ALIASES = new Set([
  "percentile_by_ga",
  "percentile_partial",
  "percentile_by_ga_days",
  "percentile_by_bpd",
  "p50_only_by_ga",
  "mean_sd_by_ga",
  "mean_max_by_ga",
  "median_mom_by_ga",
  "ga_from_measurement",
]);

export function evaluateArchiveNorm(input: EvaluateArchiveNormInput): EvaluateArchiveNormResult {
  const card = findArchiveCardByTableId(input.tableId);
  const resolvedId = resolveArchiveTableId(input.tableId, input.subTableId);
  const table = getArchiveTableDocument(input.tableId, input.subTableId);
  if (!table) {
    return {
      ok: false,
      tableId: input.tableId,
      titleRu: card?.titleRu ?? input.tableId,
      tableType: card?.tableType ?? "unknown",
      flag: "unknown",
      summary: "Таблица не найдена в SSOT.",
    };
  }
  const evalInput =
    resolvedId !== input.tableId ? { ...input, tableId: resolvedId } : { ...input, tableId: table.tableId };

  if (card?.extractionStatus === "partial" || table.partial) {
    // still calculate; UI may show badge
  }

  switch (table.tableType) {
    case "dating_inverse":
      return evaluateDatingInverse(table, evalInput);
    case "percentile_by_crl":
      return evaluatePercentileByCrl(table, evalInput);
    case "percentile_by_measurement":
      return evaluateP50ByMeasurement(table, evalInput);
    case "mean_range_by_ga":
      return evaluatePercentileByGa(table, evalInput);
    default:
      if (GA_PERCENTILE_ALIASES.has(table.tableType) || table.tableType.startsWith("percentile")) {
        return evaluatePercentileByGa(table, evalInput);
      }
      return fail(
        table,
        `Тип таблицы «${table.tableType}» пока не поддержан в калькуляторе MVP.`,
        "unsupported",
      );
  }
}
