export type LearningPathStepType = "guideline" | "calculator" | "quiz" | "case" | "checklist" | "leaflet";

export type LearningPathStep = {
  id: string;
  type: LearningPathStepType;
  title: string;
  description: string;
  href: string;
  estimatedMinutes?: number;
};

export type LearningPath = {
  id: string;
  titleRu: string;
  description: string;
  badge: string;
  steps: LearningPathStep[];
};

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "first-trimester-screening",
    titleRu: "Скрининг I триместра (11–13+6)",
    description: "ISUOG One-stop: гайдлайн → FMF → чек-лист → листовка → quiz.",
    badge: "FMF",
    steps: [
      {
        id: "fts-1",
        type: "guideline",
        title: "ISUOG · 11–14 week scan",
        description: "Practice Guidelines — performance of 11–14 week ultrasound scan.",
        href: "/tools/refs/basic-course?tab=program",
        estimatedMinutes: 15,
      },
      {
        id: "fts-2",
        type: "calculator",
        title: "FMF · I скрининг",
        description: "КТР, NT, риск — калькулятор и протокол.",
        href: "/ai/consultants/fmf?section=first",
        estimatedMinutes: 10,
      },
      {
        id: "fts-3",
        type: "checklist",
        title: "Чек-лист I триместра",
        description: "AIUM/ISUOG interactive checklist.",
        href: "/tools/refs/exam-checklists",
        estimatedMinutes: 5,
      },
      {
        id: "fts-4",
        type: "leaflet",
        title: "Листовка для пациентки",
        description: "Объяснение скрининга простым языком.",
        href: "/tools/refs/patient-information",
        estimatedMinutes: 3,
      },
      {
        id: "fts-5",
        type: "quiz",
        title: "Самопроверка · 10 Q",
        description: "Quiz по чек-листам AIUM/ISUOG.",
        href: "/tools/refs/exam-checklists",
        estimatedMinutes: 10,
      },
    ],
  },
  {
    id: "o-rads-adnexal",
    titleRu: "O-RADS · аднексальная масса",
    description: "Гайдлайн → калькулятор → эхограммы → кейсы → листовка.",
    badge: "O-RADS",
    steps: [
      {
        id: "orads-1",
        type: "guideline",
        title: "O-RADS US v2022 · реферат ACR",
        description: "10 случаев и дерево решений.",
        href: "/tools/refs/orads-guide",
        estimatedMinutes: 20,
      },
      {
        id: "orads-2",
        type: "calculator",
        title: "O-RADS Pro / Wizard",
        description: "IOTA 2026 + O-RADS категория.",
        href: "/tools/calc/rads/o-rads",
        estimatedMinutes: 10,
      },
      {
        id: "orads-3",
        type: "case",
        title: "Эхограммы Озерской",
        description: "Учебные карточки по нозологиям.",
        href: "/tools/refs/orads-echograms",
        estimatedMinutes: 15,
      },
      {
        id: "orads-4",
        type: "case",
        title: "Плейлист кейсов O-RADS",
        description: "Community cases · adnexal masses.",
        href: "/cases?tab=cases&playlist=orads-adnexal",
        estimatedMinutes: 15,
      },
      {
        id: "orads-5",
        type: "leaflet",
        title: "Листовка O-RADS для пациентки",
        href: "/tools/refs/patient-information",
        description: "Объяснение категорий O-RADS.",
        estimatedMinutes: 3,
      },
    ],
  },
  {
    id: "third-trimester-fgr",
    titleRu: "III триместр · FGR / допpler",
    description: "ISUOG III trim → чек-лист → масса плода → листовка FGR.",
    badge: "FGR",
    steps: [
      {
        id: "fgr-1",
        type: "guideline",
        title: "ISUOG · III trimester scan",
        description: "Practice Guidelines third trimester.",
        href: "/tools/refs/norms",
        estimatedMinutes: 15,
      },
      {
        id: "fgr-2",
        type: "checklist",
        title: "Чек-лист III триместра",
        href: "/tools/refs/exam-checklists",
        description: "UA/MCA Doppler, AFI, biometry.",
        estimatedMinutes: 5,
      },
      {
        id: "fgr-3",
        type: "calculator",
        title: "Масса плода · EFW",
        href: "/calculators/fetal-weight",
        description: "Hadlock / перцентили.",
        estimatedMinutes: 5,
      },
      {
        id: "fgr-4",
        type: "case",
        title: "Плейлист · IUGR + doppler",
        href: "/cases?tab=cases&playlist=obstetric-doppler",
        description: "Кейсы задержки роста.",
        estimatedMinutes: 15,
      },
      {
        id: "fgr-5",
        type: "leaflet",
        title: "Листовка FGR",
        href: "/tools/refs/patient-information",
        description: "Информация для пациентки.",
        estimatedMinutes: 3,
      },
    ],
  },
  {
    id: "cervix-cytology",
    titleRu: "Шейка · цитология и colposcopy",
    description: "Справочник → скрининг engine → colposcopy → quiz 25 Q.",
    badge: "Bethesda",
    steps: [
      {
        id: "cx-1",
        type: "guideline",
        title: "Патология шейки · 8 глав",
        href: "/tools/refs/cervix-pathology",
        description: "FIGO, CIN, РШМ, colposcopy.",
        estimatedMinutes: 30,
      },
      {
        id: "cx-2",
        type: "calculator",
        title: "Цитология · screening engine",
        href: "/tools/refs/cervix-pathology?tab=cytology",
        description: "ASCCP-oriented рекомендации.",
        estimatedMinutes: 10,
      },
      {
        id: "cx-3",
        type: "calculator",
        title: "Кольпоскопия · Swede Score",
        description: "Кольпоскопический осмотр и scoring.",
        href: "/calculators/colposcopy",
        estimatedMinutes: 10,
      },
      {
        id: "cx-4",
        type: "case",
        title: "Плейлист · cervix cases",
        description: "Community cases по патологии шейки.",
        href: "/cases?tab=cases&playlist=cervix-pathology",
        estimatedMinutes: 15,
      },
      {
        id: "cx-5",
        type: "quiz",
        title: "Самопроверка · 25 Q",
        description: "Quiz по патологии шейки и цитологии.",
        href: "/tools/refs/cervix-pathology?tab=quiz",
        estimatedMinutes: 20,
      },
    ],
  },
  {
    id: "fetal-anatomy-22",
    titleRu: "II триместр · 22 среза",
    description: "ISUOG lecture 8 → 22 views → quiz 20 Q → exam checklist.",
    badge: "22 views",
    steps: [
      {
        id: "fa-1",
        type: "guideline",
        title: "ISUOG Basic · лекция 8",
        description: "20+2 planes method · fetal anomalies.",
        href: "/tools/refs/basic-course?lecture=lecture-8-fetal-anatomy-22-views",
        estimatedMinutes: 45,
      },
      {
        id: "fa-2",
        type: "case",
        title: "22 ultrasound views",
        href: "/tools/refs/fetal-anatomy-22-views",
        description: "Интерактивный чек-лист срезов.",
        estimatedMinutes: 30,
      },
      {
        id: "fa-3",
        type: "quiz",
        title: "Самопроверка · 20 Q",
        description: "Quiz по 22 срезам и ВПР.",
        href: "/tools/refs/fetal-anatomy-22-views",
        estimatedMinutes: 15,
      },
      {
        id: "fa-4",
        type: "checklist",
        title: "Чек-лист II триместра (standard)",
        description: "AIUM obstetric standard checklist.",
        href: "/tools/refs/exam-checklists",
        estimatedMinutes: 5,
      },
    ],
  },
];

