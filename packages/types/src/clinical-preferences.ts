import { z } from "zod";

/** Шаблон протокола II/III пренатального скрининга (FMF). */
export const SecondThirdProtocolTemplateIdSchema = z.enum(["yakubov-2023", "sonogyn-compact"]);
export type SecondThirdProtocolTemplateId = z.infer<typeof SecondThirdProtocolTemplateIdSchema>;

export const DEFAULT_SECOND_THIRD_PROTOCOL_TEMPLATE: SecondThirdProtocolTemplateId = "yakubov-2023";

/** Настройки врача, синхронизируются через `profiles.clinical_preferences`. */
export const ClinicalPreferencesSchema = z.object({
  fmfSecondThirdProtocolTemplate: SecondThirdProtocolTemplateIdSchema.optional(),
});
export type ClinicalPreferences = z.infer<typeof ClinicalPreferencesSchema>;

export function parseClinicalPreferences(raw: unknown): ClinicalPreferences {
  const parsed = ClinicalPreferencesSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : {};
}
