import type { FetometryPopulation, FetometrySection } from "./types";
import { getMeasurementGuide, type MeasurementGuide } from "./measurementGuides";

export type PanelField = {
  id: string;
  labelRu: string;
  unit: string;
  groupRu: string;
  needsCrl?: boolean;
  needsBpd?: boolean;
  isSvdDating?: boolean;
  hintRu?: string;
};

export type PanelFieldWithGuide = PanelField & { guide?: MeasurementGuide };

function withGuides(fields: PanelField[]): PanelFieldWithGuide[] {
  return fields.map((f) => ({ ...f, guide: getMeasurementGuide(f.id) }));
}

export const T1_PANEL_FIELDS: PanelField[] = [
  { id: "t1.svd_dating", labelRu: "СВД", unit: "мм", groupRu: "Датировка", isSvdDating: true, hintRu: "→ срок" },
  { id: "t1.crl", labelRu: "КТР", unit: "мм", groupRu: "Датировка", hintRu: "норма по сроку" },
  { id: "t1.bpd", labelRu: "БПР", unit: "мм", groupRu: "Биометрия 11–14" },
  { id: "t1.hc", labelRu: "ОГ", unit: "мм", groupRu: "Биометрия 11–14" },
  { id: "t1.ac", labelRu: "ОЖ", unit: "мм", groupRu: "Биометрия 11–14" },
  { id: "t1.fl", labelRu: "ДБК", unit: "мм", groupRu: "Биометрия 11–14" },
  { id: "t1.nt", labelRu: "ТВП", unit: "мм", groupRu: "Маркеры (по КТР)", needsCrl: true },
  { id: "t1.fourth_ventricle", labelRu: "IV желудочек", unit: "мм", groupRu: "Маркеры (по КТР)", needsCrl: true },
  { id: "t1.nasal_bone", labelRu: "Носовая кость", unit: "мм", groupRu: "Маркеры (по КТР)", needsCrl: true },
  { id: "t1.cp_of_ratio", labelRu: "ДСС/ЛЗР", unit: "ratio", groupRu: "Маркеры (по КТР)", needsCrl: true },
  { id: "t1.mesencephalon", labelRu: "Мезэнцефалон", unit: "мм", groupRu: "Маркеры (по КТР)", needsCrl: true },
  { id: "t1.fhr", labelRu: "ЧСС", unit: "уд/мин", groupRu: "Сердце и допплер" },
  { id: "t1.dv_pi", labelRu: "ПИ ВП", unit: "index", groupRu: "Сердце и допплер" },
  { id: "t1.ut_pi", labelRu: "ПИ мат. артерий", unit: "index", groupRu: "Сердце и допплер" },
];

export const T2_BASE_FIELDS: PanelField[] = [
  { id: "t2.bpd", labelRu: "БПР", unit: "мм", groupRu: "Голова и туловище" },
  { id: "t2.ofd", labelRu: "ЛЗР", unit: "мм", groupRu: "Голова и туловище" },
  { id: "t2.hc", labelRu: "ОГ", unit: "мм", groupRu: "Голова и туловище" },
  { id: "t2.ac", labelRu: "ОЖ", unit: "мм", groupRu: "Голова и туловище" },
  { id: "t2.fl", labelRu: "ДБК", unit: "мм", groupRu: "Конечности" },
  { id: "t2.hl", labelRu: "ДПК", unit: "мм", groupRu: "Конечности" },
  { id: "t2.csp_by_ga", labelRu: "ШЗП (по сроку)", unit: "мм", groupRu: "Нейросонография" },
  { id: "t2.csp_by_bpd", labelRu: "ШЗП (по БПР)", unit: "мм", groupRu: "Нейросонография", needsBpd: true },
  { id: "t2.lv", labelRu: "ШБЖ", unit: "мм", groupRu: "Нейросонография" },
  { id: "t2.sylvian", labelRu: "ГСБ", unit: "мм", groupRu: "Нейросонография" },
  { id: "t2.cerebellum", labelRu: "ПДМ", unit: "мм", groupRu: "Нейросонография" },
  { id: "t2.pf", labelRu: "ЗЧЯ", unit: "мм", groupRu: "Нейросонография" },
  { id: "t2.nb", labelRu: "ДНК", unit: "мм", groupRu: "Лицо" },
  { id: "t2.prenasal", labelRu: "ТПТ", unit: "мм", groupRu: "Лицо" },
];

