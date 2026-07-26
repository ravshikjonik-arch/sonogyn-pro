import { z } from "zod";

/** Шаблон протокола II/III пренатального скрининга (FMF). */
export const SecondThirdProtocolTemplateIdSchema = z.enum(["yakubov-2023", "sonogyn-compact"]);
export type SecondThirdProtocolTemplateId = z.infer<typeof SecondThirdProtocolTemplateIdSchema>;

export const DEFAULT_SECOND_THIRD_PROTOCOL_TEMPLATE: SecondThirdProtocolTemplateId = "yakubov-2023";

/** Push о сообщениях чата / ответах в обсуждениях. Default: включено. */
export const NotificationPreferencesSchema = z.object({
  messagesEnabled: z.boolean().optional(),
});
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

/** Настройки врача, синхронизируются через `profiles.clinical_preferences`. */
export const ClinicalPreferencesSchema = z.object({
  fmfSecondThirdProtocolTemplate: SecondThirdProtocolTemplateIdSchema.optional(),
  notifications: NotificationPreferencesSchema.optional(),
});
export type ClinicalPreferences = z.infer<typeof ClinicalPreferencesSchema>;

export function parseClinicalPreferences(raw: unknown): ClinicalPreferences {
  const parsed = ClinicalPreferencesSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : {};
}

/** Opt-out: только явный `false` отключает push. */
export function isMessageNotificationsEnabled(prefs: ClinicalPreferences | unknown): boolean {
  const parsed = parseClinicalPreferences(prefs);
  return parsed.notifications?.messagesEnabled !== false;
}
