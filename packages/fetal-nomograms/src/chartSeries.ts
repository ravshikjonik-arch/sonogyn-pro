import { getNomogramById } from "./dataset";
import { gaStringToTotalDays } from "./evaluateNomogram";
import type { Nomogram } from "./types";

export type NomogramChartPoint = {
  x: number;
  p5?: number;
  p50?: number;
  p95?: number;
};

export type NomogramChartSeries = {
  nomogramId: string;
  title: string;
  unit: string;
  xAxisLabel: string;
  points: NomogramChartPoint[];
  percentileLabels: { low: string; mid: string; high: string };
};

function xFromRow(nomogram: Nomogram, row: Nomogram["rows"][0]): number | undefined {
  if (nomogram.x_axis.type === "ga_weeks") return row.ga_weeks;
  if (nomogram.x_axis.type === "ga_days" && row.ga) return gaStringToTotalDays(row.ga) / 7;
  if (nomogram.x_axis.type === "crl_range_mm" && row.crl_min != null && row.crl_max != null) {
    return (row.crl_min + row.crl_max) / 2;
  }
  return undefined;
}

export function buildNomogramChartSeries(nomogramId: string): NomogramChartSeries | null {
  const nomogram = getNomogramById(nomogramId);
  if (!nomogram) return null;
  if (nomogram.fields?.includes("min") || nomogram.fields?.includes("mom_1_5")) return null;

  const points: NomogramChartPoint[] = [];
  for (const row of nomogram.rows) {
    const x = xFromRow(nomogram, row);
    if (x == null) continue;
    points.push({ x, p5: row.p5, p50: row.p50, p95: row.p95 });
  }
  points.sort((a, b) => a.x - b.x);
  if (points.length < 2) return null;

  const p = nomogram.percentiles;
  const percentileLabels =
    p?.[0] === 2.5
      ? { low: "p2,5", mid: "p50", high: "p97,5" }
      : { low: "p5", mid: "p50", high: "p95" };

  return {
    nomogramId,
    title: nomogram.title,
    unit: nomogram.unit,
    xAxisLabel: nomogram.x_axis.label,
    points,
    percentileLabels,
  };
}
