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
import type { TiradsAcrCategory, TiradsAcrInput, TiradsAcrResult, TiradsScoreBreakdown } from "./types";
import { decideFnaAndFollowUp } from "./fna";
import { lymphNodeNote } from "./lymph-node";

export const defaultTiradsAcrInput: TiradsAcrInput = {
  composition: "solid",
  echogenicity: "hypoechoic",
  shape: "wider_than_tall",
  margin: "smooth",
  echogenicFoci: "none_or_comet_tail",
  lymphNodes: "not_assessed",
};

export function computeScoreBreakdown(input: TiradsAcrInput): TiradsScoreBreakdown {
  if (input.composition === "no_nodule") {
    return { composition: 0, echogenicity: 0, shape: 0, margin: 0, echogenicFoci: 0, total: 0 };
  }
  const composition = pointsFor(COMPOSITION_OPTIONS, input.composition);
  const echogenicity = pointsFor(ECHOGENICITY_OPTIONS, input.echogenicity);
  const shape = pointsFor(SHAPE_OPTIONS, input.shape);
  const margin = pointsFor(MARGIN_OPTIONS, input.margin);
  const echogenicFoci = pointsFor(ECHOGENIC_FOCI_OPTIONS, input.echogenicFoci);
  return {
    composition,
    echogenicity,
    shape,
    margin,
    echogenicFoci,
    total: composition + echogenicity + shape + margin + echogenicFoci,
  };
}

export function categoryFromPoints(input: TiradsAcrInput, total: number): TiradsAcrCategory {
  if (input.composition === "no_nodule") return "TR1";
  if (total === 0) return "TR2";
  if (total === 3) return "TR3";
  if (total >= 4 && total <= 6) return "TR4";
  if (total >= 7) return "TR5";
  // 1–2 points → TR2 per ACR
  return "TR2";
}

export function evaluateAcrTirads(input: TiradsAcrInput): TiradsAcrResult {
  const scoreBreakdown = computeScoreBreakdown(input);
  const category = categoryFromPoints(input, scoreBreakdown.total);
  const meta = categoryMeta(category);
  const fna = decideFnaAndFollowUp(category, input.largestDiameterMm);
  const lnNote = lymphNodeNote(input.lymphNodes);

  const rationale: string[] = [
    `Composition: ${input.composition} (+${scoreBreakdown.composition})`,
    `Echogenicity: ${input.echogenicity} (+${scoreBreakdown.echogenicity})`,
    `Shape: ${input.shape} (+${scoreBreakdown.shape})`,
    `Margin: ${input.margin} (+${scoreBreakdown.margin})`,
    `Echogenic foci: ${input.echogenicFoci} (+${scoreBreakdown.echogenicFoci})`,
    `Total: ${scoreBreakdown.total} → ${category}`,
  ];

  if (input.largestDiameterMm !== undefined) {
    rationale.push(`Размер: ${formatMm(input.largestDiameterMm)}`);
  }
  if (lnNote) rationale.push(lnNote);

  let fnaRecommended = fna.fnaRecommended;
  let fnaRationale = fna.fnaRationale;
  if (input.lymphNodes === "suspicious" && category !== "TR1" && category !== "TR2") {
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
  };
}
