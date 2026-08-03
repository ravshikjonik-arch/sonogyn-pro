export const EXAM_CHECKLISTS_MODULE_ID = "exam-checklists";

export const EXAM_CHECKLISTS_MODULE_TITLE_RU =
  "Чек-листы полного УЗИ-исследования";

export const EXAM_CHECKLISTS_MODULE_TITLE =
  "Interactive exam checklists (AIUM / ISUOG practice parameters)";

export const EXAM_CHECKLISTS_DISCLAIMER =
  "Образовательные чек-листы по международным practice parameters (AIUM, ISUOG). Не заменяют протокол клиники и локальные КР РФ; интерпретация — специалистом.";

export const EXAM_CHECKLISTS_LINKS = {
  library: { href: "/tools/refs", label: "Библиотека" },
  reports: { href: "/reports", label: "Structured Reporting" },
  fetalAnatomy: { href: "/tools/refs/fetal-anatomy-22-views", label: "22 среза · II триместр" },
  norms: { href: "/tools/refs/norms", label: "Клинические нормы" },
  fmf: { href: "/ai/consultants/fmf", label: "FMF · скрининг" },
  moduleRoute: "/tools/refs/exam-checklists",
} as const;

export const EXAM_CHECKLIST_CATEGORY_LABELS: Record<
  import("./types").ExamChecklistCategory,
  string
> = {
  visualize: "Визуализация",
  measure: "Измерения",
  document: "Документирование",
  mustNotMiss: "Нельзя пропустить",
};
