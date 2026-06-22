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
  /** PDF на Яндекс.Диске (если нет platformModuleHref). */
  fileName?: string;
  yandexDiskUrl?: string;
  /** Встроенный модуль SonoGyn-Pro (курс в библиотеке). */
  platformModuleHref?: string;
};

export type BasicCourseModule = {
  id: string;
  title: string;
  description: string;
  lectureIds: string[];
  comingSoon?: boolean;
  /** Linked SonoGyn-Pro educational module when no Yandex lecture yet. */
  platformModuleHref?: string;
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
    description: "11–13+6 нед: КТР, ТВП, допплер (5 позиций), PI VP/UTA, FMF.",
    lectureIds: ["lecture-7-fetal-doppler-first-trimester"],
  },
  {
    id: "second-trimester",
    title: "II триместр · аномалии",
    description: "18–22 нед: 22 среза, анатомический скрининг, база 65 ВПР.",
    lectureIds: ["lecture-8-fetal-anatomy-22-views"],
    platformModuleHref: "/library/fetal-anatomy-22-views",
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
    {
      id: "lecture-7-fetal-doppler-first-trimester",
      number: 7,
      title: "Допплер I триместра (11–14 нед)",
      subtitle:
        "Расширенный протокол FMF: ALARA, 5 позиций — сердце, венозный проток, пуповина, кольцо, маточные артерии",
      objectives: [
        "Применять ALARA: TI ≤ 1.0, Color → Pulsed Doppler",
        "Выполнить 5 допплер-позиций расширенного протокола",
        "Измерить PI VP и маточных артерий, описать A-wave",
        "Распознать SUA и отличить omphalocele / gastroschisis",
        "Избегать типичных ошибок (wrong vessel, large color box)",
      ],
      topics: [
        {
          id: "alara-safety",
          title: "Безопасность · ALARA",
          summary: "TI ≤ 1.0, 5–10 мин, маленький color box, без спектрального допплера до 11 нед без показаний.",
          checkpoints: [
            "Color → короткий pulsed Doppler",
            "Минимальная глубина и color box",
            "При плохой визуализации — сменить доступ, не «дожимать» мощность",
          ],
          practiceLinks: [
            {
              label: "Курс · безопасность",
              href: "/library/fetal-doppler-first-trimester",
            },
          ],
        },
        {
          id: "five-positions",
          title: "5 позиций протокола",
          summary: "Сердце → VP → 2 артерии у пузыря → кольцо (при подозрении) → UTA PI mean.",
          checkpoints: [
            "Фиксированный порядок прохода",
            "Кольцо — только при подозрении на АБС-дефект",
            "Mean UTA = (R + L) / 2",
          ],
          practiceLinks: [{ label: "Алгоритмы", href: "/library/fetal-doppler-first-trimester" }],
        },
        {
          id: "fetal-heart-doppler",
          title: "Сердце · 4CV · 3VT",
          summary: "Color в диастолу; TR — импульсный допплер только по показаниям.",
          checkpoints: [
            "4CV — наполнение правых/левых отделов",
            "3VT — три сосуда в одной плоскости",
            "Не полная ЭхоКГ — быстрая функциональная проверка",
          ],
          practiceLinks: [{ label: "FMF · I скрининг", href: "/assistant/fmf?section=first" }],
        },
        {
          id: "ductus-venosus",
          title: "Венозный проток · PI · A-wave",
          summary: "Правый парасагиттальный; sample ~1 mm; A-wave antegrade в норме.",
          checkpoints: [
            "Color: ПВ → VP → ПП",
            "Не путать с печёночными венами",
            "3 стабильных цикла",
          ],
          practiceLinks: [
            { label: "Нормы PI · Медvedev", href: "/assistant/fmf?section=doppler" },
            { label: "Модуль · VP", href: "/library/fetal-doppler-first-trimester" },
          ],
        },
        {
          id: "umbilical-vessels",
          title: "Пуповина · SUA",
          summary: "Поперечный таз на уровне мочевого пузыря — 2A + 1V.",
          checkpoints: [
            "Пузырь обязателен в кадре",
            "SUA → расширенный протокол по клинике",
          ],
          practiceLinks: [{ label: "Случаи · SUA", href: "/library/fetal-doppler-first-trimester" }],
        },
        {
          id: "umbilical-ring",
          title: "Пупочное кольцо · АБС",
          summary: "Физиологическая грыжа до 11 нед; окончательная оценка после 12 нед.",
          checkpoints: [
            "Midline + membrane → omphalocele likely",
            "Paraumbilical + free loops → gastroschisis likely",
          ],
          practiceLinks: [{ label: "Omphalocele vs gastroschisis", href: "/library/fetal-doppler-first-trimester" }],
        },
        {
          id: "uterine-arteries",
          title: "Маточные артерии · PI",
          summary: "TA, internal os, угол < 30°, 3 цикла, mean PI — скрининг PE.",
          checkpoints: [
            "Не iliac / ovarian artery",
            "Sample volume 2 mm",
            "Усреднить правую и левую",
          ],
          practiceLinks: [
            { label: "FMF · допплер", href: "/assistant/fmf?section=doppler" },
            { label: "Протокол UTA", href: "/library/fetal-doppler-first-trimester" },
          ],
        },
      ],
      platformModuleHref: "/library/fetal-doppler-first-trimester",
    },
    {
      id: "lecture-8-fetal-anatomy-22-views",
      number: 8,
      title: "22 среза · 65 ВПР (II триместр)",
      subtitle:
        "Систематический анатомический скрининг 18–22 нед: позвоночник, мозг, сердце, живот, конечности, лицо · Е.С. Емельяненко",
      objectives: [
        "Выполнить протокол 22 срезов с обзорами 1 и 2",
        "Связать каждый срез со списком исключаемых ВПР",
        "Распознать lemon/banana sign и запустить протокол позвоночника",
        "Пройти кардиальную последовательность 7a–10 без остановки на 4CV",
        "Использовать view 14 для SUA, BRA, LUTO",
      ],
      topics: [
        {
          id: "overview-spine",
          title: "Обзор · позвоночник (1–3)",
          summary: "Сагиттальный и коронарный позвоночник; коронарный trunk — situs, ось сердца.",
          checkpoints: [
            "Непрерывная кожа над позвоночником",
            "Коронарный trunk — stomach, heart axis",
            "Overview-1 — gross anomalies, viability",
          ],
          practiceLinks: [
            { label: "Модуль · spine", href: "/library/fetal-anatomy-22-views" },
            { label: "Атлас позвоночника", href: "/library/fetal-spine" },
          ],
        },
        {
          id: "brain-views",
          title: "Голова · 4–6",
          summary: "Transventricular, transthalamic, transcerebellar — ventricles, CSP, cerebellum.",
          checkpoints: [
            "CSP на transthalamic",
            "Cisterna magna 2–10 mm",
            "Banana sign → spine protocol",
          ],
          practiceLinks: [{ label: "Модуль · brain", href: "/library/fetal-anatomy-22-views" }],
        },
        {
          id: "heart-views",
          title: "Сердце · 7a–10",
          summary: "4CV apical/lateral → LVOT → RVOT → crossing → 3VT.",
          checkpoints: [
            "Оба 4CV (7a и 7b)",
            "Outflow crossing documented",
            "3VT — arch anomalies, TGA clues",
          ],
          practiceLinks: [{ label: "FMF · II скрининг", href: "/assistant/fmf?section=second" }],
        },
        {
          id: "abdomen-pelvis",
          title: "Живот · таз · 11–14",
          summary: "UV plane, cord insertion, kidneys 13a/b, bladder + 2UA.",
          checkpoints: [
            "Omphalocele vs gastroschisis",
            "Обе почки + pelvis",
            "Bladder + 2 arteries on color",
          ],
          practiceLinks: [{ label: "База ВПР", href: "/library/fetal-anatomy-22-views" }],
        },
        {
          id: "limbs-face-overview2",
          title: "Конечности · лицо · обзор 2",
          summary: "Femur, limbs, face 18–20; transverse sweep neck → sacrum.",
          checkpoints: [
            "FL + three bones each limb",
            "Upper lip coronal + profile",
            "Overview-2 — не пропускать",
          ],
          practiceLinks: [{ label: "Самопроверка", href: "/library/fetal-anatomy-22-views" }],
        },
      ],
      platformModuleHref: "/library/fetal-anatomy-22-views",
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
