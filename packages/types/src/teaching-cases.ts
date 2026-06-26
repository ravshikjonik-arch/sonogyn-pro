import { z } from "zod";

export const TeachingCaseStatusSchema = z.enum(["draft", "review", "published", "flagged"]);
export type TeachingCaseStatus = z.infer<typeof TeachingCaseStatusSchema>;

export const TeachingCaseTopicSchema = z.enum(["all", "prolapse"]);
export type TeachingCaseTopic = z.infer<typeof TeachingCaseTopicSchema>;

/** library = channel_id IS NULL; discussions = channel_id IS NOT NULL */
export const TeachingCaseFeedModeSchema = z.enum(["library", "discussions", "all"]);
export type TeachingCaseFeedMode = z.infer<typeof TeachingCaseFeedModeSchema>;

export const CaseLifecycleStatusSchema = z.enum([
  "open",
  "discussion",
  "resolved",
  "confirmed",
  "archived",
]);
export type CaseLifecycleStatus = z.infer<typeof CaseLifecycleStatusSchema>;

export const ListTeachingCasesQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  orads: z.coerce.number().int().min(0).max(5).optional(),
  tags: z.string().trim().max(200).optional(),
  status: TeachingCaseStatusSchema.optional(),
  lifecycle: CaseLifecycleStatusSchema.optional(),
  topic: TeachingCaseTopicSchema.optional(),
  /** Filter by doctor_chat_channels.id (colleague questions). */
  channelId: z.string().uuid().optional(),
  feedMode: TeachingCaseFeedModeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(60).optional(),
  cursor: z.string().trim().max(64).optional(),
});

export type ListTeachingCasesQuery = z.infer<typeof ListTeachingCasesQuerySchema>;

export const TeachingCaseListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  anatomy: z.string().nullable(),
  pathology: z.string().nullable(),
  difficulty: z.string().nullable(),
  status: TeachingCaseStatusSchema,
  is_public: z.boolean(),
  channel_id: z.string().uuid().nullable(),
  created_at: z.string(),
  user_id: z.string().uuid(),
  orads_category: z.number().int().min(0).max(5).nullable(),
  tags: z.array(z.string()),
  lifecycle_status: CaseLifecycleStatusSchema.nullable().optional(),
});

export type TeachingCaseListItem = z.infer<typeof TeachingCaseListItemSchema>;

export const ListTeachingCasesResponseSchema = z.object({
  cases: z.array(TeachingCaseListItemSchema),
  nextCursor: z.string().nullable(),
  meta: z.object({
    topic: TeachingCaseTopicSchema.optional(),
    isModerator: z.boolean().optional(),
  }),
});

export type ListTeachingCasesResponse = z.infer<typeof ListTeachingCasesResponseSchema>;

/** Parse comma-separated tag filter from query string. */
export function parseTeachingCaseTags(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length <= 40)
    .slice(0, 8);
}
