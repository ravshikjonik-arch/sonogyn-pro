export type LnAcademySection = {
  id: string;
  titleRu: string;
  learningObjectives: string[];
  keyConcepts: string[];
  clinicalPearls: string[];
  commonMistakes: string[];
  residentTips: string[];
  examTips: string[];
  boardReviewFacts: string[];
};

export const LN_ACADEMY_SECTIONS: LnAcademySection[] = [
  {
    id: "morphology_basics",
    titleRu: "Морфология лимфоузла на УЗИ",
    learningObjectives: [
      "Описывать shape, hilum, cortex, capsule",
      "Рассчитывать L/S ratio",
      "Различать reactive vs suspicious patterns",
    ],
    keyConcepts: [
      "Hilum = echogenic center (fat/vessels)",
      "Cortex = hypoechoic peripheral rim",
      "L/S > 2 favors benign",
      "Eccentric cortical thickening — red flag",
    ],
    clinicalPearls: [
      "Всегда измеряйте short axis — ключевой для staging neck nodes.",
      "Один признак не определяет категорию — используйте комбинацию.",
    ],
    commonMistakes: [
      "Округление без измерения L/S",
      "Игнорирование Doppler при 'сохранённом hilum'",
      "Confusion reactive hyperplasia vs partial metastasis",
    ],
    residentTips: ["Начните с hilum: preserved vs absent — быстрый triage."],
    examTips: ["Oval + hilar = benign; Round + no hilum = malignant until proven otherwise."],
    boardReviewFacts: ["EFSUMB: hilum, shape, cortex, vascularity — core descriptors."],
  },
  {
    id: "doppler_ln",
    titleRu: "Color Doppler лимфоузлов",
    learningObjectives: ["Классифицировать hilar/peripheral/chaotic flow", "Объяснить clinical significance"],
    keyConcepts: [
      "Normal = hilar entry and branching",
      "Peripheral/rim = suspicious",
      "Chaotic = architecture destroyed",
    ],
    clinicalPearls: ["Use low PRF; compare to adjacent muscle."],
    commonMistakes: ["Confusing thymic tissue with node", "Overcalling absent flow in necrotic center"],
    residentTips: ["Peripheral flow + round node → biopsy even if small."],
    examTips: ["Hilar flow = LN-RADS 1–2 pattern in oval node."],
    boardReviewFacts: ["SRU head/neck: vascular pattern independent risk factor."],
  },
  {
    id: "ln_rads_categories",
    titleRu: "LN-RADS 1–5",
    learningObjectives: ["Assign LN-RADS category", "Recommend management"],
    keyConcepts: ["1 Normal", "2 Reactive", "3 Indeterminate", "4 Suspicious", "5 Highly suspicious"],
    clinicalPearls: ["Category 3 — short-interval follow-up or FNA if high a priori risk."],
    commonMistakes: ["Calling all enlarged nodes suspicious", "Missing microcalcifications in PTC"],
    residentTips: ["Document decision path for MDT."],
    examTips: ["Know ATA thresholds for thyroid cancer nodes."],
    boardReviewFacts: ["LN-RADS SonoGyn synthesizes EFSUMB/WFUMB/ATA/AIUM criteria."],
  },
  {
    id: "thyroid_neck",
    titleRu: "Щитовидная железа и шейные ЛУ",
    learningObjectives: ["Apply ATA neck node criteria", "Identify PTC metastasis signs"],
    keyConcepts: ["Microcalcifications", "Cystic change", "Level VI/VII mapping", "Tg washout"],
    clinicalPearls: ["Any suspicious node in known PTC → FNA."],
    commonMistakes: ["Ignoring contralateral small round nodes"],
    residentTips: ["Correlate with TI-RADS of primary nodule."],
    examTips: ["PTC mets: microcalcifications highly specific."],
    boardReviewFacts: ["ATA 2015/2023 neck imaging guidelines."],
  },
  {
    id: "breast_axilla",
    titleRu: "Подмышечные лимфоузлы и BI-RADS",
    learningObjectives: ["Describe axillary nodes per BI-RADS", "Correlate with primary breast lesion"],
    keyConcepts: ["Cortical thickening > 3 mm", "Hilum loss", "Round shape"],
    clinicalPearls: ["Abnormal node may upstage BI-RADS category."],
    commonMistakes: ["Normal-looking node with proven invasive cancer — still assess multiple nodes"],
    residentTips: ["Measure cortex at thickest point."],
    examTips: ["Know difference intramammary vs axillary node."],
    boardReviewFacts: ["ACR BI-RADS axillary node reporting."],
  },
  {
    id: "gyn_pelvic",
    titleRu: "Тазовые лимфоузлы в гинекологии",
    learningObjectives: ["Map obturator/iliac/para-aortic chains", "FIGO correlation"],
    keyConcepts: ["Route-specific drainage", "Size + morphology", "Necrosis in advanced disease"],
    clinicalPearls: ["Transvaginal/transabdominal approach depending on habitus."],
    commonMistakes: ["Confusing bowel loops with nodes"],
    residentTips: ["Label side and station (left/right external iliac)."],
    examTips: ["Cervix → obturator/internal iliac first."],
    boardReviewFacts: ["FIGO 2018+ staging imaging principles."],
  },
  {
    id: "advanced_imaging",
    titleRu: "Elastography и CEUS",
    learningObjectives: ["Interpret stiff vs soft nodes", "CEUS enhancement patterns"],
    keyConcepts: ["Metastases often stiff", "Lymphoma classically softer", "CEUS rim enhancement in necrosis"],
    clinicalPearls: ["CEUS helpful when B-mode indeterminate."],
    commonMistakes: ["Overreliance on elastography without morphology"],
    residentTips: ["Use same ROI as B-mode measurement."],
    examTips: ["Peripheral enhancement + central non-enhancement = necrosis."],
    boardReviewFacts: ["EFSUMB CEUS guidelines for lymph nodes."],
  },
];

export function getAcademySection(id: string): LnAcademySection | undefined {
  return LN_ACADEMY_SECTIONS.find((s) => s.id === id);
}
