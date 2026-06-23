import { evaluateLnRads } from "../ln-rads-core";
import { categoryMeta } from "../knowledge/categories";
import {
  LN_PATHOLOGY_LIBRARY,
  PATTERN_TO_PATHOLOGY,
  type LnPathologyEntry,
} from "../knowledge/pathology";
import type { LnPatternId, LnRadsInput, LnRadsResult } from "../types";

export type LnDifferentialResult = {
  mostLikely: LnPathologyEntry[];
  alternatives: LnPathologyEntry[];
  redFlags: string[];
  biopsyRecommended: boolean;
  followUpRecommended: boolean;
  additionalImaging: string[];
};

function scorePathology(p: LnPathologyEntry, input: LnRadsInput): number {
  let score = 0;
  const tags = p.searchTags.join(" ").toLowerCase();

  if (Math.abs(p.typicalLnRads - evaluateLnRads(input).category) <= 1) score += 3;

  if (input.shape === "oval" && tags.includes("oval")) score += 3;
  if (input.shape === "round" && tags.includes("round")) score += 3;
  if (input.shape === "spiculated" && tags.includes("spiculated")) score += 4;
  if (input.hilum === "absent" && tags.includes("hilum")) score += 2;
  if (input.hilum === "preserved" && (p.id === "normal_node" || p.id === "reactive_node")) score += 4;
  if (input.calcifications === "microcalcifications" && tags.includes("microcalcification")) score += 5;
  if (input.necrosis !== "absent" && tags.includes("некроз")) score += 3;
  if (input.vascularity === "peripheral" && tags.includes("peripheral")) score += 2;
  if (input.region.startsWith("level_") && tags.includes("thyroid")) score += 2;
  if (input.region === "axillary" && tags.includes("axillary")) score += 3;
  if (input.region.includes("iliac") && tags.includes("pelvic")) score += 3;

  return score;
}

export function matchDifferential(input: LnRadsInput, limit = 4): LnPathologyEntry[] {
  return [...LN_PATHOLOGY_LIBRARY]
    .map((p) => ({ p, score: scorePathology(p, input) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

export function buildDifferential(input: LnRadsInput, result: LnRadsResult): LnDifferentialResult {
  const matched = matchDifferential(input, 5);
  return {
    mostLikely: matched.slice(0, 2),
    alternatives: matched.slice(2),
    redFlags: result.redFlags,
    biopsyRecommended: result.biopsyRecommended,
    followUpRecommended: result.followUpRecommended,
    additionalImaging: result.additionalImaging,
  };
}

export type LnPatternRecognitionResult = {
  pattern: LnPatternId;
  predictedDiagnoses: LnPathologyEntry[];
  estimatedMalignancyRisk: string;
  lnRadsCategory: number;
  recommendations: string[];
  teachingNote: string;
};

const PATTERN_INPUT_PRESETS: Record<LnPatternId, Partial<LnRadsInput>> = {
  oval: { shape: "oval", hilum: "preserved", cortex: "thin", vascularity: "hilar" },
  round: { shape: "round", hilum: "absent", cortex: "eccentric_thickening", vascularity: "peripheral" },
  lobulated: { shape: "lobulated", hilum: "compressed", vascularity: "mixed" },
  spiculated: { shape: "spiculated", hilum: "absent", architecture: "replaced", vascularity: "chaotic" },
  necrotic: { necrosis: "extensive", vascularity: "peripheral", hilum: "absent" },
  cystic: { cysticDegeneration: "present", echogenicity: "heterogeneous" },
  calcified: { calcifications: "microcalcifications", shape: "round", hilum: "absent" },
  reactive: { shape: "oval", hilum: "preserved", cortex: "uniform_thickening", vascularity: "hilar" },
};

export function recognizePattern(
  pattern: LnPatternId,
  baseInput?: Partial<LnRadsInput>,
): LnPatternRecognitionResult {
  const input: LnRadsInput = {
    ...defaultMinimalInput(),
    ...PATTERN_INPUT_PRESETS[pattern],
    ...baseInput,
  };

  const result = evaluateLnRads(input);
  const meta = categoryMeta(result.category);
  const pathologyIds = PATTERN_TO_PATHOLOGY[pattern] ?? [];
  const predicted = LN_PATHOLOGY_LIBRARY.filter((p) => pathologyIds.includes(p.id));

  const recommendations = [meta.managementRu];
  if (result.biopsyRecommended) recommendations.push("FNA/core biopsy рекомендована.");
  if (result.followUpRecommended) recommendations.push("Короткий интервал контроля при LN-RADS ≤ 3.");

  return {
    pattern,
    predictedDiagnoses: predicted.length ? predicted : matchDifferential(input, 3),
    estimatedMalignancyRisk: meta.malignancyRisk,
    lnRadsCategory: result.category,
    recommendations,
    teachingNote: predicted[0]?.clinicalPearls[0] ?? meta.definitionRu,
  };
}

function defaultMinimalInput(): LnRadsInput {
  return {
    longAxisMm: 18,
    shortAxisMm: 8,
    shape: "oval",
    capsule: "intact",
    hilum: "preserved",
    cortex: "thin",
    echogenicity: "normal",
    architecture: "preserved",
    vascularity: "hilar",
    calcifications: "none",
    necrosis: "absent",
    cysticDegeneration: "absent",
    extracapsularExtension: "no",
    matting: "absent",
    region: "head_neck",
  };
}

export type LnEngineOutput = LnRadsResult & {
  differential: LnDifferentialResult;
  categoryMeta: ReturnType<typeof categoryMeta>;
};

export function enrichEngineResult(input: LnRadsInput): LnEngineOutput {
  const result = evaluateLnRads(input);
  const meta = categoryMeta(result.category);
  const differential = buildDifferential(input, result);
  return { ...result, differential, categoryMeta: meta };
}
