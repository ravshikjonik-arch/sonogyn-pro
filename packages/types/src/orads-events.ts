import { z } from "zod";

export const OradsAssistPlatformSchema = z.enum(["web", "mobile"]);
export type OradsAssistPlatform = z.infer<typeof OradsAssistPlatformSchema>;

export const OradsMenopauseSourceSchema = z.enum(["text", "ui", "profile"]);
export type OradsMenopauseSource = z.infer<typeof OradsMenopauseSourceSchema>;

export const OradsAgeSourceSchema = z.enum(["text", "profile"]);
export type OradsAgeSource = z.infer<typeof OradsAgeSourceSchema>;

export const OradsProtocolDraftSourceSchema = z.enum(["local", "protocol-ai", "none"]);
export type OradsProtocolDraftSource = z.infer<typeof OradsProtocolDraftSourceSchema>;

export const OradsWizardHintSchema = z.object({
  nodeId: z.string().min(1).max(120),
  optionId: z.string().min(1).max(120),
  confidence: z.enum(["low", "medium", "high"]).optional(),
});

export const OradsTreePathStepSchema = z.object({
  nodeId: z.string().min(1).max(120),
  optionId: z.string().min(1).max(120),
});

export const CreateOradsEventBodySchema = z.object({
  platform: OradsAssistPlatformSchema,
  sourceText: z.string().min(8).max(8000),
  extracted: z.record(z.string(), z.unknown()),
  hints: z.array(OradsWizardHintSchema).max(64),
  unresolvedNodes: z.array(z.string().max(120)).max(32),
  aiCategoryNumber: z.number().int().min(0).max(5).nullable(),
  aiCompletePath: z.array(OradsTreePathStepSchema).max(32).nullable().optional(),
  ageYears: z.number().int().min(0).max(130).nullable().optional(),
  ageSource: OradsAgeSourceSchema.nullable().optional(),
  menopause: z.enum(["pre", "post"]).nullable().optional(),
  menopauseSource: OradsMenopauseSourceSchema.nullable().optional(),
  protocolDraft: z.string().max(12000).nullable().optional(),
  protocolDraftSource: OradsProtocolDraftSourceSchema.optional(),
  patientId: z.string().uuid().optional(),
  studyId: z.string().uuid().optional(),
});
export type CreateOradsEventBody = z.infer<typeof CreateOradsEventBodySchema>;

export const OradsEventFeedbackBodySchema = z.object({
  feedbackCorrect: z.boolean(),
  manualCategoryNumber: z.number().int().min(1).max(5).optional(),
  feedbackNote: z.string().max(500).optional(),
});
export type OradsEventFeedbackBody = z.infer<typeof OradsEventFeedbackBodySchema>;