export const EXTENDED_FIELDS: PanelField[] = [
  { id: "ext.pof", labelRu: "ГПОБ", unit: "мм", groupRu: "Мозг" },
  { id: "ext.cc", labelRu: "ДМТ", unit: "мм", groupRu: "Мозг" },
  { id: "ext.chp", labelRu: "ППМ", unit: "см", groupRu: "Мозг" },
  { id: "ext.kkrchm", labelRu: "ККРЧМ", unit: "мм", groupRu: "Мозг" },
  { id: "ext.pzrchm", labelRu: "ПЗРЧМ", unit: "мм", groupRu: "Мозг" },
  { id: "ext.bva", labelRu: "Угол ствол–червь", unit: "°", groupRu: "Мозг" },
  { id: "ext.ocw", labelRu: "Ширина хиазмы", unit: "мм", groupRu: "Зрительные пути" },
  { id: "ext.chiasm", labelRu: "Хиазма (акс.)", unit: "мм", groupRu: "Зрительные пути" },
  { id: "ext.nerve", labelRu: "Зрительный нерв", unit: "мм", groupRu: "Зрительные пути" },
  { id: "ext.tract", labelRu: "Зрительный тракт", unit: "мм", groupRu: "Зрительные пути" },
  { id: "ext.eor", labelRu: "ЭОР", unit: "мм", groupRu: "Орбиты и лицо" },
  { id: "ext.ior", labelRu: "ИОР", unit: "мм", groupRu: "Орбиты и лицо" },
  { id: "ext.dg", labelRu: "ДГ", unit: "мм", groupRu: "Орбиты и лицо" },
  { id: "ext.ear", labelRu: "Длина уха", unit: "мм", groupRu: "Орбиты и лицо" },
  { id: "ext.tongue", labelRu: "Периметр языка", unit: "мм", groupRu: "Шея и грудь" },
  { id: "ext.trachea", labelRu: "Диаметр трахеи", unit: "мм", groupRu: "Шея и грудь" },
  { id: "ext.thyroid", labelRu: "Периметр щитовидки", unit: "мм", groupRu: "Шея и грудь" },
  { id: "ext.clavicle", labelRu: "Ключица", unit: "мм", groupRu: "Кости пояса" },
  { id: "ext.scapula", labelRu: "Лопатка", unit: "мм", groupRu: "Кости пояса" },
];

export const HEART_FIELDS: PanelField[] = [
  { id: "heart.2.27.ap_mm", labelRu: "Тимус ПЗР", unit: "мм", groupRu: "Тимус" },
  { id: "heart.2.27.diameter_mm", labelRu: "Тимус диаметр", unit: "мм", groupRu: "Тимус" },
  { id: "heart.2.27.perimeter_mm", labelRu: "Тимус периметр", unit: "мм", groupRu: "Тимус" },
  { id: "heart.2.28.left_ml", labelRu: "Лёгкое левое", unit: "мл", groupRu: "Лёгкие" },
  { id: "heart.2.28.right_ml", labelRu: "Лёгкое правое", unit: "мл", groupRu: "Лёгкие" },
  { id: "heart.2.28.total_ml", labelRu: "Лёгкие суммарно", unit: "мл", groupRu: "Лёгкие" },
  { id: "heart.2.29.heart_cross_section_area_mm2", labelRu: "ППСС", unit: "мм²", groupRu: "Сердце" },
  { id: "heart.2.29.cardiothoracic_ratio", labelRu: "КТО", unit: "index", groupRu: "Сердце" },
  { id: "heart.2.30.left_atrium_mm", labelRu: "ЛП", unit: "мм", groupRu: "Сердце" },
  { id: "heart.2.30.right_atrium_mm", labelRu: "ПП", unit: "мм", groupRu: "Сердце" },
  { id: "heart.2.31.left_ventricle_mm", labelRu: "ЛЖ", unit: "мм", groupRu: "Сердце" },
  { id: "heart.2.31.right_ventricle_mm", labelRu: "ПЖ", unit: "мм", groupRu: "Сердце" },
  { id: "heart.2.32.value", labelRu: "АВ-перегородка", unit: "мм", groupRu: "Сердце" },
  { id: "heart.2.33.aorta_diameter_mm", labelRu: "Аорта", unit: "мм", groupRu: "Магистральные сосуды" },
  { id: "heart.2.33.pulmonary_trunk_diameter_mm", labelRu: "Лёгочный ствол", unit: "мм", groupRu: "Магистральные сосуды" },
];

