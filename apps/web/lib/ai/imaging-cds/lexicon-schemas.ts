import { z } from "zod";

/** Assistive lexicon feature — not a final category. */
export const LexiconFeatureSchema = z.object({
  id: z.string().min(1),
  labelRu: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  confidence: z.number().min(0).max(1).optional(),
  notAssessableOnFrame: z.boolean().optional(),
  evidenceRef: z.string().optional(),
});

export const GynLexiconFeatureIds = [
  "lesion_locularity",
  "max_diameter_mm",
  "solid_component_present",
  "solid_component_mm",
  "papillary_projection_count",
  "inner_wall_contour",
  "septa_thickness",
  "color_score",
  "acoustic_shadow",
  "ascites",
  "typical_benign_pattern",
] as const;

export const BreastLexiconFeatureIds = [
  "shape",
  "orientation",
  "margin",
  "echo_pattern",
  "posterior_features",
  "vascularity",
  "non_mass",
] as const;

export type LexiconFeature = z.infer<typeof LexiconFeatureSchema>;
