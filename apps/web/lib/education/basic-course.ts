export type BasicCoursePracticeLink = {
  label: string;
  href: string;
};

export type BasicCourseTopic = {
  id: string;
  title: string;
  summary: string;
  checkpoints: string[];
  practiceLinks?: BasicCoursePracticeLink[];
};

export type BasicCourseLecture = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  topics: BasicCourseTopic[];
  objectives: string[];
  fileName: string;
  yandexDiskUrl: string;
};

export type BasicCourseModule = {
  id: string;
  title: string;
  description: string;
  lectureIds: string[];
  comingSoon?: boolean;
};

export const BASIC_COURSE_DISCLAIMER =
  "Материалы ISUOG Basic Training предназначены для образовательных целей. Не заменяют клиническое суждение врача и официальные протоколы вашей клиники.";

export const ISUOG_COURSE_MODULES: BasicCourseModule[] = [
  {
    id: "early-pregnancy",
    title: "Ранняя беременность",
    description: "4–10 нед: плодное яйцо, эмбрион, жизнеспособность, многоплодие.",
    lectureIds: ["lecture-6-early-pregnancy-4-10"],
  },
  {
    id: "first-trimester",
    title: "I триместр · скрининг",
    description: "11–13+6 нед: КТР, ТВП, комбинированный скрининг FMF.",
    lectureIds: [],
    comingSoon: true,
  },
  {
    id: "second-trimester",
    title: "II триместр · аномалии",
    description: "18–22 нед: анатомический скрининг, срезы, перцентили.",
    lectureIds: [],
    comingSoon: true,
  },
  {
    id: "third-trimester",
    title: "III триместр · рост",
    description: "30–34 нед: рост плода, AFI, допплер.",
    lectureIds: [],
    comingSoon: true,
  },
];

export const ISUOG_BASIC_COURSE = {
  id: "isuog-basic-training",
  title: "ISUOG — базовый курс",
  subtitle: "Basic Training in Obstetric and Gynecological Ultrasound",
  description:
    "Официальная программа ISUOG. Интерактив: программа по модулям → лекция с чеклистом → практика в FMF и нормах.",
  issuer: "ISUOG",
  lectures: [
    {
      id: "lecture-6-early-pregnancy-4-10",
      number: 6,
      title: "Ранняя беременность 4–10 недель",
      subtitle:
        "Оценка нормальных и аномальных эхографических признаков одноплодной и многоплодной беременности",
      objectives: [
        "Различать нормальные эхопризнаки 4–10 нед",
        "Оценивать жизнеспособность эмбриона",
        "Распознавать red flags ранней беременности",
        "Учитывать особенности многоплодия на малых сроках",
      ],
      topics: [
        {
          id: "gestational-sac",
          title: "Плодное яйцо",
          summary: "СДП, контуры, локализация в полости матки — первый маркер внутриматочной беременности.",
          checkpoints: [
            "СДП измерять в сагиттали, средний диаметр",
            "Контуры ровные, эхогенность средняя",
            "Локализация — тело матки, не цервикальный канал",
          ],
          practiceLinks: [
            { label: "FMF · малый срок", href: "/assistant/fmf?section=early" },
            { label: "Клин. нормы", href: "/reference" },
          ],
        },
        {
          id: "yolk-sac",
          title: "Желточный мешок",
          summary: "Появление и размеры ЖМ — важный маркер нормального развития до появления эмбриона.",
          checkpoints: [
            "ЖМ виден при СДП ~8–10 мм",
            "Диаметр ЖМ до 6 мм на ранних сроках",
            "Отсутствие ЖМ при видимом ПЯ — red flag",
          ],
          practiceLinks: [{ label: "FMF · малый срок", href: "/assistant/fmf?section=early" }],
        },
        {
          id: "embryo-crl",
          title: "Эмбрион и КТР",
          summary: "КТР — основной параметр датировки на малых сроках; ЧСС подтверждает жизнеспособность.",
          checkpoints: [
            "КТР — максимальная длина эмбриона, нейтральное положение",
            "ЧСС измерять при видимой активности",
            "Срок по КТР приоритетнее ДПМ при расхождении >5–7 дн",
          ],
          practiceLinks: [
            { label: "FMF · I скрининг", href: "/assistant/fmf?section=first" },
            { label: "Нормы по сроку", href: "/reference/norms" },
          ],
        },
        {
          id: "viability",
          title: "Жизнеспособность и red flags",
          summary: "Отсутствие эмбриона при крупном ПЯ, отсутствие ЧСС, регресс ЖМ — показания к пересмотру диагноза.",
          checkpoints: [
            "Пустое плодное яйцо — критерии по сроку",
            "Остановка роста КТР / ЧСС",
            "Внематочная беременность — допплер и локализация",
          ],
          practiceLinks: [{ label: "Нозологии", href: "/nosologies" }],
        },
        {
          id: "multiples",
          title: "Многоплодная беременность",
          summary: "Хорионичность, амнионичность, λ-знак — на ранних сроках до 10 нед.",
          checkpoints: [
            "Число плодных яиц и эмбрионов",
            "Лямбда-знак при монохориальной двойне",
            "Синхронность размеров КТР",
          ],
          practiceLinks: [{ label: "FMF · малый срок", href: "/assistant/fmf?section=early" }],
        },
      ],
      fileName: "Lecture-6-4-10.pdf",
      yandexDiskUrl: "https://disk.yandex.ru/i/HBUWonJavsL1DA",
    },
  ] satisfies BasicCourseLecture[],
} as const;

export function getBasicCourseLecture(id: string): BasicCourseLecture | undefined {
  return ISUOG_BASIC_COURSE.lectures.find((lecture) => lecture.id === id);
}

export function yandexDiskViewerUrl(publicUrl: string): string {
  return `https://disk.yandex.ru/iframe/i/${publicUrl.split("/i/")[1]?.split("?")[0] ?? ""}`;
}

export function lectureProgressPercent(
  lecture: BasicCourseLecture,
  topicDone: Record<string, boolean>,
): number {
  if (!lecture.topics.length) return 0;
  const done = lecture.topics.filter((t) => topicDone[`${lecture.id}::${t.id}`]).length;
  return Math.round((done / lecture.topics.length) * 100);
}

export function courseProgressPercent(topicDone: Record<string, boolean>): number {
  const all = ISUOG_BASIC_COURSE.lectures.flatMap((l) => l.topics);
  if (!all.length) return 0;
  const done = all.filter((t) => {
    const lecture = ISUOG_BASIC_COURSE.lectures.find((l) => l.topics.some((x) => x.id === t.id));
    return lecture ? topicDone[`${lecture.id}::${t.id}`] : false;
  }).length;
  return Math.round((done / all.length) * 100);
}
