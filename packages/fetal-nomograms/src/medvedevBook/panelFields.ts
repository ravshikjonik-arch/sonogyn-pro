import type { FetometryPopulation, FetometrySection } from "./types";

export type PanelField = {
  id: string;
  labelRu: string;
  unit: string;
  /** Needs CRL for lookup */
  needsCrl?: boolean;
  /** Needs BPD for lookup (CSP by BPD) */
  needsBpd?: boolean;
  /** SVD dating field */
  isSvdDating?: boolean;
  hintRu?: string;
};

export const T1_PANEL_FIELDS: PanelField[] = [
  { id: "t1.svd_dating", labelRu: "СВД", unit: "мм", isSvdDating: true, hintRu: "→ срок p5/p50/p95" },
  { id: "t1.crl", labelRu: "КТР", unit: "мм", hintRu: "норма КТР по сроку" },
  { id: "t1.bpd", labelRu: "БПР", unit: "мм", hintRu: "11–14 нед" },
  { id: "t1.hc", labelRu: "ОГ", unit: "мм" },
  { id: "t1.ac", labelRu: "ОЖ", unit: "мм" },
  { id: "t1.fl", labelRu: "ДБК", unit: "мм" },
  { id: "t1.nt", labelRu: "ТВП", unit: "мм", needsCrl: true },
  { id: "t1.fourth_ventricle", labelRu: "IV желудочек", unit: "мм", needsCrl: true },
  { id: "t1.nasal_bone", labelRu: "Носовая кость", unit: "мм", needsCrl: true },
  { id: "t1.cp_of_ratio", labelRu: "ДСС/ЛЗР", unit: "ratio", needsCrl: true },
  { id: "t1.mesencephalon", labelRu: "Мезэнцефалон", unit: "мм", needsCrl: true },
  { id: "t1.fhr", labelRu: "ЧСС", unit: "уд/мин" },
  { id: "t1.dv_pi", labelRu: "ПИ ВП", unit: "index" },
  { id: "t1.ut_pi", labelRu: "ПИ мат. артерий", unit: "index" },
];

export const T2_BASE_FIELDS: PanelField[] = [
  { id: "t2.bpd", labelRu: "БПР", unit: "мм" },
  { id: "t2.ofd", labelRu: "ЛЗР", unit: "мм" },
  { id: "t2.hc", labelRu: "ОГ", unit: "мм" },
  { id: "t2.ac", labelRu: "ОЖ", unit: "мм" },
  { id: "t2.fl", labelRu: "ДБК", unit: "мм" },
  { id: "t2.hl", labelRu: "ДПК", unit: "мм" },
  { id: "t2.csp_by_ga", labelRu: "ШЗП (по сроку)", unit: "мм" },
  { id: "t2.csp_by_bpd", labelRu: "ШЗП (по БПР)", unit: "мм", needsBpd: true },
  { id: "t2.lv", labelRu: "ШБЖ", unit: "мм" },
  { id: "t2.sylvian", labelRu: "ГСБ", unit: "мм" },
  { id: "t2.cerebellum", labelRu: "ПДМ", unit: "мм" },
  { id: "t2.pf", labelRu: "ЗЧЯ", unit: "мм" },
  { id: "t2.nb", labelRu: "ДНК", unit: "мм" },
  { id: "t2.prenasal", labelRu: "ТПТ", unit: "мм" },
];

export const EXTENDED_FIELDS: PanelField[] = [
  { id: "ext.pof", labelRu: "ГПОБ", unit: "мм" },
  { id: "ext.cc", labelRu: "ДМТ", unit: "мм" },
  { id: "ext.chp", labelRu: "ППМ", unit: "см" },
  { id: "ext.kkrchm", labelRu: "ККРЧМ", unit: "мм" },
  { id: "ext.pzrchm", labelRu: "ПЗРЧМ", unit: "мм" },
  { id: "ext.bva", labelRu: "Угол ствол–червь", unit: "°" },
  { id: "ext.ocw", labelRu: "Ширина хиазмы", unit: "мм" },
  { id: "ext.chiasm", labelRu: "Хиазма (акс.)", unit: "мм" },
  { id: "ext.nerve", labelRu: "Зрительный нерв", unit: "мм" },
  { id: "ext.tract", labelRu: "Зрительный тракт", unit: "мм" },
  { id: "ext.eor", labelRu: "ЭОР", unit: "мм" },
  { id: "ext.ior", labelRu: "ИОР", unit: "мм" },
  { id: "ext.dg", labelRu: "ДГ", unit: "мм" },
  { id: "ext.ear", labelRu: "Длина уха", unit: "мм" },
  { id: "ext.tongue", labelRu: "Периметр языка", unit: "мм" },
  { id: "ext.trachea", labelRu: "Диаметр трахеи", unit: "мм" },
  { id: "ext.thyroid", labelRu: "Периметр щитовидки", unit: "мм" },
  { id: "ext.clavicle", labelRu: "Ключица", unit: "мм" },
  { id: "ext.scapula", labelRu: "Лопатка", unit: "мм" },
];