export const LEARNING_PATH_PROGRESS_KEY = "sonogyn:learning-paths:progress";

export function getLearningPath(id: string): LearningPath | undefined {
  return LEARNING_PATHS.find((p) => p.id === id);
}

export function loadLearningPathProgress(): Record<string, Record<string, boolean>> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LEARNING_PATH_PROGRESS_KEY) ?? "{}") as Record<
      string,
      Record<string, boolean>
    >;
  } catch {
    return {};
  }
}

export function setLearningPathStepDone(pathId: string, stepId: string, done: boolean): void {
  const all = loadLearningPathProgress();
  const pathProgress = all[pathId] ?? {};
  if (done) pathProgress[stepId] = true;
  else delete pathProgress[stepId];
  all[pathId] = pathProgress;
  localStorage.setItem(LEARNING_PATH_PROGRESS_KEY, JSON.stringify(all));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sonogyn:learning-paths-progress"));
  }
}

export function pathProgressPercent(path: LearningPath, progress: Record<string, boolean>): number {
  if (!path.steps.length) return 0;
  const done = path.steps.filter((s) => progress[s.id]).length;
  return Math.round((done / path.steps.length) * 100);
}

export const STEP_TYPE_LABELS: Record<LearningPathStepType, string> = {
  guideline: "Гайдлайн",
  calculator: "Калькулятор",
  quiz: "Quiz",
  case: "Кейс / атлас",
  checklist: "Чек-лист",
  leaflet: "Листовка",
};
