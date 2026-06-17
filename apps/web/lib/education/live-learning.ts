export type TrainingLanguage = "ru" | "en" | "es" | "de" | "fr" | "it";

export const EDUCATION_PRIMARY_LANGUAGE: TrainingLanguage = "ru";

export const TRAINING_LANGUAGE_LABELS: Record<TrainingLanguage, string> = {
  ru: "Русский",
  en: "English",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
};

export type TrainingSessionStatus = "registration" | "planned" | "recorded";
export type TrainingSessionFormat = "live" | "recording" | "course";
export type TrainingSessionLevel = "Базовый" | "Продвинутый" | "Разбор случаев";
export type TrainingMeetingProvider = "Zoom/Meet" | "Встроенный класс" | "Запись" | "Курс";

export const TRAINING_SESSION_STATUSES = ["registration", "planned", "recorded"] as const;
export const TRAINING_SESSION_FORMATS = ["live", "recording", "course"] as const;
export const TRAINING_SESSION_LEVELS = ["Базовый", "Продвинутый", "Разбор случаев"] as const;
export const TRAINING_MEETING_PROVIDERS = [
  "Zoom/Meet",
  "Встроенный класс",
  "Запись",
  "Курс",
] as const;

export type TrainingSession = {
  id: string;
  title: string;
  description: string;
  format: TrainingSessionFormat;
  status: TrainingSessionStatus;
  startsAt: string | null;
  durationMinutes: number | null;
  instructor: string;
  level: TrainingSessionLevel;
  primaryLanguage: TrainingLanguage;
  subtitleLanguages: TrainingLanguage[];
  translationPlan: string;
  meetingProvider: TrainingMeetingProvider;
  meetingUrl?: string;
  href?: string;
  materials: string[];
  tags: string[];
  agenda: string[];
  outcomes: string[];
  sortOrder?: number;
};

export type LearningTrack = {
  id: string;
  title: string;
  description: string;
  href: string;
  status: "active" | "planned";
  modules: string[];
  subtitleLanguages: TrainingLanguage[];
};

export const TRAINING_SESSIONS: TrainingSession[] = [
  {
    id: "orads-live-ru",
    title: "O-RADS: от УЗ-описания к категории",
    description:
      "Живой вебинар на русском: как не терять ключевые признаки, формировать описание и аккуратно выходить на O-RADS.",
    format: "live",
    status: "registration",
    startsAt: null,
    durationMinutes: 90,
    instructor: "Якубов Р.В.",
    level: "Базовый",
    primaryLanguage: "ru",
    subtitleLanguages: ["ru", "en", "es"],
    translationPlan: "Русские онлайн-субтитры в приоритете; английский и испанский перевод — для записи.",
    meetingProvider: "Zoom/Meet",
    materials: ["чеклист признаков", "шаблон описания", "разбор типичных ошибок"],
    tags: ["O-RADS", "IOTA", "яичники", "вебинар"],
    agenda: [
      "Какие признаки обязательно собрать до категории",
      "Как отделить простое описание от клинического вывода",
      "Типичные ловушки при папиллярных структурах и солидных компонентах",
      "Как оформить текст для протокола SonoGyn Pro",
    ],
    outcomes: [
      "Врач быстрее находит нужный O-RADS сценарий",
      "Описание становится структурированным и проверяемым",
      "Снижается риск пропустить ключевой признак",
    ],
  },
  {
    id: "isuog-basic-early-pregnancy",
    title: "ISUOG Basic Training: ранняя беременность 4–10 недель",
    description:
      "Курс с программой, лекцией, практикой и прогрессом. Основа для дальнейших вебинаров по ранней беременности.",
    format: "course",
    status: "recorded",
    startsAt: null,
    durationMinutes: null,
    instructor: "SonoGyn Pro",
    level: "Базовый",
    primaryLanguage: "ru",
    subtitleLanguages: ["ru"],
    translationPlan: "Сначала русские материалы; перевод субтитров добавляется после валидации курса.",
    meetingProvider: "Курс",
    href: "/library/basic-course",
    materials: ["программа", "лекция", "практические пункты"],
    tags: ["ISUOG", "I триместр", "КТР", "курс"],
    agenda: [
      "Сроки и ориентиры 4–10 недель",
      "КТР, сердцебиение, многоплодная беременность",
      "Как не перегружать протокол лишними формулировками",
    ],
    outcomes: [
      "Единый базовый алгоритм ранней беременности",
      "Понятная структура лекция → практика → протокол",
    ],
  },
  {
    id: "orads-echograms-cases",
    title: "IOTA/O-RADS: эхограммы придатков и разбор случаев",
    description:
      "Учебная база эхограмм: сначала самостоятельный просмотр, затем разбор признаков и категории.",
    format: "recording",
    status: "recorded",
    startsAt: null,
    durationMinutes: null,
    instructor: "SonoGyn Pro",
    level: "Разбор случаев",
    primaryLanguage: "ru",
    subtitleLanguages: ["ru", "en", "es"],
    translationPlan: "Для записей проще всего добавлять русские субтитры и переводы EN/ES.",
    meetingProvider: "Запись",
    href: "/library/orads-echograms",
    materials: ["эхограммы", "дерево решений", "клинические комментарии"],
    tags: ["эхограммы", "O-RADS", "случаи"],
    agenda: [
      "Самостоятельный просмотр эхограмм",
      "Сопоставление признаков с IOTA/O-RADS",
      "Разбор заключений и формулировок",
    ],
    outcomes: [
      "Насмотренность по типовым паттернам",
      "Быстрый переход от изображения к категории",
    ],
  },
  {
    id: "birads-breast-us",
    title: "УЗИ молочных желез: BI-RADS и структурированное описание",
    description:
      "Пилотное занятие для будущего курса: алгоритм осмотра, локализация, протокол и безопасные формулировки.",
    format: "live",
    status: "planned",
    startsAt: null,
    durationMinutes: 90,
    instructor: "Якубов Р.В.",
    level: "Базовый",
    primaryLanguage: "ru",
    subtitleLanguages: ["ru", "en", "es"],
    translationPlan: "Русский эфир; перевод субтитров после публикации записи.",
    meetingProvider: "Zoom/Meet",
    materials: ["алгоритм осмотра", "шаблон протокола", "BI-RADS подсказки"],
    tags: ["BI-RADS", "молочная железа", "вебинар"],
    agenda: [
      "Алгоритм исследования молочных желёз",
      "Локализация: часы, расстояние, квадрант",
      "BI-RADS US и структурированное заключение",
    ],
    outcomes: [
      "Единый маршрут осмотра",
      "Более понятные протоколы для коллег и маршрутизации",
    ],
  },
];

