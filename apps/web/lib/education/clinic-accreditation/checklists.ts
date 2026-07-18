export type AccreditationCategory =
  | "personnel"
  | "equipment"
  | "documentation"
  | "safety"
  | "quality"
  | "patient";

export type AccreditationChecklistItem = {
  id: string;
  category: AccreditationCategory;
  label: string;
  required: boolean;
  hint?: string;
};

export type AccreditationSection = {
  id: string;
  titleRu: string;
  subtitle: string;
  source: string;
  items: AccreditationChecklistItem[];
};

export const ACCREDITATION_SECTIONS: AccreditationSection[] = [
  {
    id: "ultrasound-practice",
    titleRu: "Кабинет УЗД · общие требования",
    subtitle: "AIUM Practice Accreditation · Ultrasound Practice",
    source: "AIUM · Practice Accreditation Program",
    items: [
      { id: "ap-1", category: "personnel", label: "Врач с сертификатом/аккредитацией по УЗД", required: true },
      { id: "ap-2", category: "personnel", label: "Документированные CME-часы (≥36 ч/3 года — ориентир AIUM)", required: true, hint: "SonoGyn CME-трекер" },
      { id: "ap-3", category: "personnel", label: "Процедура peer review сложных случаев", required: true },
      { id: "ap-4", category: "equipment", label: "Регистрация аппарата, актуальное ТО", required: true },
      { id: "ap-5", category: "equipment", label: "QA transducer / phantom checks (ежегодно)", required: true },
      { id: "ap-6", category: "equipment", label: "Калибровка измерений биометрии", required: true },
      { id: "ap-7", category: "documentation", label: "Structured reports / стандартизированные протоколы", required: true },
      { id: "ap-8", category: "documentation", label: "Архив исследований ≥5 лет (или по локальному регламенту)", required: true },
      { id: "ap-9", category: "safety", label: "ALARA policy: TI/MI, dwell time, thermal index", required: true },
      { id: "ap-10", category: "safety", label: "Инструктаж персонала по биологическим эффектам УЗИ", required: true },
      { id: "ap-11", category: "quality", label: "Audit completeness протоколов (ежеквартально)", required: true },
      { id: "ap-12", category: "quality", label: "Critical findings callback policy", required: true },
      { id: "ap-13", category: "patient", label: "Informed consent / информационный лист", required: true },
      { id: "ap-14", category: "patient", label: "Процедура выдачи результатов и сроков", required: true },
    ],
  },
  {
    id: "ob-gyn-specialty",
    titleRu: "Акушерство и гинекология",
    subtitle: "AIUM · Ob-Gyn ultrasound specialty criteria",
    source: "AIUM · Obstetric & Gynecologic Ultrasound",
    items: [
      { id: "og-1", category: "personnel", label: "ISUOG/AIUM training: I триместр screening", required: true },
      { id: "og-2", category: "personnel", label: "Competency: fetal anomaly scan (18–22 нед)", required: true },
      { id: "og-3", category: "documentation", label: "Checklists полного исследования (AIUM/ISUOG)", required: true },
      { id: "og-4", category: "documentation", label: "O-RADS / BI-RADS documentation при массах", required: true },
      { id: "og-5", category: "quality", label: "Audit NT/CRL measurements vs FMF charts", required: false },
      { id: "og-6", category: "quality", label: "Referral pathway для VPI / cardiac findings", required: true },
      { id: "og-7", category: "patient", label: "Patient leaflets (ISUOG-style) в кабинете", required: false },
      { id: "og-8", category: "safety", label: "Doppler limits I trimester documented", required: true },
    ],
  },
];

export const ACCREDITATION_ITEM_COUNT = ACCREDITATION_SECTIONS.reduce((n, s) => n + s.items.length, 0);

export function sectionCompleteness(
  section: AccreditationSection,
  progress: Record<string, boolean>,
): { done: number; total: number; requiredDone: number; requiredTotal: number } {
  const required = section.items.filter((i) => i.required);
  const done = section.items.filter((i) => progress[i.id]).length;
  const requiredDone = required.filter((i) => progress[i.id]).length;
  return { done, total: section.items.length, requiredDone, requiredTotal: required.length };
}

export function itemsByCategory(section: AccreditationSection): Map<AccreditationCategory, AccreditationChecklistItem[]> {
  const map = new Map<AccreditationCategory, AccreditationChecklistItem[]>();
  for (const item of section.items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return map;
}
