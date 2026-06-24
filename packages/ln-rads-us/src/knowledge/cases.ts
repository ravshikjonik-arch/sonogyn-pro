export type LnCaseDifficulty = "beginner" | "intermediate" | "advanced" | "expert";

export type LnCaseStudy = {
  id: string;
  difficulty: LnCaseDifficulty;
  titleRu: string;
  history: string;
  clinicalScenario: string;
  ultrasoundFindings: string[];
  dopplerFindings: string[];
  diagnosis: string;
  differentialDiagnosis: string[];
  teachingPoints: string[];
  suggestedLnRads: number;
};

export const LN_CASE_LIBRARY: LnCaseStudy[] = [
  {
    id: "case_b1",
    difficulty: "beginner",
    titleRu: "Реактивный шейный ЛУ после ОРВИ",
    history: "Женщина 28 лет, увеличение ЛУ слева после ангины 2 нед назад.",
    clinicalScenario: "Болезненность умеренная, без потери веса.",
    ultrasoundFindings: ["Овальный ЛУ 22×9 мм Level II", "Hilum сохранён", "Кора uniformly thickened 3 мм"],
    dopplerFindings: ["Increased hilar flow"],
    diagnosis: "Reactive lymphadenopathy",
    differentialDiagnosis: ["Early lymphoma", "TBC"],
    teachingPoints: ["LN-RADS 2 при типичной картине", "Контроль 4–6 нед"],
    suggestedLnRads: 2,
  },
  {
    id: "case_b2",
    difficulty: "beginner",
    titleRu: "Нормальный подмышечный ЛУ",
    history: "Мужчина 35 лет, скрининг, без жалоб.",
    clinicalScenario: "Routine breast US.",
    ultrasoundFindings: ["Oval node 15×6 mm", "Thin cortex", "Preserved hilum"],
    dopplerFindings: ["Normal hilar flow"],
    diagnosis: "Normal axillary lymph node",
    differentialDiagnosis: ["None"],
    teachingPoints: ["LN-RADS 1", "Не описывать как pathologic без признаков"],
    suggestedLnRads: 1,
  },
  {
    id: "case_i1",
    difficulty: "intermediate",
    titleRu: "Подозрительный ЛУ при РМЖ",
    history: "Женщина 52 года, BI-RADS 4A образование верхнего наружного квадранта справа.",
    clinicalScenario: "Staging axilla.",
    ultrasoundFindings: ["Round axillary node 12×11 mm", "Eccentric cortical thickening", "Hilum compressed"],
    dopplerFindings: ["Peripheral vascularity"],
    diagnosis: "Metastatic axillary lymph node (suspicious)",
    differentialDiagnosis: ["Reactive node", "Lymphoma"],
    teachingPoints: ["LN-RADS 4", "Sentinel node biopsy/FNA", "Correlate with primary BI-RADS"],
    suggestedLnRads: 4,
  },
  {
    id: "case_i2",
    difficulty: "intermediate",
    titleRu: "Round node при узле ЩЖ TI-RADS 5",
    history: "Мужчина 45 лет, papillary thyroid carcinoma on FNA of thyroid nodule.",
    clinicalScenario: "Pre-operative neck mapping Level VI.",
    ultrasoundFindings: ["Round hypoechoic node 9×8 mm Level VI", "Microcalcifications", "Hilum absent"],
    dopplerFindings: ["Chaotic peripheral flow"],
    diagnosis: "PTC metastasis to central compartment node",
    differentialDiagnosis: ["Reactive Level VI node", "Lymphoma"],
    teachingPoints: ["LN-RADS 4–5", "ATA: FNA + Tg washout", "Any suspicious node in PTC patient"],
    suggestedLnRads: 5,
  },
  {
    id: "case_a1",
    difficulty: "advanced",
    titleRu: "TBC лимфаденит с matting",
    history: "Молодой пациент, хронический кашель, ночная потливость.",
    clinicalScenario: "Unilateral cervical mass.",
    ultrasoundFindings: ["Multiple conglomerate nodes", "Central necrosis", "Matting", "Loss of hilum"],
    dopplerFindings: ["Rim flow around necrotic areas"],
    diagnosis: "Tuberculous lymphadenitis",
    differentialDiagnosis: ["Metastatic SCC with necrosis", "NHL"],
    teachingPoints: ["LN-RADS 4", "Microbiology on FNA", "Public health notification"],
    suggestedLnRads: 4,
  },
  {
    id: "case_a2",
    difficulty: "advanced",
    titleRu: "Лимфома — multiple round nodes",
    history: "Женщина 38 лет, B-symptoms, generalized adenopathy.",
    clinicalScenario: "Cervical and supraclavicular nodes.",
    ultrasoundFindings: ["Multiple round homogeneous hypoechoic nodes", "Hilum absent in larger nodes"],
    dopplerFindings: ["Mixed hypervascularity"],
    diagnosis: "Non-Hodgkin lymphoma",
    differentialDiagnosis: ["Metastatic carcinoma", "Reactive hyperplasia (mono)"],
    teachingPoints: ["LN-RADS 4", "Core biopsy for subtyping", "PET-CT staging"],
    suggestedLnRads: 4,
  },
  {
    id: "case_e1",
    difficulty: "expert",
    titleRu: "Spiculated node with ECE — HNSCC",
    history: "Мужчина 60 лет, курение, ulcerated oropharyngeal lesion.",
    clinicalScenario: "Level II node palpable.",
    ultrasoundFindings: ["Round node 18×16 mm", "Spiculated/infiltrated margins", "Central necrosis", "Suspected ECE"],
    dopplerFindings: ["Chaotic flow, avascular necrotic center"],
    diagnosis: "Metastatic HNSCC with extracapsular extension",
    differentialDiagnosis: ["TBC necrotic node", "Lymphoma"],
    teachingPoints: ["LN-RADS 5", "ECE affects N staging and prognosis", "PET-CT + MDT"],
    suggestedLnRads: 5,
  },
  {
    id: "case_e2",
    difficulty: "expert",
    titleRu: "Pelvic nodes — ovarian cancer staging",
    history: "Женщина 62 года, complex ovarian mass O-RADS 5.",
    clinicalScenario: "Staging prior to cytoreduction.",
    ultrasoundFindings: ["Round para-aortic node 14×12 mm", "Hilum absent", "Heterogeneous"],
    dopplerFindings: ["Peripheral flow"],
    diagnosis: "Suspected para-aortic metastasis from ovarian cancer",
    differentialDiagnosis: ["Reactive pelvic nodes", "Lymphoma"],
    teachingPoints: ["LN-RADS 4", "FIGO staging", "Correlate with o-RADS primary"],
    suggestedLnRads: 4,
  },
];

export function casesByDifficulty(d: LnCaseDifficulty): LnCaseStudy[] {
  return LN_CASE_LIBRARY.filter((c) => c.difficulty === d);
}
