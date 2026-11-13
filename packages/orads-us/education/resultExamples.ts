import type { OradsTreePathStep, OradsTreeResult } from "../src/types";
import { parseOradsCategoryFromHint } from "./categoryPhotoCards";
import {
  getOradsNosologyById,
  getOradsNosologyPreviewImage,
  type OradsNosologyAtlasEntry,
} from "./nosologyAtlas";

/** Wizard answer → atlas entries that illustrate it (nodeId → optionId → entry ids). */
const EXAMPLE_IDS_BY_ANSWER: Record<string, Record<string, string[]>> = {
  step1_extraovarian: {
    paraovarian: ["paraovarian_cyst"],
    hydrosalpinx: ["hydrosalpinx"],
    peritoneal_inclusion: ["peritoneal_inclusion_cyst"],
  },
  step2_lesion_class: {
    simple: ["functional_cyst"],
  },
  step3_unilocular_classic: {
    classic: ["hemorrhagic_cyst_reticular", "dermoid_cyst", "endometrioid_cyst"],
  },
  step_modifier_ascites: {
    ascites: ["free_fluid_pelvis"],
    both: ["free_fluid_pelvis"],
  },
};

const EXAMPLE_IDS_BY_CATEGORY: Partial<Record<OradsTreeResult["categoryNumber"], string[]>> = {
  5: ["orads5_ovarian_cancer"],
};

/**
 * Practice echograms shown after the wizard result ("what a similar case looks like").
 * The category comes from the doctor's answers; an example is kept only when its own
 * O-RADS hint matches that category (modifier entries without a category are kept).
 */
export function getOradsResultExamples(
  path: readonly OradsTreePathStep[],
  result: OradsTreeResult,
): OradsNosologyAtlasEntry[] {
  const ids: string[] = [];
  for (const step of path) {
    ids.push(...(EXAMPLE_IDS_BY_ANSWER[step.nodeId]?.[step.optionId] ?? []));
  }
  ids.push(...(EXAMPLE_IDS_BY_CATEGORY[result.categoryNumber] ?? []));

  const seen = new Set<string>();
  const out: OradsNosologyAtlasEntry[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const entry = getOradsNosologyById(id);
    if (!entry || !getOradsNosologyPreviewImage(entry)) continue;
    const hintCategory = parseOradsCategoryFromHint(entry.oradsHint);
    if (hintCategory !== null && hintCategory !== result.categoryNumber) continue;
    out.push(entry);
  }
  return out;
}