export const DOPPLER_FIELDS: PanelField[] = [
  { id: "dop.2.34.aortic_isthmus_mm", labelRu: "Перешеек аорты", unit: "мм", groupRu: "Сосуды" },
  { id: "dop.2.34.ductus_arteriosus_mm", labelRu: "Арт. проток", unit: "мм", groupRu: "Сосуды" },
  { id: "dop.2.35.ap_mm", labelRu: "Печень ПЗР", unit: "мм", groupRu: "Органы" },
  { id: "dop.2.36.value", labelRu: "Периметр селезёнки", unit: "см", groupRu: "Органы" },
  { id: "dop.2.37.value", labelRu: "Толстый кишечник", unit: "мм", groupRu: "Органы" },
  { id: "dop.2.38.length_mm", labelRu: "Почка длина", unit: "мм", groupRu: "Органы" },
  { id: "dop.2.39.value", labelRu: "Надпочечник", unit: "мм", groupRu: "Органы" },
  { id: "dop.2.40.forearm_bones_mm", labelRu: "Предплечье", unit: "мм", groupRu: "Конечности" },
  { id: "dop.2.40.shin_bones_mm", labelRu: "Голень", unit: "мм", groupRu: "Конечности" },
  { id: "dop.2.41.value", labelRu: "Стопа", unit: "мм", groupRu: "Конечности" },
  { id: "dop.3.1.value", labelRu: "Толщина плаценты", unit: "мм", groupRu: "Плацента и воды" },
  { id: "dop.3.2.value", labelRu: "ИАЖ", unit: "мм", groupRu: "Плацента и воды" },
  { id: "dop.3.3.uterine_arteries_pi", labelRu: "ПИ мат. артерий", unit: "index", groupRu: "Допплер" },
  { id: "dop.3.3.umbilical_artery_pi", labelRu: "ПИ АП", unit: "index", groupRu: "Допплер" },
  { id: "dop.3.4.mca_pi", labelRu: "ПИ СМА", unit: "index", groupRu: "Допплер" },
  { id: "dop.3.4.mca_psv_cm_s", labelRu: "ПССК СМА", unit: "см/с", groupRu: "Допплер", hintRu: "порог 1,5 MoM" },
  { id: "dop.3.5.value", labelRu: "ПИ ВП", unit: "index", groupRu: "Допплер" },
  { id: "dop.3.6.aorta_psv_cm_s", labelRu: "ПССК аорты", unit: "см/с", groupRu: "Допплер" },
  { id: "dop.3.6.pulmonary_trunk_psv_cm_s", labelRu: "ПССК лёгочного ствола", unit: "см/с", groupRu: "Допплер" },
];

export const POPULATION_OPTIONS: { id: FetometryPopulation; labelRu: string }[] = [
  { id: "moscow", labelRu: "Сводная" },
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

export function fieldsWithGuidesForSection(section: FetometrySection): PanelFieldWithGuide[] {
  return withGuides(fieldsForSection(section));
}

export function groupFields(fields: PanelField[]): { groupRu: string; fields: PanelFieldWithGuide[] }[] {
  const order: string[] = [];
  const map = new Map<string, PanelFieldWithGuide[]>();
  for (const f of withGuides(fields)) {
    if (!map.has(f.groupRu)) {
      order.push(f.groupRu);
      map.set(f.groupRu, []);
    }
    map.get(f.groupRu)!.push(f);
  }
  return order.map((groupRu) => ({ groupRu, fields: map.get(groupRu)! }));
}

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
  if (measurements["t2.ac"] != null && (population === "kazakhstan" || population === "uzbekistan")) {
    out[`appendix.${population}.abd_mean_diameter_mm`] = measurements["t2.ac"];
  }
  return out;
}
