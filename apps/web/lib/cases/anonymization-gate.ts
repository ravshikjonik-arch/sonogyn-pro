/** Gate R6 — anonymization checklist (shared wizard + media gallery). */

export const CASE_ANON_CHECKS = [
  "На снимках нет ФИО, даты рождения, номера карты и ID исследования",
  "Нет меток клиники, врача и аппарата (DICOM overlay / burn-in)",
  "Кадрирование не позволяет идентифицировать пациента",
] as const;

export type AnonymizationStatus = "pending" | "passed" | "failed" | "waived";

export function isAnonymizationOk(status: string | null | undefined): boolean {
  return status === "passed" || status === "waived";
}

export function anonymizationLabel(status: string | null | undefined): string {
  switch (status) {
    case "passed":
      return "Анонимизировано";
    case "waived":
      return "Legacy (waived)";
    case "failed":
      return "Не прошло проверку";
    default:
      return "Ожидает проверки";
  }
}

/** Publish allowed when no media, or every file passed/waived. */
export function canPublishCaseMedia(
  rows: Array<{ anonymization_status?: string | null }>,
): { ok: boolean; reason?: string } {
  if (rows.length === 0) return { ok: true };
  const blocked = rows.filter((r) => !isAnonymizationOk(r.anonymization_status));
  if (blocked.length === 0) return { ok: true };
  return {
    ok: false,
    reason: `Подтвердите анонимизацию для ${blocked.length} файл(ов) перед публикацией`,
  };
}

/** Map Supabase/DB publish errors to user-facing R6 messages. */
export function formatPublishBlockedError(message: string | undefined): string {
  if (!message) return "Не удалось опубликовать кейс";
  if (
    message.includes("publish blocked") ||
    message.includes("anonymization") ||
    message.includes("R6")
  ) {
    return "Публикация заблокирована (R6): подтвердите анонимизацию всех файлов в галерее";
  }
  return message;
}

/** Public feed thumb allowed only when passed/waived (R6). */
export function canShowPublicMediaThumb(status: string | null | undefined): boolean {
  return isAnonymizationOk(status);
}
