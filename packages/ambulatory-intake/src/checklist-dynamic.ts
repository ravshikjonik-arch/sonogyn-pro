import { VISIT_REASONS, type VisitReasonId } from "./reasons";

export type DynamicItem = {
  id: string;
  label: string;
  important?: boolean;
  allowsNote?: boolean;
  whyRu?: string;
  /** Visual emphasis in UI (primary-care essentials) */
  pin?: "exam" | "cervix" | "red";
};

export type DynamicSection = {
  id: string;
  title: string;
  hint?: string;
  items: DynamicItem[];
};

const CORE_HISTORY: DynamicItem[] = [
  { id: "h.complaints", label: "Основные жалобы уточнены", important: true },
  { id: "h.duration", label: "Длительность симптомов установлена", important: true },
  { id: "h.character", label: "Характер и интенсивность симптомов уточнены" },
  { id: "h.menstrual", label: "Менструальный анамнез собран", important: true },
  { id: "h.lmp", label: "Дата последней менструации уточнена, если применимо", important: true },
  { id: "h.obstetric", label: "Акушерский анамнез собран" },
  { id: "h.gyn", label: "Гинекологический анамнез собран", important: true },
  {
    id: "h.screen_history",
    label: "Анамнез цитологии / ВПЧ / гистологии собран",
    important: true,
    pin: "cervix",
    whyRu: "Интервал скрининга и предыдущий результат влияют на забор сегодня",
  },
  { id: "h.contraception", label: "Контрацептивный анамнез уточнён" },
  { id: "h.repro_plans", label: "Репродуктивные планы уточнены" },
  { id: "h.surgery", label: "Сведения о перенесённых операциях собраны" },
  { id: "h.allergy", label: "Аллергологический анамнез уточнён", important: true },
  { id: "h.meds", label: "Сведения о принимаемых препаратах собраны", important: true },
  { id: "h.family", label: "Семейный анамнез уточнён" },
  { id: "h.risks", label: "Факторы риска выявлены", important: true },
  {
    id: "h.red_flags",
    label: "Признаки, требующие экстренной помощи, исключены либо выявлены",
    important: true,
    pin: "red",
    whyRu: "Внематочная, острое кровотечение, острый живот, сепсис — приоритет над плановым обследованием",
  },
];

const CORE_EXAM: DynamicItem[] = [
  { id: "x.general", label: "Общее состояние оценено", important: true },
  {
    id: "x.bp",
    label: "АД измерено по показаниям и сценарию приёма",
    whyRu: "Не обязательно каждому визиту без показаний / маршрута",
  },
  { id: "x.pulse", label: "Пульс оценён по показаниям" },
  { id: "x.bmi", label: "Рост и масса тела измерены при необходимости оценки ИМТ" },
  { id: "x.abdomen", label: "Живот осмотрен и пальпирован по показаниям", important: true },
  { id: "x.external", label: "Осмотр наружных половых органов выполнен", important: true, pin: "exam" },
  {
    id: "x.speculum",
    label: "Осмотр в зеркалах выполнен",
    important: true,
    pin: "exam",
    whyRu: "Шейка, своды, характер выделений — базовый элемент приёма АГ по показаниям / профилактике",
  },
  {
    id: "x.cervix_visual",
    label: "Шейка: эпителий, зев, контактная кровоточивость оценены",
    important: true,
    pin: "cervix",
  },
  {
    id: "x.discharge_char",
    label: "Характер выделений оценён",
    important: true,
    pin: "exam",
  },
  { id: "x.bimanual", label: "Бимануальное исследование выполнено по показаниям", important: true, pin: "exam" },
  {
    id: "x.breast",
    label: "Осмотр молочных желёз выполнен по показаниям и маршруту",
    whyRu: "Только при цели визита / показаниях / программе",
  },
];

/** Always visible for primary-care AG — cytology / HPV / microscopy decisions */
const CERVIX_SCREENING: DynamicItem[] = [
  {
    id: "s.prior_screen",
    label: "Предыдущие цитология / ВПЧ учтены (дата, результат, интервал)",
    important: true,
    pin: "cervix",
    allowsNote: true,
    whyRu: "Не дублировать и не пропускать скрининг",
  },
  {
    id: "s.cytology",
    label: "Цитология шейки матки — забор выполнен или отложен по алгоритму",
    important: true,
    pin: "cervix",
    whyRu: "Возраст + интервал + предыдущий результат. Статус «н/п» — если не по алгоритму сегодня",
  },
  {
    id: "s.hpv",
    label: "ВПЧ-тестирование — выполнено или отложено по возрасту/алгоритму",
    important: true,
    pin: "cervix",
    whyRu: "Не всем подряд вне возраста и интервала",
  },
  {
    id: "s.microscopy",
    label: "Микроскопия влагалищного отделяемого — по показаниям / маршруту",
    pin: "cervix",
  },
  {
    id: "s.colpo_decision",
    label: "Решение о кольпоскопии принято (нужна / не нужна / отложена)",
    allowsNote: true,
    pin: "cervix",
  },
];

