import { listMedvedevBookTables } from "./loadTables";
import { formatGaDays, inRange, parseGaSlashToDays } from "./parse";
import type {
  EvaluateContext,
  FetometryPopulation,
  FetometryRow,
  FetometryTable,
  MeasurementResult,
  PanelResult,
  PanelSummary,
  ZoneFlag,
} from "./types";
import { MEDVEDEV_BOOK_DISCLAIMER, MEDVEDEV_BOOK_SOURCE_VERSION, MEDVEDEV_BOOK_WARNINGS } from "./warnings";

export function lookupRow(table: FetometryTable, ctx: EvaluateContext): FetometryRow | null {
  const rows = table.rows;
  if (!rows.length) return null;

  switch (table.axis) {
    case "svd": {
      if (ctx.svdMm == null) return null;
      let best: FetometryRow | null = null;
      let bestDist = Infinity;
      for (const r of rows) {
        if (r.svdMm == null) continue;
        const d = Math.abs(r.svdMm - ctx.svdMm);
        if (d < bestDist) {
          bestDist = d;
          best = r;
        }
      }
      return best;
    }
    case "crl_range": {
      if (ctx.crlMm == null) return null;
      return rows.find((r) => r.crlRange && inRange(ctx.crlMm!, r.crlRange)) ?? null;
    }
    case "crl_exact": {
      if (ctx.crlMm == null) return null;
      let best: FetometryRow | null = null;
      let bestDist = Infinity;
      for (const r of rows) {
        if (r.crlMm == null) continue;
        const d = Math.abs(r.crlMm - ctx.crlMm);
        if (d < bestDist) {
          bestDist = d;
          best = r;
        }
      }
      return best;
    }
    case "bpd_range": {
      if (ctx.bpdMm == null) return null;
      return rows.find((r) => r.bpdRange && inRange(ctx.bpdMm!, r.bpdRange)) ?? null;
    }
    case "ga_range": {
      if (ctx.gaWeeks == null) return null;
      const hit = rows.find((r) => r.gaRange && inRange(ctx.gaWeeks!, r.gaRange));
      if (hit) return hit;
      return nearestGaWeekRow(rows, ctx.gaWeeks);
    }
    case "ga_string":
    case "ga_weeks": {
      if (ctx.gaWeeks == null) return null;
      // Prefer exact week; for ga_string with days, prefer closest total days when days provided
      if (table.axis === "ga_string" && ctx.gaDays != null) {
        const target = ctx.gaWeeks * 7 + ctx.gaDays;
        let best: FetometryRow | null = null;
        let bestDist = Infinity;
        for (const r of rows) {
          if (r.gaWeeks == null) continue;
          const days = (r.gaWeeks * 7) + (r.gaDays ?? 0);
          const d = Math.abs(days - target);
          if (d < bestDist) {
            bestDist = d;
            best = r;
          }
        }
        return best;
      }
      return nearestGaWeekRow(rows, ctx.gaWeeks);
    }
    default:
      return null;
  }
}

