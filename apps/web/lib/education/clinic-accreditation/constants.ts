export const CLINIC_ACCREDITATION_MODULE_ID = "clinic-accreditation";
export const CLINIC_ACCREDITATION_MODULE_TITLE_RU = "Аккредитация кабинета УЗИ · AIUM-style";
export const CLINIC_ACCREDITATION_DISCLAIMER =
  "Чек-лист самооценки по принципам AIUM Practice Accreditation. Не заменяет официальную аккредитацию AIUM или Росаккредитацию.";

export const CLINIC_ACCREDITATION_LINKS = {
  library: { href: "/tools/refs", label: "Библиотека" },
  cme: { href: "/tools/refs/cme-tracker", label: "CME-трекер" },
  safety: { href: "/tools/refs/ultrasound-safety", label: "Безопасность УЗИ" },
  checklists: { href: "/tools/refs/exam-checklists", label: "Чек-листы исследований" },
};

export const ACCREDITATION_CATEGORY_LABELS: Record<string, string> = {
  personnel: "Персонал и компетенции",
  equipment: "Оборудование и QA",
  documentation: "Документирование",
  safety: "Безопасность · ALARA",
  quality: "Контроль качества",
  patient: "Пациент и коммуникация",
};
