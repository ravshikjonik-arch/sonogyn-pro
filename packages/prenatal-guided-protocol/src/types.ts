import { z } from "zod";

/** Fine GA windows for guided scan (beyond coarse trimester). */
export const GuidedWindowIdSchema = z.enum([
  "early",
  "t1_screening",
  "t2_anomaly",
  "t3_growth",
  "between_windows",
]);
export type GuidedWindowId = z.infer<typeof GuidedWindowIdSchema>;

export const GuidedStepKindSchema = z.enum(["look", "measure", "red_flag"]);
export type GuidedStepKind = z.infer<typeof GuidedStepKindSchema>;

export const GuidedStepSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  kind: GuidedStepKindSchema,
  titleRu: z.string().min(1),
  hintRu: z.string().min(1),
  fieldKeys: z.array(z.string()).default([]),
  required: z.boolean().default(true),
});
export type GuidedStep = z.infer<typeof GuidedStepSchema>;

export const GuidedWindowMetaSchema = z.object({
  id: GuidedWindowIdSchema,
  labelRu: z.string(),
  gaLabelRu: z.string(),
  /** Inclusive lower bound in whole days from LMP-equivalent GA. */
  gaDaysMin: z.number().int(),
  /** Inclusive upper bound; null = open-ended. */
  gaDaysMax: z.number().int().nullable(),
  sourceNoteRu: z.string(),
});
export type GuidedWindowMeta = z.infer<typeof GuidedWindowMetaSchema>;

/** Coarse trimester map — compatibility with obstetric-expert checklists. */
export const ProtocolWindowSchema = z.enum([
  "first_trimester",
  "second_trimester",
  "third_trimester",
]);
export type ProtocolWindow = z.infer<typeof ProtocolWindowSchema>;

export const ProtocolChecklistSchema = z.object({
  window: ProtocolWindowSchema,
  labelRu: z.string(),
  visualize: z.array(z.string()),
  measure: z.array(z.string()),
  mustNotMiss: z.array(z.string()),
});
export type ProtocolChecklist = z.infer<typeof ProtocolChecklistSchema>;

export const CDS_DISCLAIMER_RU =
  "Справочный протокол CDS (SonoGyn Guided). Не диагноз и не официальный бланк ДЗМ/Astraia. " +
  "Ориентир: ISUOG + структура пренатального скрининга ДЗМ. Решение и формулировки — за врачом; сверьте с локальным протоколом ЛПУ.";
