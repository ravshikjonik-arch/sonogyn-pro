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
  library: { href: "/tools/refs", label: "Библиотека" },
} as const;

export const VASCULAR_US_CLINICAL_HREF = "/assistant/vascular";

/** Вкладки клинического модуля для deep-link из курса (?tab=). */
export const VASCULAR_CLINICAL_TAB_BY_SECTION: Partial<
  Record<
    | "extracranial"
    | "tcd"
    | "lower-limb-arteries"
    | "lower-limb-veins"
    | "upper-limb"
    | "abdominal-aorta",
    string
  >
> = {
  extracranial: "bca",
  tcd: "tcd",
  "lower-limb-arteries": "lla",
  "lower-limb-veins": "llv",
  "upper-limb": "ul",
  "abdominal-aorta": "aaa",
};

export function getVascularClinicalHref(sectionId: keyof typeof VASCULAR_CLINICAL_TAB_BY_SECTION): string {
  const tab = VASCULAR_CLINICAL_TAB_BY_SECTION[sectionId];
  return tab ? `${VASCULAR_US_CLINICAL_HREF}?tab=${tab}` : VASCULAR_US_CLINICAL_HREF;
}
