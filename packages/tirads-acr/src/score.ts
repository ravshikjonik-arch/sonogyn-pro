import { categoryMeta } from "./categories";
import { formatMm } from "@repo/medical-calculations";
import {
  COMPOSITION_OPTIONS,
  ECHOGENICITY_OPTIONS,
  ECHOGENIC_FOCI_OPTIONS,
  MARGIN_OPTIONS,
  pointsFor,
  SHAPE_OPTIONS,
} from "./lexicon";
import type {
  TiradsAcrCategory,
  TiradsAcrInput,
  TiradsAcrResult,
  TiradsEchogenicFoci,
  TiradsScoreBreakdown,
} from "./types";
import { decideFnaAndFollowUp } from "./fna";
import { lymphNodeNote } from "./lymph-node";

/** ACR 2017 bands + multi-foci + cystic/spongiform TR1 shortcut. */
export const ACR_TIRADS_ENGINE_VERSION = "acr-2017-v2";

export const defaultTiradsAcrInput: TiradsAcrInput = {
  composition: "solid",
  echogenicity: "hypoechoic",
  shape: "wider_than_tall",
  margin: "smooth",
  echogenicFoci: ["none_or_comet_tail"],
  lymphNodes: "not_assessed",
};

/** Normalize single legacy value or array; drop "none" when other foci present. */
export function normalizeEchogenicFoci(
  value: TiradsEchogenicFoci | TiradsEchogenicFoci[] | undefined | null,
): TiradsEchogenicFoci[] {
  if (value == null) return ["none_or_comet_tail"];
  const arr = (Array.isArray(value) ? value : [value]).filter(Boolean);
  const unique = [...new Set(arr)] as TiradsEchogenicFoci[];
  if (unique.length === 0) return ["none_or_comet_tail"];
  if (unique.length > 1) {
    const withoutNone = unique.filter((f) => f !== "none_or_comet_tail");
    return withoutNone.length ? withoutNone : ["none_or_comet_tail"];
  }
  return unique;
}

export function sumEchogenicFociPoints(foci: TiradsEchogenicFoci[]): number {
  return normalizeEchogenicFoci(foci).reduce(
    (sum, f) => sum + pointsFor(ECHOGENIC_FOCI_OPTIONS, f),
    0,
  );
}

/** Highest-point focus — for SRE forms that still store a single enum. */
export function primaryEchogenicFocus(foci: TiradsEchogenicFoci[]): TiradsEchogenicFoci {
  const normalized = normalizeEchogenicFoci(foci);
  let best: TiradsEchogenicFoci = normalized[0] ?? "none_or_comet_tail";
  let bestPts = pointsFor(ECHOGENIC_FOCI_OPTIONS, best);
  for (const f of normalized) {
    const pts = pointsFor(ECHOGENIC_FOCI_OPTIONS, f);
    if (pts > bestPts) {
      best = f;
      bestPts = pts;
    }
  }
  return best;
}

function isBenignCompositionShortcut(composition: TiradsAcrInput["composition"]): boolean {
  return composition === "no_nodule" || composition === "cystic" || composition === "spongiform";
}

export function computeScoreBreakdown(input: TiradsAcrInput): TiradsScoreBreakdown {
  if (isBenignCompositionShortcut(input.composition)) {
    return { composition: 0, echogenicity: 0, shape: 0, margin: 0, echogenicFoci: 0, total: 0 };
  }
  const composition = pointsFor(COMPOSITION_OPTIONS, input.composition);
  const echogenicity = pointsFor(ECHOGENICITY_OPTIONS, input.echogenicity);
  const shape = pointsFor(SHAPE_OPTIONS, input.shape);
  const margin = pointsFor(MARGIN_OPTIONS, input.margin);
  const echogenicFoci = sumEchogenicFociPoints(input.echogenicFoci);
  return {
    composition,
    echogenicity,
    shape,
    margin,
    echogenicFoci,
    total: composition + echogenicity + shape + margin + echogenicFoci,
  };
}

/**
 * ACR TI-RADS levels:
 * TR1 = 0; TR2 = 1–2; TR3 = 3–4; TR4 = 5–6; TR5 ≥ 7.
 */
export function categoryFromPoints(input: TiradsAcrInput, total: number): TiradsAcrCategory {
  if (isBenignCompositionShortcut(input.composition)) return "TR1";
  if (total <= 0) return "TR1";
  if (total <= 2) return "TR2";
  if (total <= 4) return "TR3";
  if (total <= 6) return "TR4";
  return "TR5";
}

export function evaluateAcrTirads(input: TiradsAcrInput): TiradsAcrResult {
  const normalized: TiradsAcrInput = {
    ...input,
    echogenicFoci: normalizeEchogenicFoci(input.echogenicFoci),
  };
  const scoreBreakdown = computeScoreBreakdown(normalized);
  const category = categoryFromPoints(normalized, scoreBreakdown.total);
  const meta = categoryMeta(category);
  const fna = decideFnaAndFollowUp(category, normalized.largestDiameterMm);
  const lnNote = lymphNodeNote(normalized.lymphNodes);

  const fociLabel = normalized.echogenicFoci.join("+");
  const rationale: string[] = [
    `Composition: ${normalized.composition} (+${scoreBreakdown.composition})`,
    `Echogenicity: ${normalized.echogenicity} (+${scoreBreakdown.echogenicity})`,
    `Shape: ${normalized.shape} (+${scoreBreakdown.shape})`,
    `Margin: ${normalized.margin} (+${scoreBreakdown.margin})`,
    `Echogenic foci: ${fociLabel} (+${scoreBreakdown.echogenicFoci})`,
    `Total: ${scoreBreakdown.total} → ${category}`,
  ];

  if (isBenignCompositionShortcut(normalized.composition) && normalized.composition !== "no_nodule") {
    rationale.push("ACR: cystic/spongiform → TR1 (остальные признаки не добавляют баллы).");
  }

  if (normalized.largestDiameterMm !== undefined) {
    rationale.push(`Размер: ${formatMm(normalized.largestDiameterMm)}`);
  }
  if (lnNote) rationale.push(lnNote);

  let fnaRecommended = fna.fnaRecommended;
  let fnaRationale = fna.fnaRationale;
  if (normalized.lymphNodes === "suspicious" && category !== "TR1" && category !== "TR2") {
    fnaRecommended = true;
    fnaRationale = `${fnaRationale} Подозрительные регионарные ЛУ — усилить тактику FNA.`;
  }

  return {
    category,
    categoryLabel: meta.label,
    totalPoints: scoreBreakdown.total,
    scoreBreakdown,
    malignancyRisk: meta.malignancyRisk,
    riskLevel: meta.riskLevel === "none" ? "very_low" : meta.riskLevel,
    fnaRecommended,
    fnaRationale,
    followUpRecommendation: fna.followUpRecommendation,
    observationRecommendation: fna.observationRecommendation,
    lymphNodeNote: lnNote,
    rationale,
    clinicalSignificance: meta.clinicalSignificance,
    engineVersion: ACR_TIRADS_ENGINE_VERSION,
  };
}
