/**
 * Справочник O-RADS US v2022 — главы 0–5 (учебный, по ACR / ISUOG-стилю таблиц).
 */

export type OradsCategoryId = 0 | 1 | 2 | 3 | 4 | 5;

export type OradsReferenceLesion = {
  id: string;
  nameRu: string;
  sizeNote?: string;
  features: string[];
  riskNote?: string;
};

export type OradsCategoryChapter = {
  id: OradsCategoryId;
  titleRu: string;
  subtitleRu: string;
  riskSummary: string;
  managementRu: string;
  /** Tailwind border/bg для карточки */
  tone: "slate" | "sky" | "emerald" | "amber" | "orange" | "red";
  lesions: OradsReferenceLesion[];
};

export const ORADS_VERSION_LABEL = "O-RADS US v2022";

export const ORADS_GOVERNING_BULLETS = [
  "O-RADS US — яичники, трубы, параовариальные кисты; не для ВЗОМ, внематочной, перекрута.",
  "Несколько образований — оценивать отдельно; тактика по наивысшему O-RADS.",
  "Постменопауза: аменорея ≥1 года; при сомнении и возрасте ≥50 — как постменопауза.",
  "Размер — наибольший диаметр; при сомнении между признаками — выбирать более высокий риск.",
  "Асцит / перитонеальные узелки без другой причины могут повышать категорию до O-RADS 5.",
];

export const ORADS_ZERO_OPTIONS = [
  {
    id: "not_applicable",
    label: "O-RADS: не применимо",
    detail: "Яичник не визуализирован / отсутствует — оценка O-RADS US не проводится.",
    recommendation: "Указать в протоколе; клиническая корреляция.",
  },
  {
    id: "technically_inadequate",
    label: "O-RADS 0 — технически неадекватно",
    detail: "Ожидалась визуализация по показаниям, но оценка невозможна.",
    recommendation: "Повторное УЗИ или МРТ по протоколу центра.",
  },
] as const;