export const LEARNING_TRACKS: LearningTrack[] = [
  {
    id: "isuog-basic",
    title: "ISUOG Basic Training",
    description: "Базовая программа: лекции, практика, прогресс и контрольные пункты.",
    href: "/library/basic-course",
    status: "active",
    modules: ["ранняя беременность", "КТР", "сроки", "протокол"],
    subtitleLanguages: ["ru"],
  },
  {
    id: "orads-iota",
    title: "O-RADS / IOTA",
    description: "Эхограммы, дерево решений и разбор признаков для придатков.",
    href: "/library/orads-echograms",
    status: "active",
    modules: ["эхограммы", "признаки", "категория", "заключение"],
    subtitleLanguages: ["ru", "en", "es"],
  },
  {
    id: "birads",
    title: "BI-RADS УЗИ молочных желез",
    description: "Будущий курс по алгоритму исследования, локализации и структурированному протоколу.",
    href: "/calculators/bi-rads",
    status: "planned",
    modules: ["алгоритм", "локализация", "лексикон", "протокол"],
    subtitleLanguages: ["ru", "en", "es"],
  },
  {
    id: "fmf",
    title: "FMF / фетометрия",
    description: "Скрининги, перцентили, допплер и практическое оформление заключения.",
    href: "/assistant/fmf",
    status: "planned",
    modules: ["I скрининг", "биометрия", "допплер", "шейка"],
    subtitleLanguages: ["ru", "en", "es"],
  },
];

export function formatTrainingDateRu(startsAt: string | null): string {
  if (!startsAt) return "Дата уточняется";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(new Date(startsAt));
}

export function getTrainingSessionById(id: string): TrainingSession | undefined {
  return TRAINING_SESSIONS.find((session) => session.id === id);
}

export type EducationSessionRow = {
  id: string;
  title: string;
  description: string;
  format: TrainingSessionFormat;
  status: TrainingSessionStatus;
  starts_at: string | null;
  duration_minutes: number | null;
  instructor: string;
  level: TrainingSessionLevel;
  primary_language: TrainingLanguage;
  subtitle_languages: TrainingLanguage[];
  translation_plan: string;
  meeting_provider: TrainingMeetingProvider;
  meeting_url: string | null;
  href: string | null;
  materials: string[];
  tags: string[];
  agenda: string[];
  outcomes: string[];
  sort_order: number;
};

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function trainingSessionFromRow(row: EducationSessionRow): TrainingSession {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    format: row.format,
    status: row.status,
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    instructor: row.instructor,
    level: row.level,
    primaryLanguage: row.primary_language,
    subtitleLanguages: stringArray(row.subtitle_languages) as TrainingLanguage[],
    translationPlan: row.translation_plan,
    meetingProvider: row.meeting_provider,
    meetingUrl: row.meeting_url ?? undefined,
    href: row.href ?? undefined,
    materials: stringArray(row.materials),
    tags: stringArray(row.tags),
    agenda: stringArray(row.agenda),
    outcomes: stringArray(row.outcomes),
    sortOrder: row.sort_order,
  };
}