/** Heart / chest — ids from loadListStyleTables */
export const HEART_FIELDS: PanelField[] = [
  { id: "heart.2.27.ap_mm", labelRu: "Тимус ПЗР", unit: "мм" },
  { id: "heart.2.27.diameter_mm", labelRu: "Тимус диаметр", unit: "мм" },
  { id: "heart.2.27.perimeter_mm", labelRu: "Тимус периметр", unit: "мм" },
  { id: "heart.2.28.left_ml", labelRu: "Лёгкое левое", unit: "мл" },
  { id: "heart.2.28.right_ml", labelRu: "Лёгкое правое", unit: "мл" },
  { id: "heart.2.28.total_ml", labelRu: "Лёгкие суммарно", unit: "мл" },
  { id: "heart.2.29.heart_cross_section_area_mm2", labelRu: "ППСС", unit: "мм²" },
  { id: "heart.2.29.cardiothoracic_ratio", labelRu: "КТО", unit: "index" },
  { id: "heart.2.30.left_atrium_mm", labelRu: "ЛП", unit: "мм" },
  { id: "heart.2.30.right_atrium_mm", labelRu: "ПП", unit: "мм" },
  { id: "heart.2.31.left_ventricle_mm", labelRu: "ЛЖ", unit: "мм" },
  { id: "heart.2.31.right_ventricle_mm", labelRu: "ПЖ", unit: "мм" },
  { id: "heart.2.32.value", labelRu: "АВ-перегородка", unit: "мм" },
  { id: "heart.2.33.aorta_diameter_mm", labelRu: "Аорта", unit: "мм" },
  { id: "heart.2.33.pulmonary_trunk_diameter_mm", labelRu: "Лёгочный ствол", unit: "мм" },
];

export const DOPPLER_FIELDS: PanelField[] = [
  { id: "dop.2.34.aortic_isthmus_mm", labelRu: "Перешеек аорты", unit: "мм" },
  { id: "dop.2.34.ductus_arteriosus_mm", labelRu: "Арт. проток", unit: "мм" },
  { id: "dop.2.35.ap_mm", labelRu: "Печень ПЗР", unit: "мм" },
  { id: "dop.2.36.value", labelRu: "Периметр селезёнки", unit: "см" },
  { id: "dop.2.37.value", labelRu: "Толстый кишечник", unit: "мм" },
  { id: "dop.2.38.length_mm", labelRu: "Почка длина", unit: "мм" },
  { id: "dop.2.39.value", labelRu: "Надпочечник", unit: "мм" },
  { id: "dop.2.40.forearm_bones_mm", labelRu: "Предплечье", unit: "мм" },
  { id: "dop.2.40.shin_bones_mm", labelRu: "Голень", unit: "мм" },
  { id: "dop.2.41.value", labelRu: "Стопа", unit: "мм" },
  { id: "dop.3.1.value", labelRu: "Толщина плаценты", unit: "мм" },
  { id: "dop.3.2.value", labelRu: "ИАЖ", unit: "мм" },
  { id: "dop.3.3.uterine_arteries_pi", labelRu: "ПИ мат. артерий", unit: "index" },
  { id: "dop.3.3.umbilical_artery_pi", labelRu: "ПИ АП", unit: "index" },
  { id: "dop.3.4.mca_pi", labelRu: "ПИ СМА", unit: "index" },
  { id: "dop.3.4.mca_psv_cm_s", labelRu: "ПССК СМА", unit: "см/с", hintRu: "порог 1,5 MoM" },
  { id: "dop.3.5.value", labelRu: "ПИ ВП", unit: "index" },
  { id: "dop.3.6.aorta_psv_cm_s", labelRu: "ПССК аорты", unit: "см/с" },
  { id: "dop.3.6.pulmonary_trunk_psv_cm_s", labelRu: "ПССК лёгочного ствола", unit: "см/с" },
];

export const POPULATION_OPTIONS: { id: FetometryPopulation; labelRu: string }[] = [
  { id: "moscow", labelRu: "Сводная (Москва, Медведев)" },
  { id: "kazakhstan", labelRu: "Казахстан" },
  { id: "belarus", labelRu: "Беларусь" },
  { id: "uzbekistan", labelRu: "Узбекистан" },
];

export function fieldsForSection(section: FetometrySection): PanelField[] {
  switch (section) {
    case "t1":
      return T1_PANEL_FIELDS;
    case "t2_base":
      return T2_BASE_FIELDS;
    case "extended":
      return EXTENDED_FIELDS;
    case "heart":
      return HEART_FIELDS;
    case "doppler":
      return DOPPLER_FIELDS;
    default:
      return [];
  }
}

/** Remap t2.* measurement ids to appendix.* when population ≠ moscow */
export function remapMeasurementIdsForPopulation(
  measurements: Record<string, number | undefined | null>,
  population: FetometryPopulation,
): Record<string, number | undefined | null> {
  if (population === "moscow") return measurements;
  const map: Record<string, string> = {
    "t2.bpd": `appendix.${population}.bpd_mm`,
    "t2.ofd": `appendix.${population}.ofd_mm`,
    "t2.hc": `appendix.${population}.hc_mm`,
    "t2.ac": `appendix.${population}.ac_mm`,
    "t2.fl": `appendix.${population}.fl_mm`,
    "t2.hl": `appendix.${population}.hl_mm`,
  };
  const out: Record<string, number | undefined | null> = {};
  for (const [k, v] of Object.entries(measurements)) {
    out[map[k] ?? k] = v;
  }
  // Kazakhstan / UZ often have СДЖ instead of AC
  if (measurements["t2.ac"] != null && (population === "kazakhstan" || population === "uzbekistan")) {
    out[`appendix.${population}.abd_mean_diameter_mm`] = measurements["t2.ac"];
  }
  return out;
}
