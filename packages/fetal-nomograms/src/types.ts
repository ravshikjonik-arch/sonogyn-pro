import { z } from "zod";

export const nomogramCategorySchema = z.enum([
  "first_trimester",
  "second_third_trimester",
  "doppler",
  "fluid",
  "neurosonography",
  "fetal_echo",
]);

export type NomogramCategory = z.infer<typeof nomogramCategorySchema>;

export const xAxisTypeSchema = z.enum(["ga_weeks", "ga_days", "crl_range_mm"]);

export const nomogramRowSchema = z
  .object({
    ga: z.string().optional(),
    ga_weeks: z.number().int().optional(),
    crl_min: z.number().optional(),
    crl_max: z.number().optional(),
    p5: z.number().optional(),
    p50: z.number().optional(),
    p95: z.number().optional(),
    p2_5: z.number().optional(),
    p97_5: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    mean_low: z.number().optional(),
    mean_high: z.number().optional(),
    median: z.number().optional(),
    mom_1_5: z.number().optional(),
  })
  .passthrough();

export const nomogramSchema = z.object({
  id: z.string(),
  key: z.string(),
  title: z.string(),
  source: z.string().optional(),
  category: nomogramCategorySchema,
  unit: z.string(),
  percentiles: z.array(z.number()).optional(),
  fields: z.array(z.string()).optional(),
  x_axis: z.object({
    type: xAxisTypeSchema,
    label: z.string(),
  }),
  rows: z.array(nomogramRowSchema).min(1),
});

export const scoringSystemSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string().optional(),
  threshold: z
    .object({
      min_score_for_karyotyping: z.number(),
      note: z.string().optional(),
    })
    .optional(),
  items: z.array(
    z.object({
      sign: z.string(),
      score: z.number(),
    }),
  ),
});

export const nomogramDatasetSchema = z.object({
  meta: z.object({
    project: z.string().optional(),
    version: z.string().optional(),
    description: z.string().optional(),
    sources_authors: z.array(z.string()).optional(),
    units_note: z.string().optional(),
  }),
  nomograms: z.array(nomogramSchema).min(1),
  scoring_systems: z.array(scoringSystemSchema).optional(),
  clinical_definitions: z
    .array(
      z.object({
        term: z.string(),
        definition: z.string(),
      }),
    )
    .optional(),
});

export type NomogramRow = z.infer<typeof nomogramRowSchema>;
export type Nomogram = z.infer<typeof nomogramSchema>;
export type NomogramDataset = z.infer<typeof nomogramDatasetSchema>;
export type ScoringSystem = z.infer<typeof scoringSystemSchema>;

export type NomogramPercentileZone = "BELOW_P5" | "P5_P50" | "P50_P95" | "ABOVE_P95";

export type NomogramSpecialZone =
  | "BELOW_MIN"
  | "LOW_MEAN"
  | "WITHIN_MEAN"
  | "HIGH_MEAN"
  | "ABOVE_MAX"
  | "BELOW_MOM_THRESHOLD"
  | "AT_OR_ABOVE_MOM_THRESHOLD";

export type EvaluateNomogramInput = {
  nomogramId: string;
  /** Дробный срок в неделях (нед + дни/7) */
  gaWeeksDecimal?: number;
  crlMm?: number;
  value: number;
};

export type EvaluateNomogramResult = {
  ok: boolean;
  nomogramId: string;
  key: string;
  title: string;
  unit: string;
  source?: string;
  value: number;
  flag: NomogramPercentileZone | NomogramSpecialZone | "unknown" | "out_of_range";
  summary: string;
  percentileLabels?: { low: string; mid: string; high: string };
  interpolated?: {
    p5?: number;
    p50?: number;
    p95?: number;
    min?: number;
    mean_low?: number;
    mean_high?: number;
    max?: number;
    median?: number;
    mom_1_5?: number;
  };
  gaUsed?: { weeksDecimal?: number; gaDaysString?: string; crlMm?: number };
  warning?: "OUT_OF_RANGE";
};
