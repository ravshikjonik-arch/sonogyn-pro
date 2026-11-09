import type {
  BiradsAssociatedFeature,
  BiradsCalcifications,
  BiradsCategory,
  BiradsCategoryInfo,
  BiradsEchoPattern,
  BiradsLesionKind,
  BiradsMargin,
  BiradsMassShape,
  BiradsNmlDistribution,
  BiradsNmlEcho,
  BiradsOrientation,
  BiradsPosterior,
  BiradsSourceRef,
  BiradsSpecialCase,
  BiradsVascularity,
} from "./types";

export type BiradsOption<T extends string> = { value: T; labelRu: string; hintRu?: string };

export const BIRADS_US_ENGINE_VERSION = "acr-birads-us-v2025-v1";

export const BIRADS_US_SOURCES = {
  ACR_BIRADS_US_2013: {
    id: "ACR_BIRADS_US_2013",
    citation:
      "Mendelson E.B. et al. ACR BI-RADS® Ultrasound. In: ACR BI-RADS® Atlas, Breast Imaging Reporting and Data System. 5th ed. Reston, VA: American College of Radiology; 2013.",
    version: "5th edition, 2013",
  },
  ACR_BIRADS_V2025: {
    id: "ACR_BIRADS_V2025",
    citation:
      "Leung J.W.T. et al. Ultrasound. In: ACR BI-RADS® v2025 Manual. Reston, VA: American College of Radiology; 2025.",
    version: "v2025",
  },
} as const satisfies Record<BiradsSourceRef["id"], BiradsSourceRef>;

export const BIRADS_KIND_OPTIONS: BiradsOption<BiradsLesionKind>[] = [
  { value: "mass", labelRu: "Образование (mass)" },
  { value: "non_mass", labelRu: "Non-mass изменение (NML)" },
  { value: "special_case", labelRu: "Особый случай" },
];

export const BIRADS_SHAPE_OPTIONS: BiradsOption<BiradsMassShape>[] = [
  { value: "oval", labelRu: "Овальная", hintRu: "Эллипсовидная, допускаются 2–3 пологих волны." },
  { value: "lobulated", labelRu: "Дольчатая", hintRu: "В целом овальная, с одним или несколькими вдавлениями (v2025)." },
  { value: "round", labelRu: "Округлая" },
  { value: "irregular", labelRu: "Неправильная" },
];

export const BIRADS_ORIENTATION_OPTIONS: BiradsOption<BiradsOrientation>[] = [
  { value: "parallel", labelRu: "Параллельная", hintRu: "Горизонтальный размер больше переднезаднего во всех плоскостях." },
  { value: "non_parallel", labelRu: "Непараллельная", hintRu: "Переднезадний размер ≥ горизонтального хотя бы в одной плоскости." },
];

export const BIRADS_MARGIN_OPTIONS: BiradsOption<BiradsMargin>[] = [
  { value: "circumscribed", labelRu: "Чёткий (circumscribed)", hintRu: "Чёткая граница по всему контуру." },
  { value: "indistinct", labelRu: "Нечёткий", hintRu: "В v2025 сюда относится и бывший «микродольчатый»." },
  { value: "angular", labelRu: "Угловатый" },
  { value: "spiculated", labelRu: "Спикулярный" },
];

export const BIRADS_ECHO_OPTIONS: BiradsOption<BiradsEchoPattern>[] = [
  { value: "anechoic", labelRu: "Анэхогенная" },
  { value: "hyperechoic", labelRu: "Гиперэхогенная" },
  { value: "mixed_solid_cystic", labelRu: "Смешанная солидно-кистозная" },
  { value: "hypoechoic", labelRu: "Гипоэхогенная" },
  { value: "isoechoic", labelRu: "Изоэхогенная" },
  { value: "heterogeneous", labelRu: "Неоднородная" },
];

export const BIRADS_POSTERIOR_OPTIONS: BiradsOption<BiradsPosterior>[] = [
  { value: "none", labelRu: "Без задних эффектов" },
  { value: "enhancement", labelRu: "Усиление" },
  { value: "shadowing", labelRu: "Акустическая тень" },
];

export const BIRADS_NML_DISTRIBUTION_OPTIONS: BiradsOption<BiradsNmlDistribution>[] = [
  { value: "focal", labelRu: "Фокальное" },
  { value: "linear", labelRu: "Линейное" },
  { value: "segmental", labelRu: "Сегментарное" },
  { value: "regional", labelRu: "Региональное" },
];

export const BIRADS_NML_ECHO_OPTIONS: BiradsOption<BiradsNmlEcho>[] = [
  { value: "hypoechoic", labelRu: "Гипоэхогенное" },
  { value: "hyperechoic_heterogeneous", labelRu: "Гиперэхогенное / неоднородное" },
];