function nearestGaWeekRow(rows: FetometryRow[], gaWeeks: number): FetometryRow | null {
  const exact = rows.find((r) => r.gaWeeks === gaWeeks);
  if (exact) return exact;
  let best: FetometryRow | null = null;
  let bestDist = Infinity;
  for (const r of rows) {
    if (r.gaWeeks == null) continue;
    const d = Math.abs(r.gaWeeks - gaWeeks);
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  return best;
}

const ZONE_LABEL: Record<ZoneFlag, string> = {
  below: "Ниже нормы",
  normal: "Норма",
  above: "Выше нормы",
  mom_alert: "≥ 1,5 MoM — подозрение на анемию плода",
  mom_ok: "Ниже порога 1,5 MoM",
  out_of_range: "Вне диапазона таблицы",
  dating: "Оценка срока",
};

export function classifyValue(
  table: FetometryTable,
  value: number,
  row: FetometryRow,
): Pick<
  MeasurementResult,
  "zone" | "zoneLabelRu" | "pLow" | "p50" | "pHigh" | "median" | "mom1_5" | "nearestPercentileHint"
> {
  const { band } = row;

  if (table.percentileKind === "mom" || band.mom1_5 != null) {
    const mom1_5 = band.mom1_5;
    const median = band.median;
    if (mom1_5 == null) {
      return { zone: "out_of_range", zoneLabelRu: ZONE_LABEL.out_of_range, median, mom1_5 };
    }
    if (value >= mom1_5) {
      return {
        zone: "mom_alert",
        zoneLabelRu: ZONE_LABEL.mom_alert,
        median,
        mom1_5,
        nearestPercentileHint: `порог 1,5 MoM = ${mom1_5}`,
      };
    }
    return {
      zone: "mom_ok",
      zoneLabelRu: ZONE_LABEL.mom_ok,
      median,
      mom1_5,
      nearestPercentileHint: median != null ? `медиана ${median}` : undefined,
    };
  }

  if (table.percentileKind === "ga_strings") {
    return { zone: "dating", zoneLabelRu: ZONE_LABEL.dating };
  }

  const pLow = band.pLow;
  const p50 = band.p50;
  const pHigh = band.pHigh;

  // colon: only p50/p95 — treat <p50 as below-ish? Spec: p50 and p95 only.
  // Use: value > p95 → above; else normal (no lower bound).
  if (pLow == null && p50 != null && pHigh != null) {
    if (value > pHigh) {
      return {
        zone: "above",
        zoneLabelRu: ZONE_LABEL.above,
        p50,
        pHigh,
        nearestPercentileHint: `> p95 (${pHigh})`,
      };
    }
    return {
      zone: "normal",
      zoneLabelRu: ZONE_LABEL.normal,
      p50,
      pHigh,
      nearestPercentileHint: value <= p50 ? `≤ p50 (${p50})` : `p50–p95`,
    };
  }

  if (pLow == null || pHigh == null) {
    return { zone: "out_of_range", zoneLabelRu: ZONE_LABEL.out_of_range, pLow, p50, pHigh };
  }

  let zone: ZoneFlag;
  if (value < pLow) zone = "below";
  else if (value > pHigh) zone = "above";
  else zone = "normal";

  let nearest = "p50";
  if (p50 != null) {
    if (value < pLow) nearest = `< ${lowLabel(table)} (${pLow})`;
    else if (value > pHigh) nearest = `> ${highLabel(table)} (${pHigh})`;
    else if (value < p50) nearest = `${lowLabel(table)}–p50`;
    else nearest = `p50–${highLabel(table)}`;
  }

  return {
    zone,
    zoneLabelRu: ZONE_LABEL[zone],
    pLow,
    p50,
    pHigh,
    nearestPercentileHint: nearest,
  };
}

function lowLabel(table: FetometryTable): string {
  return table.percentileKind === "p2_5_p97_5" ? "p2,5" : "p5";
}
function highLabel(table: FetometryTable): string {
  return table.percentileKind === "p2_5_p97_5" ? "p97,5" : "p95";
}

/** SVD mm → GA estimate from table 1.1 p50 (and p5/p95 band as strings). */
export function estimateGaFromSvd(svdMm: number): {
  gaP50Days: number | null;
  gaP50Label: string | null;
  gaP5Label: string | null;
  gaP95Label: string | null;
  matchedSvd: number | null;
} | null {
  const table = listMedvedevBookTables().find((t) => t.id === "t1.svd_dating");
  if (!table) return null;
  const row = lookupRow(table, { svdMm });
  if (!row) return null;
  const p50 = row.band.gaP50 ? parseGaSlashToDays(row.band.gaP50) : null;
  return {
    gaP50Days: p50,
    gaP50Label: row.band.gaP50 ? formatGaDays(parseGaSlashToDays(row.band.gaP50) ?? 0) : null,
    gaP5Label: row.band.gaP5 ? formatGaDays(parseGaSlashToDays(row.band.gaP5) ?? 0) : null,
    gaP95Label: row.band.gaP95 ? formatGaDays(parseGaSlashToDays(row.band.gaP95) ?? 0) : null,
    matchedSvd: row.svdMm ?? null,
  };
}

export function evaluateMeasurement(
  tableId: string,
  value: number,
  ctx: EvaluateContext,
): MeasurementResult | null {
  const table = listMedvedevBookTables().find((t) => t.id === tableId);
  if (!table) return null;

  if (table.percentileKind === "ga_strings") {
    const row = lookupRow(table, { ...ctx, svdMm: value });
    if (!row) {
      return {
        id: table.id,
        titleRu: table.titleRu,
        unit: table.unit,
        value,
        zone: "out_of_range",
        zoneLabelRu: ZONE_LABEL.out_of_range,
        bookTableId: table.bookTableId,
      };
    }
    const est = estimateGaFromSvd(value);
    return {
      id: table.id,
      titleRu: table.titleRu,
      unit: table.unit,
      value: est?.gaP50Label ?? row.band.gaP50 ?? value,
      zone: "dating",
      zoneLabelRu: ZONE_LABEL.dating,
      nearestPercentileHint: `p5 ${est?.gaP5Label ?? "—"} · p50 ${est?.gaP50Label ?? "—"} · p95 ${est?.gaP95Label ?? "—"}`,
      matchedLabel: row.label,
      bookTableId: table.bookTableId,
    };
  }

  const row = lookupRow(table, ctx);
  if (!row) {
    return {
      id: table.id,
      titleRu: table.titleRu,
      unit: table.unit,
      value,
      zone: "out_of_range",
      zoneLabelRu: ZONE_LABEL.out_of_range,
      bookTableId: table.bookTableId,
    };
  }

  const cls = classifyValue(table, value, row);
  return {
    id: table.id,
    titleRu: table.titleRu,
    unit: table.unit,
    value,
    matchedLabel: row.label,
    bookTableId: table.bookTableId,
    ...cls,
  };
}

export function evaluateFetometryPanel(input: {
  ctx: EvaluateContext;
  measurements: Record<string, number | undefined | null>;
  section?: FetometryTable["section"] | FetometryTable["section"][];
  population?: FetometryPopulation;
}): PanelResult {
  const sections = input.section
    ? Array.isArray(input.section)
      ? input.section
      : [input.section]
    : undefined;
  const population = input.population ?? input.ctx.population ?? "moscow";

  const tables = listMedvedevBookTables().filter((t) => {
    if (sections && !sections.includes(t.section)) return false;
    if (t.section === "appendix") return t.population === population;
    // For t2_base base biometry when population selected — also prefer appendix overlays for core ids
    return true;
  });

  const results: MeasurementResult[] = [];
  for (const [id, raw] of Object.entries(input.measurements)) {
    if (raw == null || !Number.isFinite(raw)) continue;
    const table =
      tables.find((t) => t.id === id) ??
      listMedvedevBookTables().find((t) => t.id === id);
    if (!table) continue;
    // Appendix population override for core biometry when using appendix.* ids
    const result = evaluateMeasurement(table.id, Number(raw), { ...input.ctx, population });
    if (result) results.push(result);
  }

  const summary: PanelSummary = { below: 0, normal: 0, above: 0, momAlert: 0, other: 0 };
  for (const r of results) {
    if (r.zone === "below") summary.below++;
    else if (r.zone === "normal" || r.zone === "mom_ok") summary.normal++;
    else if (r.zone === "above") summary.above++;
    else if (r.zone === "mom_alert") summary.momAlert++;
    else summary.other++;
  }

  return {
    results,
    summary,
    warnings: MEDVEDEV_BOOK_WARNINGS,
    disclaimer: MEDVEDEV_BOOK_DISCLAIMER,
    sourceVersion: MEDVEDEV_BOOK_SOURCE_VERSION,
  };
}

/** Resolve base biometry table id for a population (appendix) or default Medvedev 2.x */
export function resolveBaseBiometryTableId(
  param: "bpd" | "ofd" | "hc" | "ac" | "fl" | "hl" | "abd_mean_diameter",
  population: FetometryPopulation = "moscow",
): string {
  if (population === "moscow") {
    const map: Record<string, string> = {
      bpd: "t2.bpd",
      ofd: "t2.ofd",
      hc: "t2.hc",
      ac: "t2.ac",
      fl: "t2.fl",
      hl: "t2.hl",
      abd_mean_diameter: "t2.ac", // fallback — СДЖ only in regional appendices
    };
    return map[param] ?? `t2.${param}`;
  }
  const key =
    param === "abd_mean_diameter"
      ? "abd_mean_diameter_mm"
      : param === "bpd"
        ? "bpd_mm"
        : param === "ofd"
          ? "ofd_mm"
          : param === "hc"
            ? "hc_mm"
            : param === "ac"
              ? "ac_mm"
              : param === "fl"
                ? "fl_mm"
                : "hl_mm";
  return `appendix.${population}.${key}`;
}
