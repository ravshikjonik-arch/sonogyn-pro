export const FETAL_ANATOMY_MODULE_ID = "fetal-anatomy-22-views";

export const FETAL_ANATOMY_MODULE_TITLE =
  "22 Ultrasound Views for Detection of 65 Fetal Anomalies";

export const FETAL_ANATOMY_MODULE_TITLE_RU =
  "22 ультразвуковых среза для исключения 65 ВПР плода";

export const FETAL_ANATOMY_DISCLAIMER =
  "Образовательный модуль по систематическому сканированию II триместра (Е.С. Емельяненко). Не заменяет протокол клиники и не является медицинским диагнозом; интерпретация — специалистом.";

export const FETAL_ANATOMY_SOURCE = {
  author: "Елена Сергеевна Емельяненко",
  organization: "Общероссийская школа-интенсив «УЗИ — каждому акушеру-гинекологу!»",
  contact: "elena.emelyanenko@yahoo.com",
  web: "https://www.elena-emelyanenko.ru",
  trimester: "II триместр · 18–22 нед (рекомендуемые срезы)",
} as const;

export const FETAL_ANATOMY_IMAGE_BASE = "/images/fetal-anatomy";

export const FETAL_ANATOMY_LINKS = {
  library: { href: "/tools/refs", label: "Библиотека" },
  fmf: { href: "/assistant/fmf?section=second", label: "FMF · II скрининг" },
  fetalSpine: { href: "/tools/refs/fetal-spine", label: "Атлас позвоночника" },
  basicCourse: { href: "/tools/refs/basic-course?tab=program", label: "ISUOG Basic Training" },
  moduleRoute: "/tools/refs/fetal-anatomy-22-views",
} as const;

export const FETAL_ANATOMY_REGION_LABELS: Record<string, string> = {
  overview: "Обзор",
  spine: "Позвоночник",
  "head-brain": "Голова и мозг",
  heart: "Сердце",
  abdomen: "Живот",
  pelvis: "Малый таз",
  limbs: "Конечности",
  face: "Лицо",
  "whole-body": "Обзор тела",
};
