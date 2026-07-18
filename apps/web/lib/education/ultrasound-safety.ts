export type SafetyStatement = {
  id: string;
  titleRu: string;
  summary: string;
  bullets: string[];
  source: string;
  sourceUrl?: string;
};

export const ULTRASOUND_SAFETY_STATEMENTS: SafetyStatement[] = [
  {
    id: "alara",
    titleRu: "ALARA principle",
    summary: "As Low As Reasonably Achievable — минимально необходимая exposure.",
    bullets: [
      "УЗИ только по показаниям, не «для памятного снимка» без клинической цели.",
      "Минимизировать dwell time и MI/TI при doppler.",
      "Thermal index — контроль при длительном doppler.",
    ],
    source: "ISUOG Safety Committee / AIUM",
    sourceUrl: "https://www.isuog.org/clinical-resources/isuog-guidelines.html",
  },
  {
    id: "bioeffects",
    titleRu: "Bioeffects diagnostic ultrasound",
    summary: "Диагностическое УЗИ при стандартном использовании — низкий риск; doppler требует осторожности.",
    bullets: [
      "Mechanical index (MI) — cavitation risk at high MI.",
      "Thermal index (TI) — heating; limit exposure time in sensitive zones (embryo, eye).",
      "Follow manufacturer output display standard (ODS).",
    ],
    source: "AIUM Consensus Report on Bioeffects",
    sourceUrl: "https://www.aium.org/resources/official-statements",
  },
  {
    id: "first-trimester-doppler",
    titleRu: "Doppler I trimester",
    summary: "DV, UtA — только в certified screening protocols; не routine entertainment scans.",
    bullets: [
      "ISUOG/FMF: doppler markers in trained hands at 11–13+6.",
      "Document MI/TI when displayed.",
      "Avoid unnecessary repeated doppler in early pregnancy.",
    ],
    source: "ISUOG · 11–14 week guidelines",
  },
  {
    id: "training",
    titleRu: "Training & competency",
    summary: "PoCUS и screening требуют documented training (ISUOG Basic / FMF).",
    bullets: [
      "ISUOG Training Guidelines — minimum training for obstetric ultrasound.",
      "AIUM Training Guidelines — CME and credentialing.",
      "SonoGyn Pro: ISUOG Basic course + exam checklists for self-assessment.",
    ],
    source: "ISUOG / AIUM Training Guidelines",
    sourceUrl: "https://www.isuog.org/education/basic-training1/basic-training-bt-certificate-elearning-course.html",
  },
];

export const ULTRASOUND_SAFETY_DISCLAIMER =
  "Образовательный справочник. Локальные протоколы клиники и инструкции аппарата имеют приоритет.";
