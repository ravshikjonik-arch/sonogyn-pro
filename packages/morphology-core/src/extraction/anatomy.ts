import type { MorphologyAnatomy } from "../types";
import type { AnatomicalSite } from "./types";

/**
 * Which registry anatomy a text site may legitimately map to. Sites with no entry
 * (endometrium, cervix, other) have no registered features yet → unresolved.
 */
export const SITE_TO_ANATOMY: Record<AnatomicalSite, readonly MorphologyAnatomy[]> = {
  ovary: ["adnexa"],
  fallopian_tube: ["adnexa"],
  adnexa: ["adnexa"],
  pelvis: ["pelvis"],
  uterus: ["uterus"],
  myometrium: ["uterus"],
  endometrium: [],
  cervix: [],
  breast: ["breast"],
  thyroid: ["thyroid"],
  neck_lymph_node: ["neck_lymph_nodes"],
  other: [],
};

/** Anatomies where laterality is meaningful for a single finding. */
export const LATERAL_ANATOMIES: readonly MorphologyAnatomy[] = ["adnexa", "breast", "thyroid", "neck_lymph_nodes"];

export function siteAllowsAnatomy(site: AnatomicalSite, anatomy: MorphologyAnatomy): boolean {
  return SITE_TO_ANATOMY[site].includes(anatomy);
}
