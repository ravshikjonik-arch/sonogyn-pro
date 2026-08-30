import { z } from "zod";

import { CaseLifecycleStatusSchema } from "./teaching-cases";
import { clinicalPlainText } from "./clinical-validation";

export const CaseConfirmationMethodSchema = z.enum([
  "histology",
  "surgery",
  "mri",
  "ct",
  "genetics",
  "dynamic_observation",
  "expert_consilium",
  "other",
]);
export type CaseConfirmationMethod = z.infer<typeof CaseConfirmationMethodSchema>;

export const CASE_CONFIRMATION_METHOD_LABELS: Record<CaseConfirmationMethod, string> = {
  histology: "Гистология",
  surgery: "Операция",
  mri: "МРТ",
  ct: "КТ",
  genetics: "Генетика",
  dynamic_observation: "Динамическое наблюдение",
  expert_consilium: "Экспертный консилиум",
  other: "Другое",
};

export const CaseLifecycleActionSchema = z.enum([
  "resolve",
  "confirm",
  "archive",
  "reopen",
  "publish_knowledge_base",
]);
export type CaseLifecycleAction = z.infer<typeof CaseLifecycleActionSchema>;

export const CaseLifecycleTransitionBodySchema = z.object({
  action: CaseLifecycleActionSchema,
  confirmationMethod: CaseConfirmationMethodSchema.optional(),
  confirmationMethodOther: clinicalPlainText(500).optional(),
  confirmedDiagnosis: clinicalPlainText(2000).optional(),
  note: clinicalPlainText(500).optional(),
});
export type CaseLifecycleTransitionBody = z.infer<typeof CaseLifecycleTransitionBodySchema>;

/** Product roles for case discussions (derived server-side). */
export const CaseDiscussionRoleSchema = z.enum([
  "author",
  "participant",
  "verified_doctor",
  "expert",
  "moderator",
  "admin",
]);
export type CaseDiscussionRole = z.infer<typeof CaseDiscussionRoleSchema>;

export const REACTION_EMOJI = ["👍", "💡", "❓", "✅"] as const;
export const CaseCommentReactionEmojiSchema = z.enum(REACTION_EMOJI);
export type CaseCommentReactionEmoji = z.infer<typeof CaseCommentReactionEmojiSchema>;

export const TeachingCaseCommentBodySchema = z.object({
  body: z.string().trim().max(5000).nullable().optional(),
  parentCommentId: z.string().uuid().nullable().optional(),
  mentionUserIds: z.array(z.string().uuid()).max(10).optional(),
  media_storage_path: z.string().trim().max(1000).nullable().optional(),
  media_type: z.enum(["image", "video"]).nullable().optional(),
});
export type TeachingCaseCommentBody = z.infer<typeof TeachingCaseCommentBodySchema>;

export const CaseReportBodySchema = z.object({
  commentId: z.string().uuid().optional(),
  reason: clinicalPlainText(1000),
});
export type CaseReportBody = z.infer<typeof CaseReportBodySchema>;

export const CaseLifecycleEventSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  fromStatus: CaseLifecycleStatusSchema.nullable(),
  toStatus: CaseLifecycleStatusSchema,
  actorId: z.string().uuid(),
  note: clinicalPlainText(500).nullable().optional(),
  meta: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
});
export type CaseLifecycleEvent = z.infer<typeof CaseLifecycleEventSchema>;

/** Allowed lifecycle transitions (state machine). */
export const CASE_LIFECYCLE_TRANSITIONS: Record<
  CaseLifecycleAction,
  { from: Array<z.infer<typeof CaseLifecycleStatusSchema>>; to: z.infer<typeof CaseLifecycleStatusSchema> }
> = {
  resolve: { from: ["open", "discussion"], to: "resolved" },
  confirm: { from: ["resolved", "discussion"], to: "confirmed" },
  archive: { from: ["resolved", "confirmed", "discussion", "open"], to: "archived" },
  reopen: { from: ["resolved", "archived"], to: "discussion" },
  publish_knowledge_base: { from: ["confirmed"], to: "confirmed" },
};

export function canTransitionLifecycle(
  from: z.infer<typeof CaseLifecycleStatusSchema>,
  action: CaseLifecycleAction,
): boolean {
  return CASE_LIFECYCLE_TRANSITIONS[action].from.includes(from);
}
