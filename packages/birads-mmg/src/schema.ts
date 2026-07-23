import { z } from "zod";

import type { BiradsCategoryCode, BiradsMmgFindingType } from "./types.js";

const findingTypeSchema = z.enum([
  "negative",
  "mass",
  "calcifications",
  "asymmetry",
  "architectural_distortion",
  "associated_only",
]) satisfies z.ZodType<BiradsMmgFindingType>;

const categorySchema = z.enum(["0", "1", "2", "3", "4A", "4B", "4C", "5", "6"]) satisfies z.ZodType<BiradsCategoryCode>;

/** Zod на границе API / форм — BI-RADS Mammography. */
export const BiradsMmgInputSchema = z.object({
  breastComposition: z.string().optional(),
  findingType: findingTypeSchema,
  localizationText: z.string().max(500).optional(),
  massShape: z.string().optional(),
  massMargin: z.string().optional(),
  massDensity: z.string().optional(),
  calcMorphology: z.string().optional(),
  calcDistribution: z.string().optional(),
  asymmetryType: z.string().optional(),
  associatedFeatures: z.array(z.string()).max(20).optional(),
  comparison: z.string().optional(),
  biradsCategoryManual: categorySchema.optional(),
  conclusionDraft: z.string().max(4000).optional(),
});

export type BiradsMmgInputParsed = z.infer<typeof BiradsMmgInputSchema>;
