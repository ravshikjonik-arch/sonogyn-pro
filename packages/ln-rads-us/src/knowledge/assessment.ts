export type LnQuestionType = "mcq" | "board" | "oral" | "case" | "image";

export type LnAssessmentQuestion = {
  id: string;
  type: LnQuestionType;
  questionRu: string;
  options: string[];
  correctIndex: number;
  explanationRu: string;
  topic: string;
  /** Optional atlas image for type=image */
  imageFile?: string;
};

export const LN_ASSESSMENT_QUESTIONS: LnAssessmentQuestion[] = [
  {
    id: "q1",
    type: "mcq",
    questionRu: "Какой L/S ratio наиболее характерен для доброкачественного лимфоузла?",
    options: ["> 2", "1.5–2", "< 1.5", "≈ 1"],
    correctIndex: 0,
    explanationRu: "L/S > 2 соответствует овальной форме — типичный признак normal/reactive node (EFSUMB/WFUMB).",
    topic: "morphology",
  },
  {
    id: "q2",
    type: "mcq",
    questionRu: "Наиболее специфичный признак метастаза papillary thyroid carcinoma в ЛУ:",
    options: ["Preserved hilum", "Microcalcifications", "Thin cortex", "Hilar flow"],
    correctIndex: 1,
    explanationRu: "Микрокальcинаты в шейном ЛУ высоко специфичны для PTC (ATA neck guidelines).",
    topic: "thyroid",
  },
  {
    id: "q3",
    type: "board",
    questionRu: "Round axillary node 13×12 mm, eccentric cortex, peripheral flow, BI-RADS 4 lesion ipsilateral — LN-RADS?",
    options: ["LN-RADS 1", "LN-RADS 2", "LN-RADS 3", "LN-RADS 4"],
    correctIndex: 3,
    explanationRu: "Округлая форма, eccentric cortex, peripheral flow при known primary → LN-RADS 4, biopsy.",
    topic: "breast",
  },
  {
    id: "q4",
    type: "image",
    questionRu: "Spiculated margins + chaotic flow + hilum absent — категория?",
    options: ["LN-RADS 2", "LN-RADS 3", "LN-RADS 4", "LN-RADS 5"],
    correctIndex: 3,
    explanationRu: "Spiculated/infiltrated margins с утратой архитектуры — LN-RADS 5.",
    topic: "morphology",
    imageFile: "spiculated_malignant_node.svg",
  },
  {
    id: "q5",
    type: "oral",
    questionRu: "Перечислите 3 Doppler-признака подозрительного лимфоузла.",
    options: [
      "Hilar, symmetric, low resistance",
      "Peripheral, penetrating, chaotic",
      "Absent only",
      "Central only",
    ],
    correctIndex: 1,
    explanationRu: "Peripheral/penetrating/chaotic flow — abnormal patterns (SRU, EFSUMB).",
    topic: "doppler",
  },
  {
    id: "q6",
    type: "case",
    questionRu: "28 лет, mono-like illness, multiple oval cervical nodes, hilum preserved, hypervascular hilum — diagnosis?",
    options: ["PTC metastasis", "Reactive/EBV lymphadenopathy", "TBC", "Melanoma metastasis"],
    correctIndex: 1,
    explanationRu: "Multiple oval nodes with preserved hilum + clinical mono → reactive/EBV; LN-RADS 2.",
    topic: "cases",
  },
  {
    id: "q7",
    type: "mcq",
    questionRu: "Level VI в классификации шейных ЛУ соответствует:",
    options: ["Posterior triangle", "Central compartment", "Submandibular only", "Supraclavicular"],
    correctIndex: 1,
    explanationRu: "Level VI — central compartment (pretracheal, paratracheal, prelaryngeal) — ключевой для PTC.",
    topic: "anatomy",
  },
  {
    id: "q8",
    type: "board",
    questionRu: "Necrotic node with rim enhancement on CEUS, matting, young patient endemic area — first differential?",
    options: ["Reactive", "TBC lymphadenitis", "Simple cyst", "Lipoma"],
    correctIndex: 1,
    explanationRu: "Matting + central necrosis + epidemiology → TBC until proven otherwise.",
    topic: "pathology",
  },
  {
    id: "q9",
    type: "mcq",
    questionRu: "Elastography: классическое teaching — lymphoma vs metastasis:",
    options: ["Both always stiff", "Lymphoma softer than carcinoma", "Metastasis always soft", "No difference"],
    correctIndex: 1,
    explanationRu: "Classic teaching: lymphoma often softer than metastatic carcinoma on SWE/strain.",
    topic: "elastography",
  },
  {
    id: "q10",
    type: "case",
    questionRu: "Ovarian mass O-RADS 5, round para-aortic node, hilum absent — management?",
    options: ["Discharge", "Repeat US in 12 months", "Staging/oncology referral + tissue diagnosis", "Antibiotics only"],
    correctIndex: 2,
    explanationRu: "Suspicious node with high-risk primary → staging, MDT, tissue confirmation.",
    topic: "gynecologic",
  },
];

export function questionsByType(type: LnQuestionType): LnAssessmentQuestion[] {
  return LN_ASSESSMENT_QUESTIONS.filter((q) => q.type === type);
}
