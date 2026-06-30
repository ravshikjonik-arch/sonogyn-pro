import { z } from "zod";

export const SonogynChatImageSchema = z.object({
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  data: z.string().min(16).max(12_000_000),
});

export const SonogynChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(32_000),
});

export const SonogynChatRequestSchema = z.object({
  messages: z.array(SonogynChatMessageSchema).min(1).max(40),
  model: z.string().max(128).optional(),
  stream: z.boolean().default(false),
  images: z.array(SonogynChatImageSchema).max(4).optional(),
  modality: z.enum(["auto", "breast", "ovary", "uterus", "obstetric", "general"]).optional(),
  /** clinical = УЗИ-классификации (default); evidence = EBM retrieval + citations */
  mode: z.enum(["clinical", "evidence"]).default("clinical"),
  /** In clinical mode: append compact live EBM hits to system prompt */
  includeEvidence: z.boolean().optional(),
});

export type SonogynChatRequest = z.infer<typeof SonogynChatRequestSchema>;
