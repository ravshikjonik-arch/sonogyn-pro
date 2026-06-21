import type { BiradsBrochureInput } from "../biradsBrochure2025";
import type { BiradsCategoryCode } from "../knowledge/categories";
import { categoryMeta, parseCategoryCode } from "../knowledge/categories";
import {
  BIRADS_PATHOLOGY_LIBRARY,
  type BiradsPathologyEntry,
  type BiradsPathologyId,
} from "../knowledge/differential";

export type BiradsEngineInput = BiradsBrochureInput;

export type BiradsEngineOutput = {
  category: string;
  categoryCode: BiradsCategoryCode | null;
  malignancyRisk: string;
  suspicionLevel: string;
  followUp: string;
  biopsyRecommended: boolean;
  management: string;
  reasoning: string[];
  matchedPathologies: BiradsPathologyEntry[];
};

const SPECIAL_CASE_PATHOLOGY: Record<string, BiradsPathologyId> = {
  simple_cyst: "simple_cyst",
  microcyst_cluster: "clustered_microcysts",
  complicated_cyst: "complicated_cyst",
  fat_necrosis: "fat_necrosis",
  abscess: "abscess",
  intramammary_ln: "metastatic_node",
};

function scorePathology(p: BiradsPathologyEntry, input: BiradsEngineInput): number {
  let score = 0;
  const tags = p.searchTags.join(" ").toLowerCase();

  if (input.specialCase && SPECIAL_CASE_PATHOLOGY[input.specialCase] === p.id) score += 10;

  if (input.echoPattern === "anechoic" && tags.includes("анэхоген")) score += 3;
  if (input.echoPattern === "hypoechoic" && tags.includes("гипоэхоген")) score += 3;
  if (input.echoPattern === "hyperechoic" && tags.includes("гиперэхоген")) score += 3;
  if (input.margin === "circumscribed" && tags.includes("чётк")) score += 1;
  if (input.margin === "spiculated" && tags.includes("рак")) score += 4;
  if (input.shape === "oval" && tags.includes("oval")) score += 2;
  if (input.orientation === "non_parallel" && tags.includes("инвазив")) score += 2;
  if ((input.lymphNodeCortex === "focal" || input.lymphNodeCortex === "eccentric") && p.id === "metastatic_node")
    score += 5;
  if (input.associatedFeatures?.includes("architectural_distortion") && p.id === "radial_scar") score += 4;

  return score;
}

export function matchDifferential(input: BiradsEngineInput, limit = 3): BiradsPathologyEntry[] {
  return [...BIRADS_PATHOLOGY_LIBRARY]
    .map((p) => ({ p, score: scorePathology(p, input) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

export function enrichEngineResult(
  input: BiradsEngineInput,
  base: { category: string; riskRange: string; impression: string; description: string },
): BiradsEngineOutput {
  const code = parseCategoryCode(base.category);
  const meta = code ? categoryMeta(code) : null;
  const pathologies = matchDifferential(input);

  const reasoning: string[] = [
    `Форма: ${input.shape}, ориентация: ${input.orientation}`,
    `Контуры: ${input.margin}, эхо: ${input.echoPattern}`,
    `Позади: ${input.posteriorFeatures}, васкуляризация: ${input.vascularity}`,
  ];
  if (input.calcifications && input.calcifications !== "none") {
    reasoning.push(`Кальцинаты: ${input.calcifications}`);
  }
  if (input.associatedFeatures?.length) {
    reasoning.push(`Ассоциированные признаки: ${input.associatedFeatures.join(", ")}`);
  }
  if (base.description) reasoning.push(base.description);

  return {
    category: base.category,
    categoryCode: code,
    malignancyRisk: meta?.malignancyRisk ?? base.riskRange,
    suspicionLevel: meta?.suspicionLevel ?? "none",
    followUp: meta?.followUpRu ?? base.impression,
    biopsyRecommended: meta?.biopsyRecommended ?? false,
    management: meta?.managementRu ?? base.impression,
    reasoning,
    matchedPathologies: pathologies,
  };
}