export const ORADS_CATEGORY_CHAPTERS: OradsCategoryChapter[] = [
  {
    id: 0,
    titleRu: "O-RADS 0",
    subtitleRu: "Неполная оценка / не применимо",
    riskSummary: "Категория не стратифицирует риск злокачественности.",
    managementRu: "Повторное исследование или иная визуализация.",
    tone: "slate",
    lesions: ORADS_ZERO_OPTIONS.map((o) => ({
      id: o.id,
      nameRu: o.label,
      features: [o.detail],
      riskNote: o.recommendation,
    })),
  },
  {
    id: 1,
    titleRu: "O-RADS 1",
    subtitleRu: "Нормальное яичник · физиологические находки",
    riskSummary: "Норма; физиологические кисты/фолликулы.",
    managementRu: "Наблюдение не требуется.",
    tone: "sky",
    lesions: [
      {
        id: "normal_pre",
        nameRu: "Нормальное яичник (пременопауза)",
        sizeNote: "Длина ≤3 см, ширина ≤2 см, высота ≤1,5 см, объём ≤10 см³",
        features: [
          "Фолликулы 2–9 мм по периферии",
          "Гиперэхогенная строма",
          "Без солидного компонента и асцита",
        ],
      },
      {
        id: "normal_post",
        nameRu: "Нормальное яичник (постменопауза)",
        sizeNote: "Меньшие размеры, объём ≤5 см³",
        features: ["Однородная строма", "Фолликулы ≤3 мм или отсутствуют"],
      },
      {
        id: "follicle",
        nameRu: "Физиологический фолликул",
        sizeNote: "Обычно ≤3 см (до 5 см в пременопаузе)",
        features: ["Однокамерное анэхогенное", "Тонкая гладкая стенка", "Без септ и солидного компонента"],
      },
      {
        id: "corpus_luteum",
        nameRu: "Желтое тело",
        sizeNote: "Обычно ≤3 см (до 5 см)",
        features: ["Толстая стенка", "Низкий уровень эха", "Периферическая васкуляризация на ЦДК"],
      },
    ],
  },
  {
    id: 2,
    titleRu: "O-RADS 2",
    subtitleRu: "Классические доброкачественные",
    riskSummary: "Почти наверняка доброкачественное · риск <1%",
    managementRu: "Наблюдение по размеру и менопаузальному статусу (см. таблицу Classic Benign).",
    tone: "emerald",
    lesions: [
      {
        id: "hemorrhagic",
        nameRu: "Типичная геморрагическая киста",
        sizeNote: "<10 см",
        features: ["Однокамерное", "Сетчатый рисунок или ретрактильный сгусток", "Без внутреннего кровотока**"],
      },
      {
        id: "dermoid",
        nameRu: "Типичный дермоид",
        sizeNote: "<10 см",
        features: [
          "Гиперэхогенный компонент с тенью",
          "Гиперэхогенные линии/точки",
          "Плавающие эхогенные сферы",
        ],
      },
      {
        id: "endometrioma",
        nameRu: "Типичная эндометриома",
        sizeNote: "<10 см",
        features: ["Однородные низкие эха «матовое стекло»", "Периферические точечные включения ±"],
      },
      {
        id: "paraovarian",
        nameRu: "Параовариальная киста",
        features: ["Простая киста отдельно от яичника"],
      },
      {
        id: "hydrosalpinx",
        nameRu: "Типичный гидросальпинкс",
        features: ["Тубулярная анэхогенная структура", "Неполные септы / «бусы на нити»"],
      },
    ],
  },
  {
    id: 3,
    titleRu: "O-RADS 3",
    subtitleRu: "Низкий риск",
    riskSummary: "Риск злокачественности 1–<10%",
    managementRu: "УЗИ-специалист / МРТ; консультация гинеколога.",
    tone: "amber",
    lesions: [
      {
        id: "uni_solid",
        nameRu: "Однокамерная киста с солидным компонентом",
        sizeNote: "Любой размер",
        features: ["Солидный компонент или папиллярные проекции", "Без асцита"],
      },
      {
        id: "multi_smooth",
        nameRu: "Многокамерная киста",
        sizeNote: "<10 см, гладкие стенки",
        features: ["Тонкие перегородки", "Без солидного компонента", "Цветовой балл 1–3"],
      },
      {
        id: "classic_large",
        nameRu: "Классическое доброкачественное ≥10 см",
        features: ["Геморрагическая / дермоид / эндометриома >10 см"],
        riskNote: "<1% при типичном виде, но категория 3 по размеру",
      },
    ],
  },
  {
    id: 4,
    titleRu: "O-RADS 4",
    subtitleRu: "Промежуточный риск",
    riskSummary: "Риск 10–<50%",
    managementRu: "УЗИ-специалист, МРТ, онкогинеколог по протоколу.",
    tone: "orange",
    lesions: [
      {
        id: "multi_large",
        nameRu: "Многокамерная без солидного",
        sizeNote: "≥10 см или CS 4",
        features: ["Тонкие/умеренные перегородки", "Без солидного компонента"],
      },
      {
        id: "uni_solid_pp",
        nameRu: "Однокамерная с солидным / <4 ПП",
        features: ["Солидный компонент не как единственная ПП", "ПП <4"],
      },
      {
        id: "solid_smooth",
        nameRu: "Солидное, гладкий контур",
        features: ["Солидное ≥80%", "CS 2–3"],
      },
      {
        id: "thick_septa",
        nameRu: "Толстые перегородки",
        features: ["Перегородки ≥3 мм", "Неровные септы", "Без солидного компонента"],
      },
    ],
  },
  {
    id: 5,
    titleRu: "O-RADS 5",
    subtitleRu: "Высокий риск",
    riskSummary: "Риск ≥50% · подозрение на злокачественность",
    managementRu: "Срочная консультация онкогинеколога; стадирование.",
    tone: "red",
    lesions: [
      {
        id: "irregular_solid",
        nameRu: "Неровное солидное образование",
        features: ["Неровный контур", "Внутренняя васкуляризация", "CS 4 или тени"],
      },
      {
        id: "pp4",
        nameRu: "≥4 папиллярные проекции",
        features: ["Однокамерная киста", "≥4 ПП"],
      },
      {
        id: "ascites_tumor",
        nameRu: "Асцит + опухоль яичника",
        features: ["Асцит", "Сложное/солидное образование", "Васкуляризация"],
      },
      {
        id: "bilateral",
        nameRu: "Двусторонние опухоли",
        features: ["Двусторонние массы", "Солидный или сложный рисунок"],
      },
    ],
  },
];

export function chapterToneClasses(tone: OradsCategoryChapter["tone"]): string {
  const map: Record<OradsCategoryChapter["tone"], string> = {
    slate: "border-slate-300 bg-slate-50 dark:bg-slate-900/40",
    sky: "border-sky-300 bg-sky-50 dark:bg-sky-950/30",
    emerald: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
    amber: "border-amber-400 bg-amber-50 dark:bg-amber-950/30",
    orange: "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
    red: "border-red-400 bg-red-50 dark:bg-red-950/30",
  };
  return map[tone];
}
