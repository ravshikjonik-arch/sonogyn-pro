export const VASCULAR_US_MODULE_ID = "vascular-ultrasound";

export const VASCULAR_US_DISCLAIMER =
  "Образовательный модуль по сосудистому УЗД (методология Куликов В.П.). Не является медицинским диагнозом; интерпретация и тактика — специалистом.";

export const VASCULAR_US_SOURCE = {
  author: "В.П. Куликов",
  title: "Основы ультразвукового исследования сосудов",
  publisher: "Вidar-М, 2015",
} as const;

export const VASCULAR_US_LINKS = {
  clinical: { href: "/assistant/vascular", label: "Клинический модуль · протокол и AI" },
  library: { href: "/library", label: "Библиотека" },
} as const;

export const VASCULAR_US_CLINICAL_HREF = "/assistant/vascular";
