export type LnAnatomyRegion = {
  id: string;
  labelRu: string;
  levels?: string[];
  normalAnatomy: string;
  drainageTerritories: string;
  metastaticPatterns: string;
  recommendations: string;
  module?: "head_neck" | "thyroid" | "breast" | "gynecologic";
};

export const HEAD_NECK_LEVELS = [
  { id: "level_i", label: "Level I — submental/submandibular" },
  { id: "level_ii", label: "Level II — upper jugular" },
  { id: "level_iii", label: "Level III — mid jugular" },
  { id: "level_iv", label: "Level IV — lower jugular" },
  { id: "level_v", label: "Level V — posterior triangle" },
  { id: "level_vi", label: "Level VI — central compartment (visceral)" },
  { id: "level_vii", label: "Level VII — superior mediastinal" },
];

export const ANATOMY_REGIONS: LnAnatomyRegion[] = [
  {
    id: "head_neck",
    labelRu: "Head & Neck — обзор",
    module: "head_neck",
    normalAnatomy: "Цепочки jugular, spinal accessory, transverse cervical; central compartment Level VI.",
    drainageTerritories: "Кожа лица/головы → I–V; полость рта → I–III; щитовидная → VI; posterior scalp → V.",
    metastaticPatterns: "HNSCC — II–IV; PTC — VI, lateral neck; melanoma — basin-specific.",
    recommendations: "ATA neck node map; описывать level, size short axis, morphology, ECE signs.",
  },
  ...HEAD_NECK_LEVELS.map((l) => ({
    id: l.id,
    labelRu: l.label,
    module: "head_neck" as const,
    normalAnatomy: "Овальные узлы с сохранённым hilum; размер зависит от уровня.",
    drainageTerritories: l.label.split("—")[1]?.trim() ?? "",
    metastaticPatterns: "Зависит от первичного очага; см. HNSCC/thyroid modules.",
    recommendations: "FNA при suspicious morphology per SRU/ATA.",
  })),
  {
    id: "thyroid_module",
    labelRu: "Thyroid Cancer Module",
    module: "thyroid",
    normalAnatomy: "Level VI central nodes; lateral II–V for PTC.",
    drainageTerritories: "PTC → central + lateral; medullary → levels II–V; anaplastic — extensive.",
    metastaticPatterns:
      "Papillary: microcalcifications, cystic change; Follicular: hematogenous; Medullary: calcitonin correlate; Anaplastic: fixed conglomerates.",
    recommendations: "ATA 2015/2023 neck node guidelines; Tg washout on FNA.",
  },
  {
    id: "breast_module",
    labelRu: "Breast Module",
    module: "breast",
    normalAnatomy: "Axillary levels I–III; internal mammary chain; supraclavicular (Rotter).",
    drainageTerritories: "Upper outer quadrant → axillary; medial → internal mammary.",
    metastaticPatterns: "Round axillary node, eccentric cortex, hilum loss — correlate with BI-RADS.",
    recommendations: "ACR BI-RADS axillary node section; sentinel node biopsy protocol.",
  },
  {
    id: "gyn_module",
    labelRu: "Gynecologic Oncology Module",
    module: "gynecologic",
    normalAnatomy: "Pelvic: external/internal iliac, obturator, common iliac; para-aortic; inguinal.",
    drainageTerritories: "Cervix → obturator, internal iliac, parametrial; Endometrium → iliac, para-aortic; Ovary → para-aortic, pelvic.",
    metastaticPatterns: "Round hypoechoic nodes; necrosis in advanced disease; matting in TBC differential.",
    recommendations: "FIGO staging imaging; correlate with primary tumor site.",
  },
];

export const THYROID_CANCER_TYPES = [
  { id: "ptc", nameRu: "Papillary thyroid carcinoma", lnPattern: "Microcalcifications, round Level VI nodes" },
  { id: "ftc", nameRu: "Follicular carcinoma", lnPattern: "Hematogenous spread; less common nodal disease" },
  { id: "mtc", nameRu: "Medullary carcinoma", lnPattern: "Bilateral/multilevel nodes early" },
  { id: "atc", nameRu: "Anaplastic carcinoma", lnPattern: "Fixed conglomerates, invasion" },
  { id: "thy_lymphoma", nameRu: "Thyroid lymphoma", lnPattern: "Multiple enlarged nodes, homogeneous" },
];

export const GYN_CORRELATIONS = [
  { cancer: "Cervical cancer", nodes: "Obturator, internal iliac, parametrial, para-aortic" },
  { cancer: "Endometrial cancer", nodes: "Pelvic iliac, para-aortic" },
  { cancer: "Ovarian cancer", nodes: "Para-aortic (primary drainage), pelvic" },
];
