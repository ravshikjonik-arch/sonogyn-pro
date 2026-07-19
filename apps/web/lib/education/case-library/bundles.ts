export type CaseLibraryBundle = {
  id: string;
  titleRu: string;
  description: string;
  badge: string;
  caseCount: number;
  href: string;
  tags: string[];
  source: string;
};

/** Curated teaching bundles — ссылки на модули с готовыми кейсами. */
export const CASE_LIBRARY_BUNDLES: CaseLibraryBundle[] = [
  {
    id: "fetal-anatomy",
    titleRu: "22 среза · 65 ВПР",
    description: "15 annotated cases, 20 Q, atlas PNG — систематический протокол II триместра.",
    badge: "15 cases",
    caseCount: 15,
    href: "/tools/refs/fetal-anatomy-22-views",
    tags: ["II триместр", "ВПР", "ISUOG", "анатомия"],
    source: "SonoGyn Pro · fetal-anatomy-22-views",
  },
  {
    id: "exam-set-pieces",
    titleRu: "Exam Set-pieces · OBGYN",
    description: "4 Radiopaedia-style сценария: история → report → differential + 25 exam Q.",
    badge: "4 scenarios",
    caseCount: 4,
    href: "/tools/refs/exam-set-pieces",
    tags: ["Radiopaedia", "ординатор", "экзамен"],
    source: "SonoGyn Pro · exam-set-pieces",
  },
  {
    id: "orads-echograms",
    titleRu: "O-RADS · эхограммы",
    description: "Учебные эхограммы придатков по нозологиям — IOTA / ACR v2022.",
    badge: "10+ cases",
    caseCount: 10,
    href: "/tools/refs/orads-echograms",
    tags: ["O-RADS", "IOTA", "придатки"],
    source: "SonoGyn Pro · orads-echograms",
  },
  {
    id: "vascular-ultrasound",
    titleRu: "Сосудистое УЗД · Куликов",
    description: "9 doppler cases, 33 Q — БЦА, TCD, артерии/вены НК.",
    badge: "9 cases",
    caseCount: 9,
    href: "/tools/refs/vascular-ultrasound",
    tags: ["дуплекс", "БЦА", "ординатор"],
    source: "SonoGyn Pro · vascular-ultrasound",
  },
  {
    id: "fetal-doppler-ft",
    titleRu: "Допплер I триместра",
    description: "9 FMF doppler cases — VP, UTA, SUA, ALARA.",
    badge: "9 cases",
    caseCount: 9,
    href: "/tools/refs/fetal-doppler-first-trimester",
    tags: ["FMF", "I триместр", "допплер"],
    source: "SonoGyn Pro · fetal-doppler-first-trimester",
  },
  {
    id: "cervix-pathology",
    titleRu: "Патология шейки · цитология",
    description: "Bethesda, HPV, ASCCP — кейсы и 25 Q по скринингу.",
    badge: "cases + 25 Q",
    caseCount: 8,
    href: "/tools/refs/cervix-pathology?tab=cytology",
    tags: ["шейка", "Bethesda", "скрининг"],
    source: "SonoGyn Pro · cervix-pathology",
  },
  {
    id: "fetal-spine",
    titleRu: "Позвоночник плода",
    description: "15 карточек: spina bifida, сколиоз, каудальная регрессия.",
    badge: "15 cards",
    caseCount: 15,
    href: "/tools/refs/fetal-spine",
    tags: ["позвоночник", "spina bifida"],
    source: "SonoGyn Pro · fetal-spine",
  },
  {
    id: "community-cases",
    titleRu: "Кейсы сообщества",
    description: "Teaching cases от врачей — обсуждение, снимки, аннотации.",
    badge: "live",
    caseCount: 0,
    href: "/cases?tab=cases",
    tags: ["community", "обсуждение", "аннотации"],
    source: "SonoGyn Pro · cases",
  },
];

export const CASE_LIBRARY_TOTAL = CASE_LIBRARY_BUNDLES.reduce((n, b) => n + b.caseCount, 0);

export const CASE_LIBRARY_DISCLAIMER =
  "Учебные кейсы без PHI. Снимки сообщества — только после подтверждения анонимизации.";
