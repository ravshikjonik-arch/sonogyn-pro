import type { PercentileResult } from "@repo/fmf";

function bandFromPercentile(p?: PercentileResult | null): "low" | "intermediate" | "high" | null {
  if (!p || p.percentile == null) return null;
  if (p.percentile >= 95) return "high";
  if (p.percentile >= 90) return "intermediate";
  return "low";
}

const LABEL: Record<"low" | "intermediate" | "high", string> = {
  low: "низкий (assistive, по перцентилю референса)",
  intermediate: "промежуточный (≥P90, assistive)",
  high: "повышенный (≥P95, assistive)",
};

/** Эвристика до полного FMF PE calculator API — только перцентили MAP / UtA PI. */
export function deriveFmfPeRiskLabels(measurements: PercentileResult[]): {
  earlyPeRisk: string;
  termPeRisk: string;
} {
  const mapRow = measurements.find((m) => m.parameterId === "map");
  const utaRow = measurements.find((m) => m.parameterId === "uta");

  const mapBand = bandFromPercentile(mapRow);
  const utaBand = bandFromPercentile(utaRow);

  const worst =
    mapBand === "high" || utaBand === "high"
      ? "high"
      : mapBand === "intermediate" || utaBand === "intermediate"
        ? "intermediate"
        : mapBand || utaBand
          ? "low"
          : null;

  if (!worst) {
    return {
      earlyPeRisk: "не рассчитан — укажите MAP и UtA PI в окне 11–14 нед",
      termPeRisk: "не рассчитан",
    };
  }

  return {
    earlyPeRisk: LABEL[worst],
    termPeRisk: worst === "high" ? LABEL.high : worst === "intermediate" ? LABEL.intermediate : LABEL.low,
  };
}
