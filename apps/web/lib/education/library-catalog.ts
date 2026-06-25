export type EducationShelf = "courses" | "assistant" | "reference" | "atlases" | "calculators";

export type EducationLibraryItem = {
  id: string;
  shelf: EducationShelf;
  title: string;
  description: string;
  href: string;
  tags: string[];
  primary?: boolean;
  badge?: string;
};

export const EDUCATION_SHELF_ORDER: EducationShelf[] = [
  "courses",
  "assistant",
  "reference",
  "atlases",
  "calculators",
];

export const EDUCATION_SHELF_LABELS: Record<EducationShelf, string> = {
  courses: "Курсы и лекции",
  assistant: "Помощник и маршруты",
  reference: "Справочники и нормы",
  atlases: "Атласы и 3D",
  calculators: "Калькуляторы",
};

export const EDUCATION_SHELF_DESCRIPTIONS: Record<EducationShelf, string> = {
  courses: "ISUOG Basic Training и другие лекции — презентации, чеклисты, прогресс.",
  assistant: "Маршрут обследования, красные флаги, протокол, голосовой ввод.",
  reference: "Клинические нормы УЗИ, нозологии, КР МЗ РФ и международные гайдлайны.",
  atlases: "Срезы, 3D-макеты матки, яичника, молочной железы.",
  calculators: "O-RADS, BI-RADS, FIGO, FMF, эластография и др.",
};

