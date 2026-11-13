/**
 * Клинический ревьюер контента CDS (не юридический статус).
 * Имя в UI не показываем, пока текст реально не вычитан — см. CLINICAL_CONTENT_REVIEW_STATUS_RU.
 */
export const CLINICAL_CONTENT_REVIEWER = {
  name: "Якубов Р.В.",
  specialty: "акушер-гинеколог, эксперт УЗИ",
} as const;

/** Публичная подпись для SEO/блога до фактической вычитки врачом. */
export const CLINICAL_CONTENT_REVIEW_STATUS_RU = "На врачебной проверке";

/**
 * Статус вычитки по статье / посадочной.
 * `pending` (или omit) → «На врачебной проверке».
 * `reviewed` → «Проверил: …» только после реальной вычитки врачом.
 */
export type ClinicalContentReviewStatus = "pending" | "reviewed";

export function formatClinicalReviewLabel(
  status: ClinicalContentReviewStatus | undefined = "pending",
  reviewer: typeof CLINICAL_CONTENT_REVIEWER = CLINICAL_CONTENT_REVIEWER,
): string {
  if (status === "reviewed") {
    return `Проверил: ${reviewer.name}`;
  }
  return CLINICAL_CONTENT_REVIEW_STATUS_RU;
}

export const CLINICAL_CONTENT_DISCLAIMER =
  "Справочный CDS-материал для специалистов. Не является диагнозом и не заменяет клиническое решение врача, локальные протоколы МО и актуальные редакции гайдлайнов/КР.";
