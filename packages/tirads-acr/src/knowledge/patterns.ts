import type { TiradsAcrInput } from "../types";

export type ThyroidPatternId =
  | "colloid_nodule"
  | "hyperplastic_nodule"
  | "spongiform_nodule"
  | "simple_cyst"
  | "hemorrhagic_cyst"
  | "follicular_adenoma"
  | "hurthle_cell_adenoma"
  | "follicular_neoplasm"
  | "hashimoto_pseudonodule"
  | "parathyroid_adenoma"
  | "subacute_thyroiditis"
  | "multinodular_goiter"
  | "thyroid_abscess"
  | "papillary_carcinoma"
  | "tall_cell_ptc"
  | "cystic_papillary_carcinoma"
  | "diffuse_sclerosing_ptc"
  | "follicular_carcinoma"
  | "invasive_follicular_variant"
  | "medullary_carcinoma"
  | "anaplastic_carcinoma"
  | "insular_carcinoma"
  | "thyroid_lymphoma"
  | "metastatic_lesion"
  | "niftp"
  | "benign_cervical_lymph_node"
  | "suspicious_cervical_lymph_node";

export type ThyroidPatternEntry = {
  id: ThyroidPatternId;
  nameRu: string;
  category: "benign" | "borderline" | "malignant";
  typicalTirads: string;
  imageFile: string;
  ultrasoundAppearance: string[];
  keySigns: string[];
  differential: string[];
  educationSummary: string;
  preset: Partial<TiradsAcrInput>;
  searchTags: string[];
};