export const EDUCATION_LIBRARY_ITEMS: EducationLibraryItem[] = [
  {
    id: "isuog-basic",
    shelf: "courses",
    title: "ISUOG — базовый курс",
    description:
      "Basic Training: интерактивные лекции. Лекция 6 — ранняя беременность 4–10 нед (одно- и многоплодная).",
    href: "/library/basic-course",
    tags: ["ISUOG", "ранняя беременность", "КТР", "лекция 6"],
    primary: true,
    badge: "ISUOG",
  },
  {
    id: "assistant",
    shelf: "assistant",
    title: "Помощник врача",
    description: "Маршрут: нозология → анализы → УЗИ → лечение → протокол. Поиск и голос.",
    href: "/assistant",
    tags: ["маршрут", "протокол", "голос"],
    primary: true,
  },
  {
    id: "fmf",
    shelf: "assistant",
    title: "FMF · скрининги",
    description: "I–III скрининг, допплер, шейка — перцентили Медведева, протокол одним кликом.",
    href: "/assistant/fmf",
    tags: ["FMF", "скрининг", "Медведев"],
    badge: "FMF",
  },
  {
    id: "nosologies",
    shelf: "reference",
    title: "Нозологии",
    description: "Справочник заболеваний: обследование, УЗ-диагностика, лечение, вставка в протокол.",
    href: "/nosologies",
    tags: ["нозология", "диагностика"],
    primary: true,
  },
  {
    id: "reference",
    shelf: "reference",
    title: "Клинические нормы УЗИ",
    description: "КТР, БПР, AFI, допплер, скрининговые сроки — ISUOG / Hadlock.",
    href: "/reference",
    tags: ["нормы", "ISUOG", "Hadlock"],
  },
  {
    id: "evidence-us-fmf",
    shelf: "reference",
    title: "УЗИ · доказательная база",
    description: "SonoEvidence v1: 7 полок, 235 тем — FMF, АГ, шейка, BI-RADS, O-RADS, эндокринология, хирургия.",
    href: "/evidence",
    tags: ["FMF", "BI-RADS", "O-RADS", "СПКЯ", "TI-RADS", "доказательная медицина"],
    primary: true,
    badge: "v1",
  },
  {
    id: "cervix-pathology-quiz",
    shelf: "reference",
    title: "Патология шейки · справочник",
    description:
      "7 глав: анатомия, диагностика, ЦИН, РШМ, FIGO. Режимы «студент» (TTS) и «врач» + 16 вопросов самопроверки.",
    href: "/library/cervix-pathology",
    tags: ["шейка", "FIGO", "ЦИН", "РШМ", "кольпоскопия", "самопроверка"],
    badge: "7+16",
  },
  {
    id: "guidelines",
    shelf: "reference",
    title: "КР и приказы",
    description: "КР МЗ РФ, приказы ДЗМ, международные гайдлайны — по полкам.",
    href: "/guidelines",
    tags: ["КР", "ДЗМ", "гайдлайны"],
  },
  {
    id: "orads-guide",
    shelf: "courses",
    title: "O-RADS US · руководство",
    description:
      "Учебный реферат: алгоритм ACR v2022, 10 клинических случаев с эхограммами, таблица категорий 0–5.",
    href: "/library/orads-guide",
    tags: ["O-RADS", "ACR", "реферат", "алгоритм", "обучение"],
    primary: true,
    badge: "v2022",
  },
  {
    id: "orads-echograms",
    shelf: "courses",
    title: "O-RADS · эхограммы и случаи",
    description:
      "Учебные и клинические эхограммы придатков по нозологиям. Расчёт категории — в калькуляторе O-RADS US.",
    href: "/library/orads-echograms",
    tags: ["IOTA", "O-RADS", "эхограммы", "придатки"],
    primary: true,
    badge: "IOTA",
  },
  {
    id: "iota-terms-2026",
    shelf: "reference",
    title: "IOTA 2026 · термины и определения",
    description:
      "Консенсус IOTA Group 2026: солидный компонент ≥3 мм, тип поражения, папилляр, color score, ADNEX — инфографика + 12 вопросов.",
    href: "/library/iota-terms-2026",
    tags: ["IOTA", "ADNEX", "придатки", "O-RADS", "2026", "консенсус", "самопроверка"],
    primary: true,
    badge: "12+2026",
  },
  {
    id: "fetal-anatomy-22-views",
    shelf: "courses",
    title: "22 среза · 65 ВПР (II триместр)",
    description:
      "Систематический протокол Емельяненко: 24 views, 65 ВПР, 15 cases, 20 Q, ISUOG лекция 8, atlas PNG.",
    href: "/library/fetal-anatomy-22-views",
    tags: ["22 views", "II триместр", "ВПР", "анатомия", "сердце", "мозг"],
    primary: true,
    badge: "22+65",
  },
  {
    id: "vascular-ultrasound-edu",
    shelf: "courses",
    title: "Сосудистое УЗД · Куликов",
    description:
      "10 глав: гемодинамика, БЦА, TCD, артерии/вены НК, аорта. Ординатор, 9 cases, 33 Q, экзамен. Связка с клиническим модулем.",
    href: "/library/vascular-ultrasound",
    tags: ["сосуды", "дуплекс", "БЦА", "TCD", "Куликов", "ординатор"],
    primary: true,
    badge: "NEW",
  },
  {
    id: "vascular-ultrasound-clinical",
    shelf: "assistant",
    title: "Сосудистое УЗД · протокол",
    description: "Чеклисты по бассейнам, калькулятор стеноза ВСА, AI-заключение по допплеру.",
    href: "/assistant/vascular",
    tags: ["дуплекс", "БЦА", "стеноз", "протокол", "Куликов"],
    badge: "NEW",
  },
  {
    id: "fetal-doppler-first-trimester",
    shelf: "courses",
    title: "Допплер I триместра (11–14 нед)",
    description:
      "5 допплер-позиций FMF: сердце, VP, пуповина, кольцо, UTA. ALARA, 9 случаев, 16 Q. ISUOG Basic · лекция 7.",
    href: "/library/fetal-doppler-first-trimester",
    tags: ["допплер", "FMF", "I триместр", "VP", "UTA", "SUA", "ALARA"],
    primary: true,
    badge: "11–14",
  },
  {
    id: "obstetric-atlas",
    shelf: "atlases",
    title: "Атлас I триместра (Блинов)",
    description:
      "Эхограммы 4–14 нед.: ранняя беременность, топоанатомия, пороги ЖК/кольца ПЯ, ошибки плоскости.",
    href: "/library/obstetric-atlas",
    tags: ["атлас", "I триместр", "4–14 нед.", "эхограммы"],
    primary: true,
    badge: "Атлас",
  },
  {
    id: "fetal-spine-atlas",
    shelf: "atlases",
    title: "УЗИ позвоночника плода",
    description:
      "15 карточек: норма, spina bifida, миеломенингоцеле, сколиоз, тератомы, каудальная регрессия — II–III триместр.",
    href: "/library/fetal-spine",
    tags: ["позвоночник", "плод", "spina bifida", "скрининг", "атлас"],
    primary: true,
    badge: "15",
  },
  {
    id: "uterus-3d",
    shelf: "atlases",
    title: "Срез матки / FIGO",
    description: "Сагиттальный и коронарный разрез — маркеры для протокола.",
    href: "/uterus-3d",
    tags: ["FIGO", "матка", "3D"],
  },
  {
    id: "ovary-atlas",
    shelf: "atlases",
    title: "Макет яичника · O-RADS",
    description: "Фолликулы, кисты, ИИ по фото — текст в протокол.",
    href: "/ovary-atlas",
    tags: ["O-RADS", "яичник"],
  },
  {
    id: "calculators",
    shelf: "calculators",
    title: "Калькуляторы RADS",
    description: "O-RADS, BI-RADS, TI-RADS, FIGO, эластография, CL шейки.",
    href: "/calculators",
    tags: ["O-RADS", "BI-RADS", "FIGO"],
  },
];

export function groupEducationByShelf(items: EducationLibraryItem[]): Map<EducationShelf, EducationLibraryItem[]> {
  const map = new Map<EducationShelf, EducationLibraryItem[]>();
  for (const shelf of EDUCATION_SHELF_ORDER) {
    map.set(
      shelf,
      items.filter((item) => item.shelf === shelf),
    );
  }
  return map;
}

export function searchEducationLibrary(query: string, shelf: EducationShelf | "all"): EducationLibraryItem[] {
  const q = query.trim().toLowerCase();
  return EDUCATION_LIBRARY_ITEMS.filter((item) => {
    if (shelf !== "all" && item.shelf !== shelf) return false;
    if (!q) return true;
    const hay = `${item.title} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}

export function countEducationByShelf(): Record<EducationShelf, number> {
  return EDUCATION_SHELF_ORDER.reduce(
    (acc, shelf) => {
      acc[shelf] = EDUCATION_LIBRARY_ITEMS.filter((i) => i.shelf === shelf).length;
      return acc;
    },
    {} as Record<EducationShelf, number>,
  );
}
