/** Библиотека патологий МЖ для дифференциального диагноза (УЗИ). */

export type BiradsPathologyId =
  | "simple_cyst"
  | "complicated_cyst"
  | "clustered_microcysts"
  | "fibroadenoma"
  | "lipoma"
  | "papilloma"
  | "fat_necrosis"
  | "abscess"
  | "galactocele"
  | "radial_scar"
  | "dcis"
  | "idc"
  | "ilc"
  | "metastatic_node";

export type BiradsPathologyEntry = {
  id: BiradsPathologyId;
  nameRu: string;
  imageFile: string;
  /** Реальная эхограмма (jpg/png). Если задано — показывается вместо SVG-заглушки. */
  realExampleImage?: string;
  /** Описание реального примера (подпись к эхограмме). */
  realExampleCaption?: string;
  typicalBirads: string;
  ultrasoundAppearance: string[];
  keySigns: string[];
  differential: string[];
  educationSummary: string;
  searchTags: string[];
};

export const BIRADS_PATHOLOGY_LIBRARY: BiradsPathologyEntry[] = [
  {
    id: "simple_cyst",
    nameRu: "Простая киста",
    imageFile: "simple_cyst.svg",
    realExampleImage: "/images/breast/fibroadenoma_cyst_example.jpg",
    realExampleCaption: "Реальная эхограмма: анэхогенное образование с гиперэхогенным ободком (справа) — простая киста. Слева — фиброаденома для сравнения.",
    typicalBirads: "BI-RADS 2",
    ultrasoundAppearance: [
      "Овальная/круглая, анэхогенная",
      "Чёткие контуры, параллельная ориентация",
      "Усиление позади (posterior enhancement)",
    ],
    keySigns: ["Anechoic", "Circumscribed", "Parallel", "No internal vascularity"],
    differential: ["Complicated cyst", "Clustered microcysts", "Solid mass with necrosis"],
    educationSummary: "Типичная простая киста — доброкачественная находка BI-RADS 2 при классической картине.",
    searchTags: ["киста", "анэхоген", "простая", "cyst"],
  },
  {
    id: "complicated_cyst",
    nameRu: "Осложнённая киста",
    imageFile: "complicated_cyst.svg",
    typicalBirads: "BI-RADS 4A (до верификации)",
    ultrasoundAppearance: [
      "Кистозное образование с эхогенным содержимым / septa",
      "Может быть гипоэхогенным с внутренними включениями",
    ],
    keySigns: ["Mobile internal echoes", "Wall thickening — подозрительно", "Avascular septa — доброкачественнее"],
    differential: ["Simple cyst", "Solid hypoechoic mass", "Abscess"],
    educationSummary: "Осложнённая киста требует описания стенки, septa и васкуляризации; часто 4A до аспирации/контроля.",
    searchTags: ["осложнённая", "complicated", "septa"],
  },
  {
    id: "clustered_microcysts",
    nameRu: "Кластер микрокист",
    imageFile: "clustered_microcysts.svg",
    typicalBirads: "BI-RADS 2–3",
    ultrasoundAppearance: ["Группа микрокист <2–3 мм", "Тонкие septa", "Без солидного компонента"],
    keySigns: ["Clustered anechoic spaces", "No solid nodule"],
    differential: ["Complicated cyst", "Solid mass with microcystic areas"],
    educationSummary: "Кластер микрокист — обычно доброкачественный; BI-RADS 2–3 при отсутствии солидных участков.",
    searchTags: ["микрокист", "cluster", "кластер"],
  },
  {
    id: "fibroadenoma",
    nameRu: "Фиброаденома",
    imageFile: "fibroadenoma.svg",
    realExampleImage: "/images/breast/fibroadenoma_cyst_example.jpg",
    realExampleCaption: "Реальная эхограмма: изоэхогенное солидное образование (слева) — фиброаденома. Справа — простая киста для сравнения.",
    typicalBirads: "BI-RADS 3",
    ultrasoundAppearance: [
      "Овальное гипоэхогенное образование",
      "Параллельная ориентация, чёткие контуры",
      "Может быть lobulated, усиление позади",
    ],
    keySigns: ["Oval", "Circumscribed", "Parallel", "Hypoechoic", "Gentle lobulations"],
    differential: ["Phyllodes tumor", "IDC", "Lipoma (hyperechoic)"],
    educationSummary: "Классическая Фиброаденома — BI-RADS 3 при типичной картине у молодых пациенток.",
    searchTags: ["Фиброаденома", "Фиброаденома", "гипоэхоген", "oval"],
  },
  {
    id: "lipoma",
    nameRu: "Липома",
    imageFile: "lipoma.svg",
    typicalBirads: "BI-RADS 2",
    ultrasoundAppearance: ["Гиперэхогенное/изоэхогенное", "Овальное, чёткие контуры", "Параллельное"],
    keySigns: ["Hyperechoic", "Thin capsule", "No posterior shadow"],
    differential: ["Fat necrosis", "Hamartoma", "Normal fat lobule"],
    educationSummary: "Липома — типично BI-RADS 2 при гиперэхогенности и чётких контурах.",
    searchTags: ["липома", "lipoma", "гиперэхоген"],
  },
  {
    id: "papilloma",
    nameRu: "Внутрипротоковая папиллома",
    imageFile: "papilloma.svg",
    typicalBirads: "BI-RADS 4A–4B",
    ultrasoundAppearance: [
      "Солидное образование в расширенном протоке",
      "Может быть гипоэхогенным с кровотоком",
    ],
    keySigns: ["Intraductal mass", "Duct dilatation", "Bloody discharge — клиника"],
    differential: ["DCIS", "Papillary carcinoma", "Mucinous debris"],
    educationSummary: "Папilloma часто 4A–4B; верификация при солидном компоненте в протоке.",
    searchTags: ["папиллома", "проток", "intraductal"],
  },
  {
    id: "fat_necrosis",
    nameRu: "Жировой некроз",
    imageFile: "fat_necrosis.svg",
    typicalBirads: "BI-RADS 2–4A",
    ultrasoundAppearance: [
      "Гиперэхогенный центр с гипоэхогенным ободком",
      "Может имитировать рак после травмы/операции",
    ],
    keySigns: ["History of trauma/surgery", "Echogenic rim", "No spiculation"],
    differential: ["IDC", "Oil cyst", "Abscess"],
    educationSummary: "Жировой некроз — важен анамнез; типично доброкачественный, но может быть 4A при сомнениях.",
    searchTags: ["некроз", "fat necrosis", "травма"],
  },
  {
    id: "abscess",
    nameRu: "Абсцесс",
    imageFile: "abscess.svg",
    typicalBirads: "BI-RADS 4A (клинический контекст)",
    ultrasoundAppearance: [
      "Гипоэхогенная/смешанная зона с гиперемией",
      "Нечёткие контуры, отёк окружающих тканей",
    ],
    keySigns: ["Fever/pain", "Hypervascular wall", "Skin thickening"],
    differential: ["Inflammatory carcinoma", "Complicated cyst", "Galactocele"],
    educationSummary: "Абсцесс — клиника решает; после лечения переклассифицировать.",
    searchTags: ["абсцесс", "abscess", "воспаление"],
  },
  {
    id: "galactocele",
    nameRu: "Galactocele",
    imageFile: "galactocele.svg",
    typicalBirads: "BI-RADS 2–3",
    ultrasoundAppearance: ["Кистозно-солидное в лактации", "Содержимое с жирной/fluid level"],
    keySigns: ["Lactation", "Mixed echogenicity", "Mobile contents"],
    differential: ["Complicated cyst", "Abscess"],
    educationSummary: "Galactocele — доброкачественная находка периода лактации.",
    searchTags: ["galactocele", "лактация", "грудное"],
  },
  {
    id: "radial_scar",
    nameRu: "Радиальный рубец",
    imageFile: "radial_scar.svg",
    typicalBirads: "BI-RADS 4A–4C",
    ultrasoundAppearance: [
      "Architectural distortion без явной массы",
      "Гипоэхогенный центр с лучистостью",
    ],
    keySigns: ["Architectural distortion", "Long spicules on MMG", "No central mass on US sometimes"],
    differential: ["IDC", "DCIS", "Post-op scar"],
    educationSummary: "Радиальный рубец — подозрительная находка; биопсия для исключения рака.",
    searchTags: ["radial scar", "архитектоника", "distortion"],
  },
  {
    id: "dcis",
    nameRu: "DCIS (in situ)",
    imageFile: "dcis.svg",
    typicalBirads: "BI-RADS 4–5",
    ultrasoundAppearance: [
      "Non-mass / ductal changes",
      "Microcalcifications, intraductal mass",
    ],
    keySigns: ["Segmental distribution", "Intraductal calcifications", "NML hypoechoic"],
    differential: ["Papilloma", "IDC", "Atypical ductal hyperplasia"],
    educationSummary: "DCIS часто проявляется как NML или протоковые изменения; верификация обязательна.",
    searchTags: ["dcis", "in situ", "протоковый"],
  },
  {
    id: "birads5_cancer_example",
    nameRu: "Архетип BI-RADS 5: высокий риск",
    imageFile: "idc.svg",
    realExampleImage: "/images/breast/birads5-ovarian-cancer-1.jpg",
    realExampleCaption: "Реальная эхограмма: высокая вероятность ЗНО — BI-RADS 5.",
    typicalBirads: "BI-RADS 5",
    ultrasoundAppearance: [
      "Сложное солидно-кистозное образование",
      "Выпячивания стенки / папиллярные элементы",
      "Усиленная васкуляризация",
      "Возможен асцит / нодальная диссеминация",
    ],
    keySigns: ["High suspicion mass", "Spiculated or microlobulated", "Axillary node suspicious"],
    differential: ["IDC", "ILC", "Metastatic node"],
    educationSummary: "Пациентке показана морфологическая верификация и онкомаршрут. Интерпретация — специалистом; не диагноз.",
    searchTags: ["бирадс 5", "рак молочной железы", "подозрение"],
  },
  {
    id: "idc",
    nameRu: "Инвазивный протоковый рак (IDC)",
    imageFile: "idc.svg",
    typicalBirads: "BI-RADS 4C–5",
    ultrasoundAppearance: [
      "Неправильная форма, непараллельная",
      "Spiculated/indistinct margins",
      "Hypoechoic, posterior shadow",
    ],
    keySigns: ["Spiculated", "Non-parallel", "Marked vascularity"],
    differential: ["ILC", "Radial scar", "Fibroadenoma (atypical)"],
    educationSummary: "IDC — классическая злокачественная картина mass; BI-RADS 4C–5.",
    searchTags: ["idc", "инвазивный", "протоковый", "рак"],
  },
  {
    id: "ilc",
    nameRu: "Инвазивный дольковый рак (ILC)",
    imageFile: "ilc.svg",
    typicalBirads: "BI-RADS 4B–5",
    ultrasoundAppearance: [
      "Гипоэхогенная зона без чётких границ",
      "Architectural distortion, subtle mass",
    ],
    keySigns: ["Ill-defined hypoechoic area", "Parallel orientation possible", "Asymmetric thickening"],
    differential: ["IDC", "Radial scar", "Normal asymmetry"],
    educationSummary: "ILC часто малозаметен на УЗИ; подозрение по NML и асимметрии.",
    searchTags: ["ilc", "дольковый", "lobular"],
  },
  {
    id: "metastatic_node",
    nameRu: "Метастатический лимфоузел",
    imageFile: "metastatic_node.svg",
    typicalBirads: "BI-RADS 5 (контекст)",
    ultrasoundAppearance: [
      "Округлый ЛУ, утолщение коры >3 мм",
      "Потеря/замещение ворот",
      "Эхогенные включения, периферическая васкуляризация",
    ],
    keySigns: ["Cortex >3 mm", "Hilum effaced", "Round shape"],
    differential: ["Reactive lymph node", "Lymphoma", "Intramammary node"],
    educationSummary: "Подозрительный регионарный ЛУ повышает стадию и требует верификации.",
    searchTags: ["лимфоузел", "метастаз", "axilla", "подмышеч"],
  },
];

export function searchPathology(query: string): BiradsPathologyEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return BIRADS_PATHOLOGY_LIBRARY;
  return BIRADS_PATHOLOGY_LIBRARY.filter(
    (p) =>
      p.nameRu.toLowerCase().includes(q) ||
      p.searchTags.some((t) => t.includes(q)) ||
      p.typicalBirads.toLowerCase().includes(q),
  );
}
