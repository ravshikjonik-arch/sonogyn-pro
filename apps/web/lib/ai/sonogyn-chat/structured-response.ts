import { z } from "zod";

/** Схема структурированного ответа — расширяйте под новые органы/классификации */
export const SonogynStructuredResponseSchema = z.object({
  modality: z
    .enum(["ultrasound_breast", "ultrasound_pelvis", "ultrasound_thyroid", "ultrasound_obstetric", "other"])
    .optional(),
  organ: z.string().optional(),
  findings_summary_ru: z.string().optional(),
  classification_system: z.enum(["BI-RADS", "O-RADS US", "ADNEX", "IOTA", "TI-RADS", "FMF", "none"]).optional(),
  category: z.string().optional(),
  criteria_met_ru: z.array(z.string()).optional(),
  differential_diagnosis_ru: z
    .array(z.object({ name_ru: z.string(), distinguishing_features_ru: z.string() }))
    .optional(),
  recommendation_ru: z.string().optional(),
  confidence_caveat_ru: z.string().optional(),
});

export type SonogynStructuredResponse = z.infer<typeof SonogynStructuredResponseSchema>;

export const STRUCTURED_RESPONSE_JSON_HINT = `\`\`\`sonogyn-json
{
  "modality": "ultrasound_pelvis",
  "organ": "яичник",
  "findings_summary_ru": "...",
  "classification_system": "O-RADS US",
  "category": "O-RADS 4",
  "criteria_met_ru": ["..."],
  "differential_diagnosis_ru": [{"name_ru": "...", "distinguishing_features_ru": "..."}],
  "recommendation_ru": "...",
  "confidence_caveat_ru": "..."
}
\`\`\``;

const JSON_BLOCK_RE = /```(?:sonogyn-json|json)\s*([\s\S]*?)```/i;

export function extractStructuredFromAssistantText(text: string): {
  displayText: string;
  structured: SonogynStructuredResponse | null;
} {
  const match = text.match(JSON_BLOCK_RE);
  if (!match) {
    return { displayText: text.trim(), structured: null };
  }
  const displayText = text.replace(JSON_BLOCK_RE, "").trim();
  try {
    const parsed = SonogynStructuredResponseSchema.safeParse(JSON.parse(match[1]!.trim()));
    if (parsed.success) return { displayText, structured: parsed.data };
  } catch {
    /* ignore */
  }
  return { displayText: text.trim(), structured: null };
}
