import { z } from "zod";

import { DEFAULT_REGION, RegionCodeSchema } from "./regions";

/** Manual mark only — never auto-complete. */
export const ItemStatusSchema = z.enum(["empty", "done", "not_indicated"]);
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

export const ChecklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  allowsNote: z.boolean().default(false),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const ChecklistSubsectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  items: z.array(ChecklistItemSchema).min(1),
});
export type ChecklistSubsection = z.infer<typeof ChecklistSubsectionSchema>;

export const ChecklistSectionSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  hint: z.string().optional(),
  subsections: z.array(ChecklistSubsectionSchema).optional(),
  items: z.array(ChecklistItemSchema).optional(),
});
export type ChecklistSection = z.infer<typeof ChecklistSectionSchema>;

export const ItemStateSchema = z.object({
  status: ItemStatusSchema,
  note: z.string().optional(),
});
export type ItemState = z.infer<typeof ItemStateSchema>;

export const VisitViewSchema = z.enum(["hub", "checklist", "scenarios", "regulatory", "summary"]);
export type VisitView = z.infer<typeof VisitViewSchema>;

/** Doctor-local draft — no patient id / PHI. */
export const AmbulatoryIntakeDraftSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]).default(2),
  updatedAt: z.string(),
  regionCode: RegionCodeSchema.default(DEFAULT_REGION),
  reasonIds: z.array(z.string()).default([]),
  importantOnly: z.boolean().default(false),
  itemStates: z.record(ItemStateSchema),
  labStates: z.record(ItemStateSchema).default({}),
  chartFields: z.record(z.string()).default({}),
  view: VisitViewSchema.default("hub"),
});
export type AmbulatoryIntakeDraft = z.infer<typeof AmbulatoryIntakeDraftSchema>;

export function emptyItemState(): ItemState {
  return { status: "empty" };
}

export function createEmptyDraft(): AmbulatoryIntakeDraft {
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    regionCode: DEFAULT_REGION,
    reasonIds: [],
    importantOnly: false,
    itemStates: {},
    labStates: {},
    chartFields: {},
    view: "hub",
  };
}

export function createDraftForReasons(reasonIds: string[]): AmbulatoryIntakeDraft {
  const draft = createEmptyDraft();
  draft.reasonIds = reasonIds;
  draft.view = "checklist";
  for (const id of reasonIds) {
    draft.itemStates[`reason.${id}`] = { status: "done" };
  }
  return draft;
}
