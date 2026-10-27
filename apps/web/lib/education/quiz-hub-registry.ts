/** SSOT: клинические задачи / самопроверка (без дублирования quiz-bank JSON). */

export type QuizHubPersona = "doctor" | "student" | "intern";

export type QuizHubEntry = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  personas: QuizHubPersona[];
  /** Уровень сложности по умолчанию */
  difficulty: "student" | "doctor";
  questionCount?: number;
  topics: string[];
  sourceLabel?: string;
};

export const QUIZ_HUB_ENTRIES: QuizHubEntry[] = [
  {
    id: "exam-set-pieces",
    title: "OBGYN exam practice · set-pieces",
    subtitle: "История → отчёт → differential · Radiopaedia-style",
    href: "/tools/refs/exam-set-pieces",
    personas: ["doctor", "intern", "student"],
    difficulty: "doctor",
    questionCount: 25,
    topics: ["adnexa", "endometrium", "early pregnancy", "myometrium"],
    sourceLabel: "Radiopaedia · ISUOG · O-RADS v2022",
  },
  {
    id: "exam-checklists",
    title: "Чек-листы полного УЗИ",
    subtitle: "AIUM / ISUOG · самопроверка перед аттестацией",
    href: "/tools/refs/exam-checklists",
    personas: ["doctor", "intern"],
    difficulty: "doctor",
    topics: ["protocol", "obstetrics", "gynecology"],
    sourceLabel: "AIUM · ISUOG",
  },
  {
    id: "iota-2026-quiz",
    title: "IOTA 2026 · термины и признаки",
    subtitle: "Связка с O-RADS Pro · консенсус Wiley/ISUOG",
    href: "/tools/refs/iota-terms-2026",
    personas: ["doctor", "intern", "student"],
    difficulty: "student",
    topics: ["IOTA", "O-RADS", "adnexa"],
    sourceLabel: "IOTA 2026",
  },
  {
    id: "fetal-anatomy-22",
    title: "Анатомия плода · 22 projections",
    subtitle: "ISUOG · quiz + timed exam mode",
    href: "/tools/refs/fetal-anatomy-22-views",
    personas: ["doctor", "intern"],
    difficulty: "doctor",
    topics: ["obstetrics", "fetal anatomy"],
    sourceLabel: "ISUOG",
  },
  {
    id: "fetal-doppler-1t",
    title: "Допpler I триместра (11–14 нед)",
    subtitle: "Quiz + методичка FMF-стиля",
    href: "/tools/refs/fetal-doppler-first-trimester",
    personas: ["doctor", "intern"],
    difficulty: "doctor",
    topics: ["FMF", "doppler", "screening"],
  },
  {
    id: "cervix-pathology-quiz",
    title: "Патология шейки · цитология",
    subtitle: "Bethesda · скрининг · 25+ вопросов",
    href: "/tools/refs/cervix-pathology",
    personas: ["doctor", "intern", "student"],
    difficulty: "student",
    topics: ["cervix", "cytology", "screening"],
  },
  {
    id: "myoma-education-quiz",
    title: "Миома матки · итоговый тест",
    subtitle: "FIGO, протокол, допплер · 8 вопросов",
    href: "/tools/refs/myoma-education/quiz",
    personas: ["doctor", "intern", "student"],
    difficulty: "doctor",
    questionCount: 8,
    topics: ["миома", "FIGO", "матка", "допплер"],
    sourceLabel: "Лекция · учебный комплект",
  },
  {
    id: "case-library",
    title: "Teaching case library",
    subtitle: "Обезличенные кейсы + обсуждения",
    href: "/tools/refs/case-library",
    personas: ["doctor", "intern"],
    difficulty: "doctor",
    topics: ["cases", "ultrasound"],
  },
  {
    id: "quiz-hub-meta",
    title: "Все задачи (этот каталог)",
    subtitle: "Единая точка входа · без дублирования банков",
    href: "/tools/refs/quiz-hub",
    personas: ["doctor", "intern", "student"],
    difficulty: "student",
    topics: ["hub"],
  },
];

export function filterQuizHubEntries(opts: {
  query?: string;
  persona?: QuizHubPersona | "all";
}): QuizHubEntry[] {
  const q = (opts.query ?? "").trim().toLowerCase();
  let list = QUIZ_HUB_ENTRIES.filter((e) => e.id !== "quiz-hub-meta");

  if (opts.persona && opts.persona !== "all") {
    list = list.filter((e) => e.personas.includes(opts.persona as QuizHubPersona));
  }

  if (!q) return list;

  return list.filter((e) => {
    const blob = [e.title, e.subtitle, e.topics.join(" "), e.sourceLabel ?? ""].join(" ").toLowerCase();
    return blob.includes(q) || e.topics.some((t) => t.includes(q));
  });
}
