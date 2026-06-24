import type { LnPatternId } from "../types";

export type LnAtlasEntry = {
  id: string;
  titleRu: string;
  imageFile: string;
  shapeCategory?: LnPatternId;
  description: string;
  teachingPoints: string[];
  ultrasoundFindings: string[];
  dopplerFindings: string[];
  typicalLnRads: string;
};

export const LN_ATLAS_INTRO =
  "Визуальный атлас LN-RADS US: морфология (форма, hilum, кора), B-mode и Color Doppler. " +
  "Основан на EFSUMB/WFUMB head & neck, SRU, ATA neck nodes, breast axillary node criteria.";

export const LN_ATLAS_ENTRIES: LnAtlasEntry[] = [
  {
    id: "shape_atlas",
    titleRu: "Форма ЛУ: B-mode + Doppler (сравнение)",
    imageFile: "lymph_node_shape_atlas.png",
    description:
      "Сравнение oval, round, lobulated, spiculated: схема, B-mode и Color Doppler. " +
      "Oval + hilar flow — benign; round + eccentric cortex — suspicious; spiculated — malignant.",
    teachingPoints: [
      "Овальная форма (L/S > 2) + hilum — LN-RADS 1–2",
      "Round + displaced hilum — LN-RADS 3–4",
      "Lobulated — оценивать контекст (reactive vs metastasis)",
      "Spiculated + chaotic flow — LN-RADS 5",
    ],
    ultrasoundFindings: ["Кора (1)", "Кapsula (2)", "Hilum (3)", "Hilar vessel (4)", "Intranodal flow (5)"],
    dopplerFindings: ["Hilar (c)", "Displaced hilar (f)", "Lobulated hilar (i)", "Chaotic/absent (l)"],
    typicalLnRads: "Зависит от строки: 1–2 / 3–4 / 4–5",
  },
  {
    id: "normal_oval",
    titleRu: "Нормальный овальный ЛУ",
    imageFile: "normal_oval_node.svg",
    shapeCategory: "oval",
    description: "Типичная доброкачественная морфология: тонкая кора, сохранённый hilum.",
    teachingPoints: ["L/S > 2", "Thin uniform cortex < 3 mm", "Echogenic hilum"],
    ultrasoundFindings: ["Овальная форма", "Hypoechoic rim", "Echogenic center"],
    dopplerFindings: ["Central/hilar flow"],
    typicalLnRads: "LN-RADS 1",
  },
  {
    id: "reactive",
    titleRu: "Реактивный лимфоузел",
    imageFile: "reactive_node.svg",
    shapeCategory: "reactive",
    description: "Реактивная гиперплазия с сохранённой архитектурой.",
    teachingPoints: ["Uniform cortical thickening", "Hilum preserved", "Clinical infection context"],
    ultrasoundFindings: ["Enlarged oval", "Cortex thickened uniformly"],
    dopplerFindings: ["Increased hilar flow"],
    typicalLnRads: "LN-RADS 2",
  },
  {
    id: "round_metastatic",
    titleRu: "Округлый метастатический ЛУ",
    imageFile: "round_metastatic_node.svg",
    shapeCategory: "round",
    description: "Округлый узел с eccentric cortex и смещённым hilum.",
    teachingPoints: ["L/S approaching 1", "Eccentric cortical thickening", "FNA indicated"],
    ultrasoundFindings: ["Round", "Hypoechoic", "Compressed/displaced hilum"],
    dopplerFindings: ["Peripheral/penetrating vessels"],
    typicalLnRads: "LN-RADS 4",
  },
  {
    id: "lobulated_reactive",
    titleRu: "Дольчатый (lobulated) ЛУ",
    imageFile: "lobulated_reactive_node.svg",
    shapeCategory: "lobulated",
    description: "Lobulated margins — может быть reactive или suspicious в зависимости от hilum/Doppler.",
    teachingPoints: ["Assess hilum and cortex symmetry", "Not automatically malignant"],
    ultrasoundFindings: ["Lobulated capsule", "Variable cortex"],
    dopplerFindings: ["Hilar if reactive; peripheral if metastatic"],
    typicalLnRads: "LN-RADS 2–4",
  },
  {
    id: "spiculated_malignant",
    titleRu: "Spiculated — злокачественный ЛУ",
    imageFile: "spiculated_malignant_node.svg",
    shapeCategory: "spiculated",
    description: "Неровные spiculated margins — признак extracapsular extension.",
    teachingPoints: ["Highly suspicious", "Staging and urgent biopsy"],
    ultrasoundFindings: ["Irregular/spiculated", "Architecture replaced"],
    dopplerFindings: ["Chaotic or sparse flow"],
    typicalLnRads: "LN-RADS 5",
  },
  {
    id: "lymphoma",
    titleRu: "Лимфома",
    imageFile: "lymphoma_node.svg",
    description: "Homogeneous hypoechoic node с утратой hilum.",
    teachingPoints: ["Softer than carcinoma on elastography (classic teaching)", "Multiple sites"],
    ultrasoundFindings: ["Round hypoechoic", "Hilum absent"],
    dopplerFindings: ["Mixed/chaotic hypervascularity"],
    typicalLnRads: "LN-RADS 4",
  },
  {
    id: "tuberculosis",
    titleRu: "Туберкулёзный лимфаденит",
    imageFile: "tuberculosis_node.svg",
    shapeCategory: "necrotic",
    description: "Caseating necrosis с peripheral enhancement pattern.",
    teachingPoints: ["Matting/conglomerates", "Differentiate from metastatic necrosis"],
    ultrasoundFindings: ["Heterogeneous", "Central fluid/necrosis"],
    dopplerFindings: ["Rim vascularity"],
    typicalLnRads: "LN-RADS 4",
  },
  {
    id: "thyroid_metastasis",
    titleRu: "Метастаз ПЖК (PTC)",
    imageFile: "thyroid_metastasis_node.svg",
    shapeCategory: "calcified",
    description: "Метастаз papillary thyroid carcinoma с microcalcifications.",
    teachingPoints: ["Microcalcifications highly specific for PTC", "ATA Level VI/VII assessment"],
    ultrasoundFindings: ["Round", "Microcalcifications", "Cystic change possible"],
    dopplerFindings: ["Peripheral/chaotic"],
    typicalLnRads: "LN-RADS 4–5",
  },
  {
    id: "breast_metastasis",
    titleRu: "Метастаз рака молочной железы",
    imageFile: "breast_metastasis_node.svg",
    description: "Подмышечный метастатический ЛУ — корреляция с BI-RADS primary.",
    teachingPoints: ["Correlate with ipsilateral breast lesion", "Sentinel node mapping"],
    ultrasoundFindings: ["Round axillary node", "Eccentric cortex", "Absent hilum"],
    dopplerFindings: ["Peripheral flow"],
    typicalLnRads: "LN-RADS 4",
  },
  {
    id: "gyn_metastasis",
    titleRu: "Гинекологический метастаз",
    imageFile: "gynecologic_metastasis_node.svg",
    description: "Тазовый метастатический ЛУ в гинекологической онкологии.",
    teachingPoints: ["Obturator/internal iliac chains", "FIGO correlation"],
    ultrasoundFindings: ["Round hypoechoic pelvic nodes", "Necrosis in advanced cases"],
    dopplerFindings: ["Abnormal peripheral flow"],
    typicalLnRads: "LN-RADS 4–5",
  },
];

export function atlasImageUrl(imageFile: string, basePath = "/images/lymphnodes"): string {
  return `${basePath}/${imageFile}`;
}

export function atlasByShape(shape: LnPatternId): LnAtlasEntry[] {
  return LN_ATLAS_ENTRIES.filter((e) => e.shapeCategory === shape || e.id.includes(shape));
}
