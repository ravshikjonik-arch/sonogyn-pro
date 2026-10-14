import { z } from "zod";

export const KnowledgeLinkKindSchema = z.enum([
  "calculator",
  "guideline",
  "quiz",
  "atlas",
  "tool",
  "education",
]);

export type KnowledgeLinkKind = z.infer<typeof KnowledgeLinkKindSchema>;

export const KnowledgeLinkMetaSchema = z
  .object({
    kind: KnowledgeLinkKindSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(500).optional(),
  })
  .passthrough();

export type KnowledgeLinkMeta = z.infer<typeof KnowledgeLinkMetaSchema>;

export const KnowledgeLinkRowSchema = z.object({
  id: z.string().uuid(),
  from_type: z.string().min(1).max(64),
  from_id: z.string().min(1).max(256),
  relation: z.string().min(1).max(64),
  to_type: z.string().min(1).max(64),
  to_id: z.string().min(1).max(512),
  weight: z.coerce.number(),
  meta: KnowledgeLinkMetaSchema.optional().nullable(),
});

export type KnowledgeLinkRow = z.infer<typeof KnowledgeLinkRowSchema>;

export const KnowledgeLinksQuerySchema = z.object({
  fromType: z.enum(["nosology", "teaching_case", "module"]),
  fromId: z.string().min(1).max(256),
});

export type KnowledgeLinksQuery = z.infer<typeof KnowledgeLinksQuerySchema>;

/** Client-facing link (matches @repo/clinical-tools KnowledgeLink). */
export const KnowledgeGraphLinkSchema = z.object({
  kind: KnowledgeLinkKindSchema,
  title: z.string(),
  href: z.string(),
  description: z.string().optional(),
});

export type KnowledgeGraphLink = z.infer<typeof KnowledgeGraphLinkSchema>;

export const KnowledgeLinksResponseSchema = z.object({
  ok: z.literal(true),
  fromType: z.string(),
  fromId: z.string(),
  links: z.array(KnowledgeGraphLinkSchema),
  source: z.enum(["db", "merged", "code"]),
});

export type KnowledgeLinksResponse = z.infer<typeof KnowledgeLinksResponseSchema>;
