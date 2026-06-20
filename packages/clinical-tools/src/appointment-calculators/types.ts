/** Категории референсного списка OblCalc / приёма */
export type AppointmentCalcCategory =
  | "pregnancy-term"
  | "fetal-weight"
  | "obstetric"
  | "gynecologic"
  | "reference";

export type AppointmentCalcStatus = "implemented" | "partial" | "missing";

export type AppointmentCalcIcon =
  | "calendar"
  | "ultrasound"
  | "egg"
  | "baby"
  | "hospital"
  | "stroller"
  | "calendar-back"
  | "fetus-scan"
  | "scale"
  | "circle"
  | "scar"
  | "breast"
  | "cervix"
  | "colposcopy"
  | "ovary"
  | "pill";

export type AppointmentCalculator = {
  /** Уникальный id в каталоге */
  id: string;
  /** Ключ для сопоставления с референсным списком (если есть) */
  refKey?: string;
  title: string;
  description: string;
  category: AppointmentCalcCategory;
  status: AppointmentCalcStatus;
  /** Маршрут web; отсутствует у missing */
  webHref?: string;
  icon: AppointmentCalcIcon;
  /** Автоматически в блок «Часто на приёме» */
  frequentAtAppointment?: boolean;
  /** Примечание для аудита (частичная реализация) */
  partialNote?: string;
  /** Синонимы для поиска */
  searchTerms?: string[];
};

export type AppointmentCalcCategoryMeta = {
  id: AppointmentCalcCategory;
  label: string;
};

export const APPOINTMENT_CATEGORY_ORDER: AppointmentCalcCategoryMeta[] = [
  { id: "pregnancy-term", label: "Срок беременности" },
  { id: "fetal-weight", label: "Масса плода" },
  { id: "obstetric", label: "Акушерские калькуляторы" },
  { id: "gynecologic", label: "Гинекологические калькуляторы" },
  { id: "reference", label: "Справочники" },
];

export const APPOINTMENT_CATEGORY_LABELS: Record<AppointmentCalcCategory, string> = {
  "pregnancy-term": "Срок беременности",
  "fetal-weight": "Масса плода",
  obstetric: "Акушерские калькуляторы",
  gynecologic: "Гинекологические калькуляторы",
  reference: "Справочники",
};