const CORE_IMAGING: DynamicItem[] = [
  {
    id: "i.tvus",
    label: "УЗИ ОМТ — при показаниях или в рамках маршрута",
    important: true,
    whyRu: "Клинический вопрос должен влиять на тактику",
  },
  { id: "i.breast_us", label: "УЗИ молочных желёз — по показаниям" },
  { id: "i.colpo", label: "Кольпоскопия — по показаниям", pin: "cervix" },
  {
    id: "i.mmg",
    label: "Маммография — по возрасту, показаниям и маршруту",
    whyRu: "Не подменять скрининговый маршрут «желанием»",
  },
  { id: "i.other", label: "Другие исследования — по клинической ситуации", allowsNote: true },
];

const EXTRA_BY_REASON: Partial<Record<VisitReasonId, DynamicItem[]>> = {
  bleeding: [
    { id: "h.bleed_volume", label: "Объём и длительность кровопотери уточнены", important: true },
    { id: "h.pregnancy_excluded", label: "Беременность исключена или подтверждена", important: true },
  ],
  pelvic_pain: [
    { id: "h.pain_onset", label: "Острота начала боли уточнена", important: true },
    { id: "h.fever", label: "Лихорадка / озноб уточнены", important: true },
  ],
  discharge: [
    { id: "h.discharge_char", label: "Характер выделений и зуд/жжение уточнены", important: true },
  ],
  infertility: [
    { id: "h.trying_months", label: "Длительность попыток зачатия установлена", important: true },
    { id: "h.partner", label: "Мужской фактор / обследование партнёра обсуждены" },
  ],
  pregnancy: [
    { id: "h.ga", label: "Срок беременности / ПДР уточнены", important: true },
    { id: "h.fetal_move", label: "Шевеления / кровотечение / головная боль уточнены", important: true },
  ],
  breast: [
    { id: "h.breast_node", label: "Локализация узла / выделений из соска уточнены", important: true },
  ],
  menopause: [
    { id: "h.postmeno_bleed", label: "Кровотечения в постменопаузе исключены/зафиксированы", important: true },
  ],
};

function dedupeItems(items: DynamicItem[]): DynamicItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function buildDynamicChecklist(reasonIds: VisitReasonId[]): DynamicSection[] {
  const extras: DynamicItem[] = [];
  for (const id of reasonIds) {
    extras.push(...(EXTRA_BY_REASON[id] ?? []));
  }

  const reasonSection: DynamicSection = {
    id: "reason",
    title: "1. Причина обращения",
    hint: "Выбрано на старте. Можно скорректировать отметками ниже.",
    items: reasonIds.map((id) => ({
      id: `reason.${id}`,
      label: VISIT_REASONS.find((r) => r.id === id)?.labelRu ?? id,
      important: true,
    })),
  };

  return [
    reasonSection,
    {
      id: "history",
      title: "2. Жалобы и анамнез",
      hint: "Доп. вопросы зависят от причины обращения. Пустой пункт ≠ выполнен.",
      items: dedupeItems([...extras, ...CORE_HISTORY]),
    },
    {
      id: "exam",
      title: "3. Объективный осмотр",
      hint: "Зеркала и бимануально — по показаниям и сценарию. «н/п» = не применимо сегодня.",
      items: CORE_EXAM,
    },
    {
      id: "cervix",
      title: "3б. Шейка · цитология · ВПЧ",
      hint: "Кабинетный минимум первичного звена. Отметьте забор или осознанный отказ/отсрочку.",
      items: CERVIX_SCREENING,
    },
    {
      id: "imaging",
      title: "5. Инструментальная диагностика",
      items: CORE_IMAGING,
    },
  ];
}

export function filterImportant(sections: DynamicSection[]): DynamicSection[] {
  return sections
    .map((s) => ({ ...s, items: s.items.filter((i) => i.important) }))
    .filter((s) => s.items.length > 0);
}

/** Pinned essentials for primary-care HUD */
export function getPinnedEssentials(reasonIds: VisitReasonId[]): DynamicItem[] {
  const sections = buildDynamicChecklist(reasonIds.length ? reasonIds : (["primary"] as VisitReasonId[]));
  const pinned = sections.flatMap((s) => s.items).filter((i) => i.pin === "exam" || i.pin === "cervix");
  return dedupeItems(pinned);
}