export const THYROID_PATTERN_LIBRARY: ThyroidPatternEntry[] = [
  {
    id: "colloid_nodule",
    nameRu: "Коллоидный узел",
    category: "benign",
    typicalTirads: "TR2",
    imageFile: "colloid_nodule.svg",
    ultrasoundAppearance: ["Изо-/гиперэхогенный", "Spongiform / comet-tail", "Чёткие контуры"],
    keySigns: ["Comet-tail artifacts", "Spongiform", "Wider-than-tall"],
    differential: ["Hyperplastic nodule", "Follicular adenoma"],
    educationSummary: "Классический доброкачественный паттерн — TR2, FNA не нужна.",
    preset: {
      composition: "spongiform",
      echogenicity: "hyperechoic_or_isoechoic",
      shape: "wider_than_tall",
      margin: "smooth",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["colloid", "коллоид", "comet"],
  },
  {
    id: "spongiform_nodule",
    nameRu: "Spongiform узел",
    category: "benign",
    typicalTirads: "TR2",
    imageFile: "spongiform_nodule.svg",
    ultrasoundAppearance: [">50% microcystic spaces", "No suspicious margins"],
    keySigns: ["Spongiform", "0 points composition"],
    differential: ["Colloid nodule", "Simple cyst cluster"],
    educationSummary: "Spongiform — 0 points, TR2.",
    preset: {
      composition: "spongiform",
      echogenicity: "hyperechoic_or_isoechoic",
      shape: "wider_than_tall",
      margin: "smooth",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["spongiform", "губчатый"],
  },
  {
    id: "simple_cyst",
    nameRu: "Простая киста",
    category: "benign",
    typicalTirads: "TR2",
    imageFile: "simple_cyst.svg",
    ultrasoundAppearance: ["Anechoic", "Posterior enhancement", "Thin wall"],
    keySigns: ["Cystic composition", "Anechoic"],
    differential: ["Hemorrhagic cyst", "Parathyroid cyst"],
    educationSummary: "Простая киста — TR2, наблюдение.",
    preset: {
      composition: "cystic",
      echogenicity: "anechoic",
      shape: "wider_than_tall",
      margin: "smooth",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["киста", "cyst"],
  },
  {
    id: "hemorrhagic_cyst",
    nameRu: "Геморрагическая киста",
    category: "benign",
    typicalTirads: "TR2–TR3",
    imageFile: "hemorrhagic_cyst.svg",
    ultrasoundAppearance: ["Internal echoes", "Fluid level", "May shrink on follow-up"],
    keySigns: ["Cystic with debris", "No solid vascular nodule"],
    differential: ["Solid nodule", "Papillary carcinoma cystic variant"],
    educationSummary: "Геморрагическая киста — обычно TR2–TR3; FNA при солидном компоненте.",
    preset: {
      composition: "mixed",
      echogenicity: "hypoechoic",
      shape: "wider_than_tall",
      margin: "smooth",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["геморраг", "hemorrhagic"],
  },
  {
    id: "hyperplastic_nodule",
    nameRu: "Гиперпластический узел",
    category: "benign",
    typicalTirads: "TR2–TR3",
    imageFile: "colloid_nodule.svg",
    ultrasoundAppearance: ["Isoechoic solid", "Smooth margin"],
    keySigns: ["Isoechoic", "Wider-than-tall"],
    differential: ["Follicular adenoma", "PTC isoechoic"],
    educationSummary: "Гиперпластический узел — часто TR2–TR3.",
    preset: {
      composition: "solid",
      echogenicity: "hyperechoic_or_isoechoic",
      shape: "wider_than_tall",
      margin: "smooth",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["hyperplastic", "гиперпласт"],
  },
  {
    id: "parathyroid_adenoma",
    nameRu: "Аденома паращитовидной железы",
    category: "benign",
    typicalTirads: "TR2–TR3",
    imageFile: "normal_thyroid.svg",
    ultrasoundAppearance: ["Hypoechoic oval", "Posterior to thyroid", "Polar feeding vessel"],
    keySigns: ["Ectopic location", "Not true thyroid nodule"],
    differential: ["Lymph node", "Thyroid nodule"],
    educationSummary: "Паращитовидная adenoma — вне TI-RADS — вне TI-RADS узла; локализация ключевая.",
    preset: {
      composition: "solid",
      echogenicity: "hypoechoic",
      shape: "wider_than_tall",
      margin: "smooth",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["parathyroid", "паращитовид"],
  },
  {
    id: "subacute_thyroiditis",
    nameRu: "Подострый тиреоидит (De Quervain)",
    category: "benign",
    typicalTirads: "TR2–TR3",
    imageFile: "normal_thyroid.svg",
    ultrasoundAppearance: ["Ill-defined hypoechoic areas", "Painful gland", "Reduced vascularity"],
    keySigns: ["Clinical pain", "Elevated ESR", "Patchy involvement"],
    differential: ["PTC", "Lymphoma"],
    educationSummary: "Подострый тиреоидит — клиника важнее TI-RADS; FNA обычно не нужна.",
    preset: {
      composition: "solid",
      echogenicity: "hypoechoic",
      shape: "wider_than_tall",
      margin: "ill_defined",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["de quervain", "подострый", "thyroiditis"],
  },
  {
    id: "multinodular_goiter",
    nameRu: "Многоузловой зоб",
    category: "benign",
    typicalTirads: "TR2–TR4",
    imageFile: "normal_thyroid.svg",
    ultrasoundAppearance: ["Multiple nodules", "Variable echogenicity", "Dominant nodule scoring"],
    keySigns: ["Score dominant nodule only", "Heterogeneous gland"],
    differential: ["Metastasis", "PTC dominant nodule"],
    educationSummary: "MNG — оценивать доминирующий узел по ACR TI-RADS.",
    preset: {
      composition: "mixed",
      echogenicity: "hyperechoic_or_isoechoic",
      shape: "wider_than_tall",
      margin: "smooth",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["goiter", "зоб", "mng"],
  },
  {
    id: "thyroid_abscess",
    nameRu: "Абсцесс щитовидной железы",
    category: "benign",
    typicalTirads: "TR3–TR4",
    imageFile: "hemorrhagic_cyst.svg",
    ultrasoundAppearance: ["Complex cystic", "Peripheral hyperemia", "Clinical infection"],
    keySigns: ["Fever", "Pain", "Complex fluid collection"],
    differential: ["Hemorrhagic cyst", "Necrotic carcinoma"],
    educationSummary: "Абсцесс — не TI-RADS malignancy; срочная клиника + drainage.",
    preset: {
      composition: "mixed",
      echogenicity: "hypoechoic",
      shape: "wider_than_tall",
      margin: "ill_defined",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["abscess", "абсцесс"],
  },
  {
    id: "hashimoto_pseudonodule",
    nameRu: "Псевдоузел при Hashimoto",
    category: "benign",
    typicalTirads: "TR2–TR3",
    imageFile: "normal_thyroid.svg",
    ultrasoundAppearance: ["Heterogeneous parenchyma", "Isoechoic ill-defined"],
    keySigns: ["Diffuse thyroiditis", "No punctate calcifications"],
    differential: ["PTC", "Lymphoma"],
    educationSummary: "Псевдоузел — контекст AIT; осторожность с TR4–5 без классических признаков.",
    preset: {
      composition: "solid",
      echogenicity: "hyperechoic_or_isoechoic",
      shape: "wider_than_tall",
      margin: "ill_defined",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["hashimoto", "аит", "thyroiditis"],
  },
  {
    id: "follicular_adenoma",
    nameRu: "Фолликулярная аденома",
    category: "borderline",
    typicalTirads: "TR3–TR4",
    imageFile: "follicular_adenoma.svg",
    ultrasoundAppearance: ["Solid iso-/hypoechoic", "Thin halo", "Peripheral vascularity"],
    keySigns: ["Halo sign", "Peripheral flow"],
    differential: ["Follicular carcinoma", "NIFTP", "Hyperplastic nodule"],
    educationSummary: "FA не исключает рак на УЗИ — FNA по размеру/TR.",
    preset: {
      composition: "solid",
      echogenicity: "hyperechoic_or_isoechoic",
      shape: "wider_than_tall",
      margin: "smooth",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["adenoma", "аденома", "фолликуляр"],
  },
  {
    id: "hurthle_cell_adenoma",
    nameRu: "Гёртле-клеточная аденома",
    category: "borderline",
    typicalTirads: "TR4",
    imageFile: "follicular_adenoma.svg",
    ultrasoundAppearance: ["Hypoechoic solid", "Hypervascular"],
    keySigns: ["Hypoechoic", "Marked vascularity"],
    differential: ["Hürthle cell carcinoma", "Medullary carcinoma"],
    educationSummary: "Hürthle — часто TR4, FNA по порогам.",
    preset: {
      composition: "solid",
      echogenicity: "hypoechoic",
      shape: "wider_than_tall",
      margin: "ill_defined",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["hurthle", "gurthle", "oxyphil"],
  },
  {
    id: "follicular_neoplasm",
    nameRu: "Фолликулярная neoplasia (Bethesda IV)",
    category: "borderline",
    typicalTirads: "TR4",
    imageFile: "follicular_adenoma.svg",
    ultrasoundAppearance: ["Solid hypoechoic", "Thick halo possible"],
    keySigns: ["Hypoechoic solid", "Size >2 cm increases FNA yield"],
    differential: ["Follicular adenoma", "Follicular carcinoma"],
    educationSummary: "Neoplasm — цитология Bethesda IV, не PTC pattern.",
    preset: {
      composition: "solid",
      echogenicity: "hypoechoic",
      shape: "wider_than_tall",
      margin: "smooth",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["neoplasm", "bethesda"],
  },
  {
    id: "niftp",
    nameRu: "NIFTP (неинвазивная фолликулярная neoplasia)",
    category: "borderline",
    typicalTirads: "TR3–TR4",
    imageFile: "follicular_adenoma.svg",
    ultrasoundAppearance: ["Solid iso-/hypoechoic", "Encapsulated appearance"],
    keySigns: ["Indistinguishable from FA on US", "Diagnosis histologic"],
    differential: ["Follicular adenoma", "Follicular carcinoma"],
    educationSummary: "NIFTP — УЗИ как FA; гистология после resection.",
    preset: {
      composition: "solid",
      echogenicity: "hyperechoic_or_isoechoic",
      shape: "wider_than_tall",
      margin: "smooth",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["niftp", "noninvasive"],
  },
  {
    id: "papillary_carcinoma",
    nameRu: "Папиллярный рак ЩЖ (PTC)",
    category: "malignant",
    typicalTirads: "TR5",
    imageFile: "papillary_carcinoma.svg",
    ultrasoundAppearance: [
      "Solid hypoechoic",
      "Taller-than-wide",
      "Irregular margin",
      "Punctate echogenic foci",
    ],
    keySigns: ["Taller-than-wide", "Punctate foci", "Very hypoechoic"],
    differential: ["Follicular carcinoma", "Lymph node metastasis"],
    educationSummary: "Классический PTC — TR5, FNA ≥1 см.",
    preset: {
      composition: "solid",
      echogenicity: "very_hypoechoic",
      shape: "taller_than_wide",
      margin: "lobulated_or_irregular",
      echogenicFoci: "punctate",
    },
    searchTags: ["ptc", "papillary", "папилляр"],
  },
  {
    id: "tall_cell_ptc",
    nameRu: "Tall cell variant PTC",
    category: "malignant",
    typicalTirads: "TR5",
    imageFile: "papillary_carcinoma.svg",
    ultrasoundAppearance: ["Large solid hypoechoic", "Irregular margin", "Extrathyroidal extension possible"],
    keySigns: ["Aggressive PTC variant", "Often larger at diagnosis"],
    differential: ["Classic PTC", "Anaplastic рак ЩЖ"],
    educationSummary: "Tall cell PTC — TR5; агрессивный вариант, ранняя FNA.",
    preset: {
      composition: "solid",
      echogenicity: "very_hypoechoic",
      shape: "taller_than_wide",
      margin: "lobulated_or_irregular",
      echogenicFoci: "punctate",
    },
    searchTags: ["tall cell", "ptc variant"],
  },
  {
    id: "cystic_papillary_carcinoma",
    nameRu: "Кистозный вариант PTC",
    category: "malignant",
    typicalTirads: "TR4–TR5",
    imageFile: "papillary_carcinoma.svg",
    ultrasoundAppearance: ["Mixed cystic-solid", "Solid mural nodule", "Punctate foci in wall"],
    keySigns: ["Vascular solid component", "Mural nodule"],
    differential: ["Hemorrhagic cyst", "Colloid cyst"],
    educationSummary: "Кистозный PTC — оценивать солидный компонент; часто TR4–TR5.",
    preset: {
      composition: "mixed",
      echogenicity: "very_hypoechoic",
      shape: "taller_than_wide",
      margin: "lobulated_or_irregular",
      echogenicFoci: "punctate",
    },
    searchTags: ["cystic ptc", "кистозный рак"],
  },
  {
    id: "diffuse_sclerosing_ptc",
    nameRu: "Diffuse sclerosing PTC",
    category: "malignant",
    typicalTirads: "TR4–TR5",
    imageFile: "papillary_carcinoma.svg",
    ultrasoundAppearance: ["Diffuse hypoechoic", "Microcalcifications", "Ill-defined"],
    keySigns: ["Young patients", "Diffuse involvement"],
    differential: ["Hashimoto", "Subacute thyroiditis"],
    educationSummary: "Diffuse sclerosing PTC — диффузные микрокальцинаты, TR4–TR5.",
    preset: {
      composition: "solid",
      echogenicity: "hypoechoic",
      shape: "wider_than_tall",
      margin: "ill_defined",
      echogenicFoci: "punctate",
    },
    searchTags: ["diffuse sclerosing", "dsp"],
  },
  {
    id: "follicular_carcinoma",
    nameRu: "Фолликулярный рак",
    category: "malignant",
    typicalTirads: "TR4–TR5",
    imageFile: "follicular_carcinoma.svg",
    ultrasoundAppearance: ["Solid hypoechoic", "Thick halo", "Hypervascular"],
    keySigns: ["Hypoechoic solid", "No punctate calcifications often"],
    differential: ["Follicular adenoma", "Hürthle cell neoplasm"],
    educationSummary: "FC — УЗИ не отличает от adenoma; FNA + гистология.",
    preset: {
      composition: "solid",
      echogenicity: "hypoechoic",
      shape: "wider_than_tall",
      margin: "lobulated_or_irregular",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["follicular carcinoma", "фолликулярный рак"],
  },
  {
    id: "invasive_follicular_variant",
    nameRu: "Invasive follicular variant PTC",
    category: "malignant",
    typicalTirads: "TR4–TR5",
    imageFile: "follicular_carcinoma.svg",
    ultrasoundAppearance: ["Solid hypoechoic", "Capsular invasion on histology"],
    keySigns: ["Follicular architecture", "PTC nuclear features histologically"],
    differential: ["Follicular carcinoma", "Follicular adenoma"],
    educationSummary: "IFVPTC — УЗИ как FC/FA; FNA + histology.",
    preset: {
      composition: "solid",
      echogenicity: "hypoechoic",
      shape: "wider_than_tall",
      margin: "lobulated_or_irregular",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["ifvptc", "follicular variant"],
  },
  {
    id: "medullary_carcinoma",
    nameRu: "Медуллярный рак ЩЖ (MTC)",
    category: "malignant",
    typicalTirads: "TR4–TR5",
    imageFile: "medullary_carcinoma.svg",
    ultrasoundAppearance: ["Hypoechoic solid", "Calcifications common"],
    keySigns: ["Solid hypoechoic", "Calcifications"],
    differential: ["PTC", "Metastasis"],
    educationSummary: "MTC — calcifications; MEN2 screening.",
    preset: {
      composition: "solid",
      echogenicity: "hypoechoic",
      shape: "taller_than_wide",
      margin: "lobulated_or_irregular",
      echogenicFoci: "macrocalcifications",
    },
    searchTags: ["medullary", "mtc"],
  },
  {
    id: "insular_carcinoma",
    nameRu: "Insular carcinoma",
    category: "malignant",
    typicalTirads: "TR5",
    imageFile: "anaplastic_carcinoma.svg",
    ultrasoundAppearance: ["Large hypoechoic mass", "Rapid growth", "Necrosis"],
    keySigns: ["Aggressive intermediate-grade", "Metastases early"],
    differential: ["Anaplastic рак ЩЖ", "Poorly differentiated carcinoma"],
    educationSummary: "Insular carcinoma — TR5, агрессивное течение.",
    preset: {
      composition: "solid",
      echogenicity: "very_hypoechoic",
      shape: "taller_than_wide",
      margin: "extrathyroidal_extension",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["insular", "инсуляр"],
  },
  {
    id: "anaplastic_carcinoma",
    nameRu: "Anaplastic рак ЩЖ",
    category: "malignant",
    typicalTirads: "TR5",
    imageFile: "anaplastic_carcinoma.svg",
    ultrasoundAppearance: ["Heterogeneous mass", "Extrathyroidal extension"],
    keySigns: ["ETE", "Rapid growth clinically"],
    differential: ["Thyroid lymphoma", "Sarcoma"],
    educationSummary: "Anaplastic — TR5 + ETE; срочная онкомаршрутизация.",
    preset: {
      composition: "solid",
      echogenicity: "very_hypoechoic",
      shape: "taller_than_wide",
      margin: "extrathyroidal_extension",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["anaplastic", "анaplastic"],
  },
  {
    id: "thyroid_lymphoma",
    nameRu: "Лимфома щитовидной железы",
    category: "malignant",
    typicalTirads: "TR4–TR5",
    imageFile: "papillary_carcinoma.svg",
    ultrasoundAppearance: ["Hypoechoic pseudo-nodule in AIT", "Diffuse or focal"],
    keySigns: ["Hashimoto background", "Rapid enlargement"],
    differential: ["AIT", "Anaplastic рак ЩЖ"],
    educationSummary: "Лимфома — часто на фоне AIT; core biopsy.",
    preset: {
      composition: "solid",
      echogenicity: "very_hypoechoic",
      shape: "wider_than_tall",
      margin: "ill_defined",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["lymphoma", "лимфoma"],
  },
  {
    id: "metastatic_lesion",
    nameRu: "Метастатическое поражение ЩЖ",
    category: "malignant",
    typicalTirads: "TR4–TR5",
    imageFile: "suspicious_lymph_node.svg",
    ultrasoundAppearance: ["Solid hypoechoic", "Known primary"],
    keySigns: ["History of malignancy", "Multiple lesions"],
    differential: ["Primary thyroid cancer", "Abscess"],
    educationSummary: "Метастаз в ЩЖ — редко; FNA + IHC.",
    preset: {
      composition: "solid",
      echogenicity: "hypoechoic",
      shape: "wider_than_tall",
      margin: "lobulated_or_irregular",
      echogenicFoci: "none_or_comet_tail",
    },
    searchTags: ["metastasis", "метастаз"],
  },
  {
    id: "benign_cervical_lymph_node",
    nameRu: "Доброкачественный лимфоузел",
    category: "benign",
    typicalTirads: "—",
    imageFile: "normal_thyroid.svg",
    ultrasoundAppearance: ["Oval shape", "Fatty hilum", "Central vascularity"],
    keySigns: ["Hilum present", "L/S ratio >2"],
    differential: ["Reactive node", "Metastatic node"],
    educationSummary: "Нормальный ЛУ — hilum + овальная форма; не повышает TI-RADS узла.",
    preset: {
      lymphNodes: "benign",
    },
    searchTags: ["lymph node", "limf", "hilum"],
  },
  {
    id: "suspicious_cervical_lymph_node",
    nameRu: "Подозрительный лимфоузел",
    category: "malignant",
    typicalTirads: "—",
    imageFile: "suspicious_lymph_node.svg",
    ultrasoundAppearance: ["Rounded", "Loss of hilum", "Microcalcifications", "Peripheral flow"],
    keySigns: ["Punctate calcifications", "Cystic change", "ETE correlate"],
    differential: ["Reactive node", "Lymphoma"],
    educationSummary: "Подозрительный ЛУ — FNA ЛУ + повышенная клиническая подозрительность узла.",
    preset: {
      lymphNodes: "suspicious",
    },
    searchTags: ["suspicious node", "метастаз лу"],
  },
];

export function searchPatterns(query: string): ThyroidPatternEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return THYROID_PATTERN_LIBRARY;
  return THYROID_PATTERN_LIBRARY.filter(
    (p) =>
      p.nameRu.toLowerCase().includes(q) ||
      p.searchTags.some((t) => t.includes(q)) ||
      p.typicalTirads.toLowerCase().includes(q),
  );
}

export function patternById(id: string): ThyroidPatternEntry | undefined {
  return THYROID_PATTERN_LIBRARY.find((p) => p.id === id);
}