export const BIRADS_CALC_OPTIONS: BiradsOption<BiradsCalcifications>[] = [
  { value: "none", labelRu: "Кальцинатов нет" },
  { value: "macro", labelRu: "Макрокальцинаты" },
  { value: "micro", labelRu: "Микрокальцинаты" },
];

export const BIRADS_ASSOCIATED_OPTIONS: BiradsOption<BiradsAssociatedFeature>[] = [
  { value: "none", labelRu: "Сопутствующих признаков нет" },
  { value: "echogenic_pseudocapsule", labelRu: "Эхогенная псевдокапсула" },
  { value: "echogenic_rind", labelRu: "Эхогенный ободок (rind)" },
  { value: "architectural_distortion", labelRu: "Архитектурная перестройка" },
  { value: "duct_changes", labelRu: "Изменения протоков" },
  { value: "skin_thickening", labelRu: "Утолщение кожи" },
  { value: "skin_retraction", labelRu: "Втяжение кожи" },
  { value: "edema", labelRu: "Отёк" },
];

export const BIRADS_VASCULARITY_OPTIONS: BiradsOption<BiradsVascularity>[] = [
  { value: "avascular", labelRu: "Аваскулярное" },
  { value: "internal", labelRu: "Внутренний кровоток" },
  { value: "peripheral", labelRu: "Периферический кровоток" },
];

export const BIRADS_SPECIAL_CASE_OPTIONS: BiradsOption<BiradsSpecialCase>[] = [
  { value: "simple_cyst", labelRu: "Простая киста" },
  { value: "isolated_complicated_cyst", labelRu: "Одиночная осложнённая киста" },
  { value: "clustered_microcysts", labelRu: "Сгруппированные микрокисты" },
  { value: "intramammary_lymph_node", labelRu: "Интрамаммарный лимфоузел" },
  { value: "postsurgical_fluid", labelRu: "Послеоперационное скопление жидкости" },
  { value: "implant_or_foreign_body", labelRu: "Имплант / инородное тело" },
];

/** ACR BI-RADS assessment categories: likelihood of malignancy and management (own wording). */
export const BIRADS_CATEGORY_INFO: Record<BiradsCategory, BiradsCategoryInfo> = {
  "0": {
    category: "0",
    labelRu: "BI-RADS 0 · оценка неполная",
    likelihoodRu: "не применимо",
    managementRu: "Дополнительное обследование и/или сравнение с предыдущими снимками.",
  },
  "1": { category: "1", labelRu: "BI-RADS 1 · норма", likelihoodRu: "практически 0%", managementRu: "Плановый скрининг по возрасту." },
  "2": { category: "2", labelRu: "BI-RADS 2 · доброкачественные изменения", likelihoodRu: "практически 0%", managementRu: "Плановый скрининг по возрасту." },
  "3": {
    category: "3",
    labelRu: "BI-RADS 3 · вероятно доброкачественное",
    likelihoodRu: "> 0% и ≤ 2%",
    managementRu: "Контрольное УЗИ через 6 месяцев, затем периодическое наблюдение.",
  },
  "4A": { category: "4A", labelRu: "BI-RADS 4A · низкая подозрительность", likelihoodRu: "> 2% и ≤ 10%", managementRu: "Морфологическая верификация (биопсия)." },
  "4B": { category: "4B", labelRu: "BI-RADS 4B · умеренная подозрительность", likelihoodRu: "> 10% и ≤ 50%", managementRu: "Морфологическая верификация (биопсия)." },
  "4C": { category: "4C", labelRu: "BI-RADS 4C · высокая подозрительность", likelihoodRu: "> 50% и < 95%", managementRu: "Морфологическая верификация (биопсия)." },
  "5": { category: "5", labelRu: "BI-RADS 5 · высоко подозрительно на злокачественность", likelihoodRu: "≥ 95%", managementRu: "Морфологическая верификация (биопсия)." },
  "6": {
    category: "6",
    labelRu: "BI-RADS 6 · верифицированная злокачественность",
    likelihoodRu: "не применимо",
    managementRu: "Хирургическое лечение при клинических показаниях.",
  },
};

export const BIRADS_SUSPICIOUS_LABEL_RU: Record<string, string> = {
  irregular_shape: "неправильная форма",
  non_parallel: "непараллельная ориентация",
  non_circumscribed_margin: "нечёткий / угловатый / спикулярный контур",
  mixed_solid_cystic: "смешанная солидно-кистозная структура",
  microcalcifications: "микрокальцинаты",
  architectural_distortion: "архитектурная перестройка",
  duct_changes: "изменения протоков",
  skin_retraction: "втяжение кожи",
};
