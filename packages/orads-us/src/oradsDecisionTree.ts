/**
 * ACR O-RADS US v2022 — wizard decision tree (data only, no UI).
 * Thresholds: solid/pp ≥3 mm; ≥4 pp → O-RADS 5; IOTA color score 1–4.
 */
import { oradsResult } from "./results";
import type { OradsDecisionNode } from "./types";

const R = oradsResult;

/** Optional entry: technically inadequate assessment. */
export const STEP0_TECHNICAL: OradsDecisionNode = {
  id: "step0_technical",
  questionKey: "orads.step0.technical.question",
  helpKey: "orads.step0.technical.help",
  options: [
    {
      id: "adequate",
      labelKey: "orads.step0.technical.option.adequate",
      next: "step1_localization",
    },
    {
      id: "inadequate",
      labelKey: "orads.step0.technical.option.inadequate",
      result: R(0, "orads.management.0", "orads.rationale.0_inadequate"),
    },
  ],
};

export const ORADS_DECISION_TREE: Record<string, OradsDecisionNode> = {
  step0_technical: STEP0_TECHNICAL,

  step1_localization: {
    id: "step1_localization",
    questionKey: "orads.step1.localization.question",
    helpKey: "orads.step1.localization.help",
    imageRef: "atlas/localization",
    options: [
      {
        id: "ovarian",
        labelKey: "orads.step1.localization.option.ovarian",
        next: "step2_menopause",
        imageRef: "atlas/ovarian",
      },
      {
        id: "extraovarian",
        labelKey: "orads.step1.localization.option.extraovarian",
        next: "step1_extraovarian",
        imageRef: "atlas/extraovarian",
      },
    ],
  },

  step1_extraovarian: {
    id: "step1_extraovarian",
    questionKey: "orads.step1.extraovarian.question",
    helpKey: "orads.step1.extraovarian.help",
    options: [
      {
        id: "paraovarian",
        labelKey: "orads.step1.extraovarian.option.paraovarian",
        result: R(2, "orads.management.2_extraovarian", "orads.rationale.2_extraovarian_typical"),
        imageRef: "atlas/extraovarian/paraovarian",
      },
      {
        id: "hydrosalpinx",
        labelKey: "orads.step1.extraovarian.option.hydrosalpinx",
        result: R(2, "orads.management.2_extraovarian", "orads.rationale.2_extraovarian_typical"),
        imageRef: "atlas/extraovarian/hydrosalpinx",
      },
      {
        id: "peritoneal_inclusion",
        labelKey: "orads.step1.extraovarian.option.peritoneal_inclusion",
        result: R(2, "orads.management.2_extraovarian", "orads.rationale.2_extraovarian_typical"),
        imageRef: "atlas/extraovarian/peritoneal_inclusion",
      },
      {
        id: "atypical",
        labelKey: "orads.step1.extraovarian.option.atypical",
        result: R(3, "orads.management.3", "orads.rationale.3_extraovarian_atypical"),
      },
    ],
  },

  step2_menopause: {
    id: "step2_menopause",
    questionKey: "orads.step2.menopause.question",
    options: [
      { id: "pre", labelKey: "orads.step2.menopause.option.pre", next: "step2_lesion_class" },
      { id: "post", labelKey: "orads.step2.menopause.option.post", next: "step2_lesion_class" },
    ],
  },

  step2_lesion_class: {
    id: "step2_lesion_class",
    questionKey: "orads.step2.lesion_class.question",
    helpKey: "orads.step2.lesion_class.help",
    options: [
      {
        id: "normal",
        labelKey: "orads.step2.lesion_class.option.normal",
        result: R(1, "orads.management.1", "orads.rationale.1_normal"),
      },
      {
        id: "physiological",
        labelKey: "orads.step2.lesion_class.option.physiological",
        next: "step2_physiological_size",
        imageRef: "atlas/physiologic",
      },
      {
        id: "simple",
        labelKey: "orads.step2.lesion_class.option.simple",
        next: "step3_simple_wall",
        imageRef: "atlas/simple_cyst",
      },
      {
        id: "nonsimple",
        labelKey: "orads.step2.lesion_class.option.nonsimple",
        next: "step3_locularity",
      },
      {
        id: "solid",
        labelKey: "orads.step2.lesion_class.option.solid",
        next: "step4_solid_dominant_contour",
        imageRef: "atlas/solid_dominant",
      },
    ],
  },

  step2_physiological_size: {
    id: "step2_physiological_size",
    questionKey: "orads.step2.physiological_size.question",
    helpKey: "orads.step2.physiological_size.help",
    options: [
      {
        id: "le3cm",
        labelKey: "orads.step2.physiological_size.option.le3cm",
        result: R(1, "orads.management.1", "orads.rationale.1_physiologic"),
      },
      {
        id: "gt3cm",
        labelKey: "orads.step2.physiological_size.option.gt3cm",
        result: R(2, "orads.management.2_simple", "orads.rationale.2_simple_pre"),
      },
    ],
  },

  step3_simple_wall: {
    id: "step3_simple_wall",
    questionKey: "orads.step3.simple_wall.question",
    options: [
      {
        id: "typical",
        labelKey: "orads.step3.simple_wall.option.typical",
        next: "step3_simple_size",
      },
      {
        id: "atypical",
        labelKey: "orads.step3.simple_wall.option.atypical",
        next: "step3_locularity",
      },
    ],
  },

  step3_simple_size: {
    id: "step3_simple_size",
    questionKey: "orads.step3.simple_size.question",
    helpKey: "orads.step3.simple_size.help",
    options: [
      {
        id: "pre_le3",
        labelKey: "orads.step3.simple_size.option.pre_le3",
        next: "step3_simple_size_pre_le3",
      },
      {
        id: "pre_gt3_le5",
        labelKey: "orads.step3.simple_size.option.pre_gt3_le5",
        result: R(2, "orads.management.2_simple", "orads.rationale.2_simple_pre"),
      },
      {
        id: "pre_gt5_lt10",
        labelKey: "orads.step3.simple_size.option.pre_gt5_lt10",
        result: R(2, "orads.management.2_simple", "orads.rationale.2_simple_pre"),
      },
      {
        id: "pre_ge10",
        labelKey: "orads.step3.simple_size.option.pre_ge10",
        result: R(3, "orads.management.3", "orads.rationale.3_large_smooth_cyst"),
      },
      {
        id: "post_le3",
        labelKey: "orads.step3.simple_size.option.post_le3",
        result: R(2, "orads.management.2_simple", "orads.rationale.2_simple_post_small"),
      },
      {
        id: "post_gt3_le5",
        labelKey: "orads.step3.simple_size.option.post_gt3_le5",
        result: R(2, "orads.management.2_simple", "orads.rationale.2_simple_post_small"),
      },
      {
        id: "post_gt5",
        labelKey: "orads.step3.simple_size.option.post_gt5",
        result: R(3, "orads.management.3", "orads.rationale.3_simple_post_large"),
      },
    ],
  },

  step3_simple_size_pre_le3: {
    id: "step3_simple_size_pre_le3",
    questionKey: "orads.step3.simple_size_pre_le3.question",
    options: [
      {
        id: "cyst",
        labelKey: "orads.step3.simple_size_pre_le3.option.cyst",
        result: R(2, "orads.management.2_simple", "orads.rationale.2_simple_pre"),
      },
      {
        id: "follicle",
        labelKey: "orads.step3.simple_size_pre_le3.option.follicle",
        result: R(1, "orads.management.1", "orads.rationale.1_physiologic"),
      },
    ],
  },

  step3_locularity: {
    id: "step3_locularity",
    questionKey: "orads.step3.locularity.question",
    helpKey: "orads.step3.locularity.help",
    options: [
      { id: "unilocular", labelKey: "orads.step3.locularity.option.unilocular", next: "step3_unilocular_wall" },
      { id: "bilocular", labelKey: "orads.step3.locularity.option.bilocular", next: "step3_bilocular_wall" },
      { id: "multilocular", labelKey: "orads.step3.locularity.option.multilocular", next: "step3_multilocular_wall" },
    ],
  },

  step3_unilocular_wall: {
    id: "step3_unilocular_wall",
    questionKey: "orads.step3.unilocular_wall.question",
    options: [
      { id: "smooth", labelKey: "orads.step3.unilocular_wall.option.smooth", next: "step3_unilocular_classic" },
      {
        id: "irregular",
        labelKey: "orads.step3.unilocular_wall.option.irregular",
        next: "step3_unilocular_irregular_nodule",
      },
    ],
  },

  step3_unilocular_classic: {
    id: "step3_unilocular_classic",
    questionKey: "orads.step3.unilocular_classic.question",
    options: [
      { id: "classic", labelKey: "orads.step3.unilocular_classic.option.classic", next: "step3_classic_size" },
      {
        id: "non_classic",
        labelKey: "orads.step3.unilocular_classic.option.non_classic",
        next: "step3_unilocular_nonsimple_size",
      },
    ],
  },

  step3_classic_size: {
    id: "step3_classic_size",
    questionKey: "orads.step3.classic_size.question",
    options: [
      {
        id: "lt10",
        labelKey: "orads.step3.classic_size.option.lt10",
        result: R(2, "orads.management.2_classic", "orads.rationale.2_classic_benign"),
        imageRef: "atlas/classic_benign",
      },
      {
        id: "ge10",
        labelKey: "orads.step3.classic_size.option.ge10",
        result: R(3, "orads.management.3", "orads.rationale.3_large_smooth_cyst"),
      },
    ],
  },

  step3_unilocular_nonsimple_size: {
    id: "step3_unilocular_nonsimple_size",
    questionKey: "orads.step3.unilocular_nonsimple_size.question",
    options: [
      {
        id: "lt10",
        labelKey: "orads.step3.unilocular_nonsimple_size.option.lt10",
        next: "step4_solid_presence",
      },
      {
        id: "ge10",
        labelKey: "orads.step3.unilocular_nonsimple_size.option.ge10",
        next: "step4_solid_presence",
      },
    ],
  },

  step3_bilocular_wall: {
    id: "step3_bilocular_wall",
    questionKey: "orads.step3.bilocular_wall.question",
    options: [
      { id: "smooth", labelKey: "orads.step3.bilocular_wall.option.smooth", next: "step3_bilocular_size" },
      {
        id: "irregular",
        labelKey: "orads.step3.bilocular_wall.option.irregular",
        result: R(4, "orads.management.4", "orads.rationale.4_bilocular_irregular"),
      },
    ],
  },

  step3_bilocular_size: {
    id: "step3_bilocular_size",
    questionKey: "orads.step3.bilocular_size.question",
    options: [
      {
        id: "le3",
        labelKey: "orads.step3.bilocular_size.option.le3",
        result: R(2, "orads.management.2_bilocular", "orads.rationale.2_bilocular_smooth"),
      },
      {
        id: "gt3_lt10",
        labelKey: "orads.step3.bilocular_size.option.gt3_lt10",
        result: R(3, "orads.management.3", "orads.rationale.3_multilocular_smooth_lt10"),
      },
      {
        id: "ge10",
        labelKey: "orads.step3.bilocular_size.option.ge10",
        result: R(4, "orads.management.4", "orads.rationale.4_multilocular_smooth_ge10"),
      },
    ],
  },

  step3_multilocular_wall: {
    id: "step3_multilocular_wall",
    questionKey: "orads.step3.multilocular_wall.question",
    options: [
      { id: "smooth", labelKey: "orads.step3.multilocular_wall.option.smooth", next: "step3_multilocular_solid_gate" },
      {
        id: "irregular",
        labelKey: "orads.step3.multilocular_wall.option.irregular",
        next: "step3_multilocular_irregular_solid_gate",
      },
    ],
  },

  step3_multilocular_solid_gate: {
    id: "step3_multilocular_solid_gate",
    questionKey: "orads.step3.multilocular_solid_gate.question",
    options: [
      { id: "no_solid", labelKey: "orads.step3.multilocular_solid_gate.option.no_solid", next: "step3_multilocular_size" },
      {
        id: "with_solid",
        labelKey: "orads.step3.multilocular_solid_gate.option.with_solid",
        next: "step5_multilocular_solid_cs",
      },
    ],
  },

  step3_multilocular_irregular_solid_gate: {
    id: "step3_multilocular_irregular_solid_gate",
    questionKey: "orads.step3.multilocular_solid_gate.question",
    options: [
      {
        id: "no_solid",
        labelKey: "orads.step3.multilocular_solid_gate.option.no_solid",
        result: R(4, "orads.management.4", "orads.rationale.4_multilocular_irregular"),
      },
      {
        id: "with_solid",
        labelKey: "orads.step3.multilocular_solid_gate.option.with_solid",
        next: "step5_multilocular_solid_cs",
      },
    ],
  },

  step3_multilocular_size: {
    id: "step3_multilocular_size",
    questionKey: "orads.step3.multilocular_size.question",
    helpKey: "orads.step3.multilocular_size.help",
    options: [
      {
        id: "lt10",
        labelKey: "orads.step3.multilocular_size.option.lt10",
        result: R(3, "orads.management.3", "orads.rationale.3_multilocular_smooth_lt10"),
      },
      {
        id: "ge10_cs_lt4",
        labelKey: "orads.step3.multilocular_size.option.ge10_cs_lt4",
        result: R(4, "orads.management.4", "orads.rationale.4_multilocular_smooth_ge10"),
      },
      {
        id: "any_cs4",
        labelKey: "orads.step3.multilocular_size.option.any_cs4",
        result: R(4, "orads.management.4", "orads.rationale.4_multilocular_cs4"),
      },
    ],
  },

  step3_unilocular_irregular_nodule: {
    id: "step3_unilocular_irregular_nodule",
    questionKey: "orads.step4.solid_height.question",
    helpKey: "orads.step4.solid_height.help",
    imageRef: "atlas/irregular_wall",
    options: [
      {
        id: "lt3mm",
        labelKey: "orads.step4.solid_height.option.lt3mm",
        result: R(3, "orads.management.3", "orads.rationale.3_unilocular_irregular"),
      },
      {
        id: "ge3mm",
        labelKey: "orads.step4.solid_height.option.ge3mm",
        next: "step4_papillary_count",
      },
    ],
  },

  step4_solid_height: {
    id: "step4_solid_height",
    questionKey: "orads.step4.solid_height.question",
    helpKey: "orads.step4.solid_height.help",
    options: [
      {
        id: "lt3mm",
        labelKey: "orads.step4.solid_height.option.lt3mm",
        next: "step3_unilocular_nonsimple_no_solid",
      },
      {
        id: "ge3mm",
        labelKey: "orads.step4.solid_height.option.ge3mm",
        next: "step4_papillary_count",
      },
    ],
  },

  step4_solid_presence: {
    id: "step4_solid_presence",
    questionKey: "orads.step4.solid_presence.question",
    helpKey: "orads.step4.solid_presence.help",
    options: [
      {
        id: "absent",
        labelKey: "orads.step4.solid_presence.option.absent",
        next: "step3_unilocular_nonsimple_no_solid",
      },
      {
        id: "present",
        labelKey: "orads.step4.solid_presence.option.present",
        next: "step4_solid_height",
      },
    ],
  },

  step3_unilocular_nonsimple_no_solid: {
    id: "step3_unilocular_nonsimple_no_solid",
    questionKey: "orads.step3.unilocular_nonsimple_size.question",
    options: [
      {
        id: "lt10",
        labelKey: "orads.step3.unilocular_nonsimple_size.option.lt10",
        result: R(2, "orads.management.2_classic", "orads.rationale.2_classic_benign"),
      },
      {
        id: "ge10",
        labelKey: "orads.step3.unilocular_nonsimple_size.option.ge10",
        result: R(3, "orads.management.3", "orads.rationale.3_large_smooth_cyst"),
      },
    ],
  },

  step4_papillary_count: {
    id: "step4_papillary_count",
    questionKey: "orads.step4.papillary_count.question",
    helpKey: "orads.step4.papillary_count.help",
    options: [
      { id: "lt4", labelKey: "orads.step4.papillary_count.option.lt4", next: "step4_solid_contour" },
      {
        id: "ge4",
        labelKey: "orads.step4.papillary_count.option.ge4",
        result: R(5, "orads.management.5", "orads.rationale.5_unilocular_ge4pp"),
        imageRef: "atlas/papillary_4plus",
      },
    ],
  },

  step4_solid_contour: {
    id: "step4_solid_contour",
    questionKey: "orads.step4.solid_contour.question",
    options: [
      { id: "smooth", labelKey: "orads.step4.solid_contour.option.smooth", next: "step5_cystic_solid_cs" },
      { id: "irregular", labelKey: "orads.step4.solid_contour.option.irregular", next: "step5_cystic_solid_cs" },
    ],
  },

  step4_solid_dominant_contour: {
    id: "step4_solid_dominant_contour",
    questionKey: "orads.step4.solid_dominant_contour.question",
    options: [
      { id: "smooth", labelKey: "orads.step4.solid_dominant_contour.option.smooth", next: "step4_solid_shadowing" },
      {
        id: "irregular",
        labelKey: "orads.step4.solid_dominant_contour.option.irregular",
        result: R(5, "orads.management.5", "orads.rationale.5_solid_irregular"),
      },
    ],
  },

  step4_solid_shadowing: {
    id: "step4_solid_shadowing",
    questionKey: "orads.step4.solid_shadowing.question",
    options: [
      { id: "with", labelKey: "orads.step4.solid_shadowing.option.with", next: "step5_dominant_solid_cs_shadow" },
      { id: "without", labelKey: "orads.step4.solid_shadowing.option.without", next: "step5_dominant_solid_cs" },
    ],
  },

  step5_cystic_solid_cs: {
    id: "step5_cystic_solid_cs",
    questionKey: "orads.step5.color_score.question",
    helpKey: "orads.step5.color_score.help",
    options: [
      {
        id: "cs12",
        labelKey: "orads.step5.color_score.option.cs12",
        result: R(4, "orads.management.4", "orads.rationale.4_cystic_solid_cs12"),
      },
      {
        id: "cs34",
        labelKey: "orads.step5.color_score.option.cs34",
        result: R(5, "orads.management.5", "orads.rationale.5_cystic_solid_cs34"),
      },
    ],
  },

  step5_multilocular_solid_cs: {
    id: "step5_multilocular_solid_cs",
    questionKey: "orads.step5.color_score.question",
    helpKey: "orads.step5.color_score.help",
    options: [
      {
        id: "cs12",
        labelKey: "orads.step5.color_score.option.cs12",
        result: R(4, "orads.management.4", "orads.rationale.4_cystic_solid_cs12"),
      },
      {
        id: "cs34",
        labelKey: "orads.step5.color_score.option.cs34",
        result: R(5, "orads.management.5", "orads.rationale.5_cystic_solid_cs34"),
      },
    ],
  },

  step5_dominant_solid_cs: {
    id: "step5_dominant_solid_cs",
    questionKey: "orads.step5.color_score.question",
    helpKey: "orads.step5.color_score.help",
    options: [
      {
        id: "cs1",
        labelKey: "orads.step5.color_score.option.cs1",
        result: R(3, "orads.management.3_solid", "orads.rationale.3_solid_smooth_cs1"),
      },
      {
        id: "cs23",
        labelKey: "orads.step5.color_score.option.cs23",
        result: R(4, "orads.management.4", "orads.rationale.4_solid_smooth_cs23"),
      },
      {
        id: "cs4",
        labelKey: "orads.step5.color_score.option.cs4",
        result: R(5, "orads.management.5", "orads.rationale.5_cystic_solid_cs34"),
      },
    ],
  },

  step5_dominant_solid_cs_shadow: {
    id: "step5_dominant_solid_cs_shadow",
    questionKey: "orads.step5.color_score.question",
    helpKey: "orads.step5.color_score.help",
    options: [
      {
        id: "cs23",
        labelKey: "orads.step5.color_score.option.cs23",
        result: R(3, "orads.management.3_solid", "orads.rationale.3_solid_shadow_cs23"),
      },
      {
        id: "cs4",
        labelKey: "orads.step5.color_score.option.cs4",
        result: R(5, "orads.management.5", "orads.rationale.5_cystic_solid_cs34"),
      },
    ],
  },

  step_modifier_ascites: {
    id: "step_modifier_ascites",
    questionKey: "orads.modifier.ascites.question",
    helpKey: "orads.modifier.ascites.help",
    options: [
      {
        id: "ascites",
        labelKey: "orads.modifier.ascites.option.ascites",
        result: R(5, "orads.management.5", "orads.rationale.5_ascites_peritoneal"),
      },
      {
        id: "both",
        labelKey: "orads.modifier.ascites.option.both",
        result: R(5, "orads.management.5", "orads.rationale.5_ascites_peritoneal"),
      },
    ],
  },
};

export const ORADS_TREE_ROOT_ID = "step1_localization";
export const ORADS_TREE_OPTIONAL_ENTRY_ID = "step0_technical";

export const ORADS_DECISION_TREE_NODES = Object.values(ORADS_DECISION_TREE);

export function getOradsDecisionNode(nodeId: string): OradsDecisionNode | undefined {
  return ORADS_DECISION_TREE[nodeId];
}
