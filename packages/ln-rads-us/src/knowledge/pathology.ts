import type { LnPatternId, LnRadsCategory } from "../types";

export type LnPathologyId =
  | "normal_node"
  | "reactive_node"
  | "acute_lymphadenitis"
  | "chronic_lymphadenitis"
  | "tuberculous_lymphadenitis"
  | "sarcoidosis"
  | "cat_scratch"
  | "mononucleosis"
  | "hiv_lymphadenopathy"
  | "kikuchi"
  | "castleman"
  | "lymphoma"
  | "hodgkin_lymphoma"
  | "non_hodgkin_lymphoma"
  | "metastatic_node"
  | "ptc_metastasis"
  | "breast_metastasis"
  | "melanoma_metastasis"
  | "hnscc_metastasis"
  | "gyn_metastasis";

export type LnPathologyEntry = {
  id: LnPathologyId;
  nameRu: string;
  imageFile: string;
  typicalLnRads: LnRadsCategory;
  definition: string;
  pathophysiology: string;
  ultrasoundAppearance: string[];
  dopplerAppearance: string[];
  elastographyFindings: string[];
  differential: string[];
  clinicalPearls: string[];
  searchTags: string[];
};

export const LN_PATHOLOGY_LIBRARY: LnPathologyEntry[] = [
  {
    id: "normal_node",
    nameRu: "Нормальный лимфатический узел",
    imageFile: "normal_oval_node.svg",
    typicalLnRads: 1,
    definition: "Регионарный ЛУ с сохранённой архитектурой и типичной овальной формой.",
    pathophysiology: "Лимфоидная ткань с корой и медulla; hilum — точка входа сосудов.",
    ultrasoundAppearance: ["Овальная форма L/S > 2", "Тонкая hypoechoic cortex", "Central echogenic hilum", "Smooth capsule"],
    dopplerAppearance: ["Hilar vascularity", "Symmetric branching"],
    elastographyFindings: ["Soft/medium stiffness", "Homogeneous"],
    differential: ["Reactive node", "Small indeterminate node"],
    clinicalPearls: ["Размер в норме зависит от региона; оценивайте морфологию, не только mm."],
    searchTags: ["normal", "oval", "hilum", "норма"],
  },
  {
    id: "reactive_node",
    nameRu: "Реактивный лимфатический узел",
    imageFile: "reactive_node.svg",
    typicalLnRads: 2,
    definition: "Увеличенный ЛУ при инфекции/воспалении с сохранённой архитектурой.",
    pathophysiology: "Фollicular hyperplasia, расширение коры, сохранение hilum.",
    ultrasoundAppearance: ["Овальный/ mildly round", "Uniform cortical thickening", "Preserved hilum", "Often increased size"],
    dopplerAppearance: ["Increased hilar flow", "Mixed without peripheral dominance"],
    elastographyFindings: ["Soft to intermediate"],
    differential: ["Early metastasis", "Lymphoma", "TBC"],
    clinicalPearls: ["Клинический контекст решает; контроль 4–8 нед при инфекции."],
    searchTags: ["reactive", "реактивный", "воспаление"],
  },
  {
    id: "acute_lymphadenitis",
    nameRu: "Острый лимфаденит",
    imageFile: "reactive_node.svg",
    typicalLnRads: 2,
    definition: "Острое воспаление ЛУ, часто с болевым синдромом и rubor.",
    pathophysiology: "Neutrophilic infiltration, edema, hyperemia.",
    ultrasoundAppearance: ["Enlarged oval node", "Thickened cortex", "Preserved hilum often", "Perinodal edema possible"],
    dopplerAppearance: ["Hypervascular hilar/mixed"],
    elastographyFindings: ["Soft/edematous"],
    differential: ["Abscess", "Metastasis", "Cat-scratch"],
    clinicalPearls: ["Клиника + CRP/лейкоцитоз; антибиотики по показаниям."],
    searchTags: ["острый", "лимфаденит", "inflammatory"],
  },
  {
    id: "chronic_lymphadenitis",
    nameRu: "Хронический лимфаденит",
    imageFile: "reactive_node.svg",
    typicalLnRads: 2,
    definition: "Длительно сохраняющееся увеличение ЛУ после перенесённой инфекции.",
    pathophysiology: "Lymphoid hyperplasia, fibrosis possible.",
    ultrasoundAppearance: ["Mild enlargement", "Uniform cortex", "Hilum preserved", "Sometimes heterogeneous"],
    dopplerAppearance: ["Mild hilar flow"],
    elastographyFindings: ["Variable"],
    differential: ["Low-grade lymphoma", "TBC", "Sarcoidosis"],
    clinicalPearls: ["Персистенция > 8–12 нед → пересмотреть категорию."],
    searchTags: ["хронический", "persistent"],
  },
  {
    id: "tuberculous_lymphadenitis",
    nameRu: "Туберкулёзный лимфаденит",
    imageFile: "tuberculosis_node.svg",
    typicalLnRads: 4,
    definition: "Mycobacterium tuberculosis поражение ЛУ, часто некrotic.",
    pathophysiology: "Caseating necrosis, conglomerates, matting.",
    ultrasoundAppearance: ["Heterogeneous", "Central necrosis/cystic areas", "Matting", "Loss of hilum in advanced cases"],
    dopplerAppearance: ["Peripheral rim flow", "Avascular necrotic center"],
    elastographyFindings: ["Stiff rim, soft necrotic center"],
    differential: ["Metastasis", "NHL", "Treated lymphoma"],
    clinicalPearls: ["Epidemiology + Mantoux/IGRA; FNA with microbiology."],
    searchTags: ["tbc", "tuberculosis", "некроз", "matting"],
  },
  {
    id: "sarcoidosis",
    nameRu: "Саркоидоз",
    imageFile: "reactive_node.svg",
    typicalLnRads: 3,
    definition: "Granulomatous disease with bilateral hilar lymphadenopathy.",
    pathophysiology: "Non-caseating granulomas.",
    ultrasoundAppearance: ["Multiple enlarged nodes", "Oval/round", "Hilum often preserved early", "Homogeneous hypoechoic"],
    dopplerAppearance: ["Hilar/mixed"],
    elastographyFindings: ["Intermediate stiffness"],
    differential: ["Lymphoma", "Metastasis", "TBC"],
    clinicalPearls: ["Bilateral hilar + lung; ACE/ biopsy if needed."],
    searchTags: ["sarcoidosis", "саркоидоз", "granuloma"],
  },
  {
    id: "cat_scratch",
    nameRu: "Болезнь кошачьей царапины",
    imageFile: "reactive_node.svg",
    typicalLnRads: 2,
    definition: "Bartonella henselae — regional lymphadenitis after cat exposure.",
    pathophysiology: "Necrotizing granulomas in nodes.",
    ultrasoundAppearance: ["Single/multiple enlarged nodes", "Oval, preserved hilum often", "Central fluid possible"],
    dopplerAppearance: ["Increased hilar flow"],
    elastographyFindings: ["Soft"],
    differential: ["Acute lymphadenitis", "Lymphoma", "TBC"],
    clinicalPearls: ["History of cat scratch; usually self-limited."],
    searchTags: ["cat-scratch", "bartonella"],
  },
  {
    id: "mononucleosis",
    nameRu: "Infectious mononucleosis",
    imageFile: "reactive_node.svg",
    typicalLnRads: 2,
    definition: "EBV-related generalized lymphadenopathy.",
    pathophysiology: "B-cell proliferation in cortex.",
    ultrasoundAppearance: ["Multiple enlarged oval nodes", "Uniform cortical thickening", "Hilum preserved"],
    dopplerAppearance: ["Hypervascular hilar"],
    elastographyFindings: ["Soft"],
    differential: ["Lymphoma", "HIV seroconversion"],
    clinicalPearls: ["Atypical lymphocytes, splenomegaly; avoid contact sports."],
    searchTags: ["mono", "ebv", "mononucleosis"],
  },
  {
    id: "hiv_lymphadenopathy",
    nameRu: "HIV-associated lymphadenopathy",
    imageFile: "reactive_node.svg",
    typicalLnRads: 3,
    definition: "Persistent generalized lymphadenopathy in HIV.",
    pathophysiology: "Follicular hyperplasia, later immunodeficiency-related changes.",
    ultrasoundAppearance: ["Multiple enlarged nodes", "Variable morphology", "May lose hilum in advanced disease"],
    dopplerAppearance: ["Mixed"],
    elastographyFindings: ["Variable"],
    differential: ["Lymphoma", "Opportunistic infections", "Kaposi"],
    clinicalPearls: ["CD4 count + viral load; biopsy if disproportionate node."],
    searchTags: ["hiv", "immunodeficiency"],
  },
  {
    id: "kikuchi",
    nameRu: "Болезнь Kikuchi-Fujimoto",
    imageFile: "reactive_node.svg",
    typicalLnRads: 3,
    definition: "Histiocytic necrotizing lymphadenitis, often cervical.",
    pathophysiology: "Necrosis with histiocytes; unknown etiology.",
    ultrasoundAppearance: ["Round/oval enlarged node", "Heterogeneous", "Partial loss of hilum possible"],
    dopplerAppearance: ["Mixed/peripheral"],
    elastographyFindings: ["Intermediate"],
    differential: ["Lymphoma", "TBC", "SLE"],
    clinicalPearls: ["Young women; tender nodes; self-limited often."],
    searchTags: ["kikuchi", "histiocytic"],
  },
  {
    id: "castleman",
    nameRu: "Болезнь Castleman",
    imageFile: "reactive_node.svg",
    typicalLnRads: 3,
    definition: "Unicentric/multicentric lymphoproliferative disorder.",
    pathophysiology: "Follicular hyperplasia, vascular proliferation.",
    ultrasoundAppearance: ["Solitary enlarged node", "Hypoechoic homogeneous", "Hypervascular on Doppler"],
    dopplerAppearance: ["Prominent hilar/penetrating vessels"],
    elastographyFindings: ["Intermediate"],
    differential: ["Lymphoma", "Reactive hyperplasia"],
    clinicalPearls: ["HHV-8 in MCD; excision/biopsy for diagnosis."],
    searchTags: ["castleman", "hypervascular"],
  },
  {
    id: "lymphoma",
    nameRu: "Лимфома",
    imageFile: "lymphoma_node.svg",
    typicalLnRads: 4,
    definition: "Lymphoid malignancy involving nodes.",
    pathophysiology: "Replacement of normal architecture by lymphoma cells.",
    ultrasoundAppearance: ["Round/hypoechoic", "Loss of hilum", "Conglomerates", "Homogeneous or heterogeneous"],
    dopplerAppearance: ["Mixed/chaotic", "Increased vascularity"],
    elastographyFindings: ["Soft to intermediate (classically softer than carcinoma)"],
    differential: ["Metastasis", "Reactive", "TBC"],
    clinicalPearls: ["Systemic B-symptoms; PET-CT staging; core biopsy."],
    searchTags: ["lymphoma", "лимфома", "nhl", "hodgkin"],
  },
  {
    id: "hodgkin_lymphoma",
    nameRu: "Лимфома Hodgkin",
    imageFile: "lymphoma_node.svg",
    typicalLnRads: 4,
    definition: "Hodgkin lymphoma with Reed-Sternberg cells.",
    pathophysiology: "Contiguous nodal spread often.",
    ultrasoundAppearance: ["Multiple enlarged nodes", "Homogeneous hypoechoic", "Matting in advanced cases"],
    dopplerAppearance: ["Increased hilar/mixed flow"],
    elastographyFindings: ["Intermediate"],
    differential: ["NHL", "Metastasis", "Reactive"],
    clinicalPearls: ["Mediastinal involvement common; excellent prognosis with treatment."],
    searchTags: ["hodgkin", "ходжкин"],
  },
  {
    id: "non_hodgkin_lymphoma",
    nameRu: "Non-Hodgkin lymphoma",
    imageFile: "lymphoma_node.svg",
    typicalLnRads: 4,
    definition: "Heterogeneous group of lymphoid malignancies.",
    pathophysiology: "Effacement of nodal architecture.",
    ultrasoundAppearance: ["Round nodes", "Markedly hypoechoic", "Hilum absent", "Necrosis in high-grade"],
    dopplerAppearance: ["Chaotic/mixed"],
    elastographyFindings: ["Variable; often softer than metastasis"],
    differential: ["Metastasis", "TBC", "Castleman"],
    clinicalPearls: ["Extranodal disease common in some subtypes."],
    searchTags: ["nhl", "non-hodgkin"],
  },
  {
    id: "metastatic_node",
    nameRu: "Метастатический лимфатический узел",
    imageFile: "round_metastatic_node.svg",
    typicalLnRads: 4,
    definition: "Metastatic involvement from known or unknown primary.",
    pathophysiology: "Tumor cells in cortex/subcapsular sinus, hilum effacement.",
    ultrasoundAppearance: ["Round shape L/S < 1.5", "Eccentric cortical thickening", "Loss of hilum", "Microcalcifications possible"],
    dopplerAppearance: ["Peripheral/penetrating vessels"],
    elastographyFindings: ["Stiff"],
    differential: ["Lymphoma", "TBC", "Reactive"],
    clinicalPearls: ["Search primary; FNA with cell block/IHC."],
    searchTags: ["metastasis", "метастаз", "round"],
  },
  {
    id: "ptc_metastasis",
    nameRu: "Метастаз papillary thyroid carcinoma",
    imageFile: "thyroid_metastasis_node.svg",
    typicalLnRads: 4,
    definition: "Regional neck metastasis from PTC.",
    pathophysiology: "Subcapsular/cortical deposits; psammoma bodies → microcalcifications.",
    ultrasoundAppearance: ["Round hypoechoic node", "Loss of hilum", "Microcalcifications", "Cystic change possible"],
    dopplerAppearance: ["Peripheral/chaotic"],
    elastographyFindings: ["Stiff"],
    differential: ["Reactive thyroiditis nodes", "Lymphoma", "TBC"],
    clinicalPearls: ["ATA: any suspicious node in thyroid cancer patient → FNA; washout Tg."],
    searchTags: ["ptc", "thyroid", "щитовидная", "microcalcification"],
  },
  {
    id: "breast_metastasis",
    nameRu: "Метастаз рака молочной железы",
    imageFile: "breast_metastasis_node.svg",
    typicalLnRads: 4,
    definition: "Axillary/internal mammary metastasis from breast cancer.",
    pathophysiology: "Cortical infiltration, hilum loss.",
    ultrasoundAppearance: ["Round hypoechoic axillary node", "Eccentric cortex", "Absent hilum"],
    dopplerAppearance: ["Peripheral flow"],
    elastographyFindings: ["Stiff"],
    differential: ["Reactive axillary node", "Lymphoma"],
    clinicalPearls: ["Correlate with BI-RADS primary lesion; sentinel node protocol."],
    searchTags: ["breast", "axillary", "мж", "bi-rads"],
  },
  {
    id: "melanoma_metastasis",
    nameRu: "Метастаз меланомы",
    imageFile: "spiculated_malignant_node.svg",
    typicalLnRads: 5,
    definition: "Regional metastasis from melanoma.",
    pathophysiology: "Aggressive subcapsular spread.",
    ultrasoundAppearance: ["Round/markedly hypoechoic", "Loss of hilum", "Necrosis", "Irregular margins"],
    dopplerAppearance: ["Chaotic/peripheral"],
    elastographyFindings: ["Stiff"],
    differential: ["Other metastasis", "Lymphoma"],
    clinicalPearls: ["Often sentinel basin; whole-body staging."],
    searchTags: ["melanoma", "меланома"],
  },
  {
    id: "hnscc_metastasis",
    nameRu: "Метастаз Плоскоклеточного рака ГиБ",
    imageFile: "round_metastatic_node.svg",
    typicalLnRads: 4,
    definition: "Neck metastasis from HNSCC.",
    pathophysiology: "Level II–III common; necrosis common.",
    ultrasoundAppearance: ["Round node", "Central necrosis", "Irregular capsule", "Extracapsular spread"],
    dopplerAppearance: ["Peripheral rim around necrosis"],
    elastographyFindings: ["Stiff periphery"],
    differential: ["Lymphoma", "TBC", "Reactive"],
    clinicalPearls: ["ECE on US → N staging; PET-CT + biopsy."],
    searchTags: ["hnscc", "head neck", "squamous"],
  },
  {
    id: "gyn_metastasis",
    nameRu: "Метастаз гинекологического рака",
    imageFile: "gynecologic_metastasis_node.svg",
    typicalLnRads: 4,
    definition: "Pelvic/para-aortic metastasis from cervical/endometrial/ovarian cancer.",
    pathophysiology: "Route-dependent: obturator, iliac, para-aortic chains.",
    ultrasoundAppearance: ["Round hypoechoic nodes", "Loss of hilum", "Necrosis in advanced disease"],
    dopplerAppearance: ["Peripheral/chaotic"],
    elastographyFindings: ["Stiff"],
    differential: ["Reactive pelvic nodes", "Lymphoma", "TBC"],
    clinicalPearls: ["FIGO staging; correlate with primary gynecologic imaging."],
    searchTags: ["gynecologic", "cervical", "ovarian", "endometrial", "pelvic"],
  },
];

export function searchPathology(query: string, limit = 8): LnPathologyEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return LN_PATHOLOGY_LIBRARY.slice(0, limit);
  return LN_PATHOLOGY_LIBRARY.filter(
    (p) =>
      p.nameRu.toLowerCase().includes(q) ||
      p.searchTags.some((t) => t.includes(q)) ||
      p.definition.toLowerCase().includes(q),
  ).slice(0, limit);
}

export const PATTERN_TO_PATHOLOGY: Partial<Record<LnPatternId, LnPathologyId[]>> = {
  oval: ["normal_node", "reactive_node"],
  round: ["metastatic_node", "ptc_metastasis", "breast_metastasis"],
  lobulated: ["reactive_node", "castleman"],
  spiculated: ["melanoma_metastasis", "hnscc_metastasis"],
  necrotic: ["tuberculous_lymphadenitis", "hnscc_metastasis", "lymphoma"],
  cystic: ["ptc_metastasis", "tuberculous_lymphadenitis"],
  calcified: ["ptc_metastasis"],
  reactive: ["reactive_node", "acute_lymphadenitis", "mononucleosis"],
};
