import { z } from "zod";

export const SonoNetPredictionSchema = z.object({
  model: z.string().optional(),
  labelEn: z.string(),
  labelRu: z.string(),
  confidence: z.number(),
  isuogHint: z.string().optional(),
  scanErrors: z.array(z.string()).optional(),
  isStandardPlane: z.boolean().optional(),
});

export type SonoNetPrediction = z.infer<typeof SonoNetPredictionSchema>;

export const UsVisionFrameSchema = z.object({
  mediaId: z.string().uuid(),
  fileName: z.string().optional(),
  planeGuess: z.string().optional(),
  qualityScore: z.number().min(0).max(1).optional(),
  findings: z.array(z.string()).default([]),
  scanErrors: z.array(z.string()).default([]),
  biometryHints: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
  birads: z.string().optional(),
  orads: z.string().optional(),
  sononet: SonoNetPredictionSchema.optional(),
});

export type UsVisionFrame = z.infer<typeof UsVisionFrameSchema>;

export const UsVisionAnalysisResultSchema = z.object({
  modelVersion: z.string(),
  pipeline: z.string(),
  locale: z.literal("ru"),
  disclaimer: z.string(),
  studySummary: z.string(),
  frames: z.array(UsVisionFrameSchema),
  impression: z.string(),
  recommendations: z.array(z.string()),
  mediaIds: z.array(z.string().uuid()),
  clinicalContext: z.string().optional(),
  domain: z.enum(["auto", "fetal", "breast", "gyn", "kidney"]).optional(),
  scorecard: z.string().nullable().optional(),
  cvModels: z.array(z.string()).optional(),
  sononetAvailable: z.boolean().optional(),
  reportMarkdown: z.string().optional(),
});

export type UsVisionAnalysisResult = z.infer<typeof UsVisionAnalysisResultSchema>;

export type CaseMediaForAnalysis = {
  id: string;
  storage_path: string;
  media_type: "image" | "video" | "dicom";
};

export type PreparedVisionFrame = {
  mediaId: string;
  fileName: string;
  mediaType: "image" | "video" | "dicom";
  mimeType: string;
  base64: string;
};
