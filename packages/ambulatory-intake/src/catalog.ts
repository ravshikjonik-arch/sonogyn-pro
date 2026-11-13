import type { ChecklistSection } from "./schemas";

/**
 * Primary ambulatory OB/GYN intake checklist (physician tool).
 * Source of truth for stage 1 — aligned with docs/ambulatory-intake/01_*.
 * Items start unchecked; UI must never auto-mark.
 */
export const AMBULATORY_INTAKE_SECTIONS: ChecklistSection[] = [
  {
    id: "visit-goal",
    number: 1,
    title: "Цель обращения и маршрут",
    items: [
      { id: "visit.primary", label: "Первичный приём", allowsNote: false },
      { id: "visit.followup", label: "Повторный приём", allowsNote: false },
      { id: "visit.complaints", label: "Обращение по жалобам", allowsNote: false },
      { id: "visit.preventive", label: "Профилактический осмотр", allowsNote: false },
      { id: "visit.dispensarization", label: "Диспансеризация взрослого населения", allowsNote: false },
      { id: "visit.dorz", label: "Диспансеризация репродуктивного здоровья (ДОРЗ)", allowsNote: false },
      { id: "visit.preconception", label: "Планирование беременности", allowsNote: false },
      { id: "visit.control", label: "Контроль ранее выявленного заболевания", allowsNote: false },
      { id: "visit.referral", label: "Направление другого специалиста", allowsNote: false },
    ],
  },
  {
    id: "complaints",
    number: 2,
    title: "Жалобы",
    items: [
      { id: "c.none", label: "Жалоб нет", allowsNote: false },
      { id: "c.pelvic_pain", label: "Боль внизу живота / тазовая боль", allowsNote: false },
      { id: "c.cycle", label: "Нарушение менструального цикла", allowsNote: false },
      { id: "c.hmenorrhagia", label: "Обильные или длительные менструации", allowsNote: false },
      { id: "c.intermenstrual", label: "Межменструальные кровянистые выделения", allowsNote: false },
      { id: "c.postcoital", label: "Посткоитальные кровянистые выделения", allowsNote: false },
      { id: "c.postmeno_bleed", label: "Кровянистые выделения в постменопаузе", allowsNote: false },
      { id: "c.discharge", label: "Патологические выделения", allowsNote: false },
      { id: "c.itch", label: "Зуд / жжение", allowsNote: false },
      { id: "c.dyspareunia", label: "Диспареуния", allowsNote: false },
      { id: "c.dysuria", label: "Дизурические симптомы", allowsNote: false },
      { id: "c.fertility", label: "Нарушение фертильности", allowsNote: false },
      { id: "c.menopause", label: "Симптомы менопаузы", allowsNote: false },
      { id: "c.breast", label: "Жалобы со стороны молочных желёз", allowsNote: false },
      { id: "c.other", label: "Другие", allowsNote: true },
    ],
  },
  {
    id: "anamnesis",
    number: 3,
    title: "Анамнез",
    subsections: [
      {
        id: "menstrual",
        title: "Менструальный анамнез",
        items: [
          { id: "a.menarche", label: "Возраст менархе", allowsNote: false },
          { id: "a.lmp", label: "Дата последней менструации", allowsNote: false },
          { id: "a.cycle_pattern", label: "Длительность и регулярность цикла", allowsNote: false },
          { id: "a.bleeding_volume", label: "Продолжительность и объём кровопотери", allowsNote: false },
          { id: "a.dysmenorrhea", label: "Болезненность менструаций", allowsNote: false },
          { id: "a.intermenstrual", label: "Межменструальные выделения", allowsNote: false },
          { id: "a.menopause", label: "Менопауза: возраст / дата последней менструации", allowsNote: true },
        ],
      },
      {
        id: "obstetric",
        title: "Акушерский анамнез",
        items: [
          { id: "a.pregnancies", label: "Беременности", allowsNote: false },
          { id: "a.births", label: "Роды", allowsNote: false },
          { id: "a.miscarriage", label: "Самопроизвольные выкидыши", allowsNote: false },
          { id: "a.abortion", label: "Искусственные аборты", allowsNote: false },
          { id: "a.ectopic", label: "Внематочная беременность", allowsNote: false },
          { id: "a.preterm", label: "Преждевременные роды", allowsNote: false },
          { id: "a.ob_complications", label: "Осложнения беременности и родов", allowsNote: false },
          { id: "a.cs_uterine", label: "Кесарево сечение / операции на матке", allowsNote: false },
        ],
      },
      {
        id: "gynecologic",
        title: "Гинекологический анамнез",
        items: [
          { id: "a.sti", label: "ИППП в анамнезе", allowsNote: false },
          { id: "a.pid", label: "Воспалительные заболевания органов малого таза", allowsNote: false },
          { id: "a.endometriosis", label: "Эндометриоз / аденомиоз", allowsNote: false },
          { id: "a.myoma", label: "Миома матки", allowsNote: false },
          { id: "a.ovarian_mass", label: "Образования яичников", allowsNote: false },
          { id: "a.cervix", label: "Патология шейки матки", allowsNote: false },
          { id: "a.hpv", label: "ВПЧ-инфекция", allowsNote: false },
          { id: "a.cin", label: "CIN / дисплазия", allowsNote: false },
          { id: "a.pelvic_surgery", label: "Операции на органах малого таза", allowsNote: false },
          {
            id: "a.prior_cytology",
            label: "Предыдущие результаты цитологии, ВПЧ-тестов, гистологии",
            allowsNote: false,
          },
        ],
      },
      {
        id: "contraception",
        title: "Контрацепция и репродуктивные планы",
        items: [
          { id: "a.contraception_method", label: "Метод контрацепции", allowsNote: true },
          { id: "a.contraception_tolerance", label: "Переносимость и удовлетворённость методом", allowsNote: false },
          { id: "a.pregnancy_plans", label: "Планирование беременности и предполагаемые сроки", allowsNote: false },
          { id: "a.infertility_workup", label: "Трудности с зачатием / обследование по поводу бесплодия", allowsNote: false },
          { id: "a.repro_discussed", label: "Репродуктивные планы обсуждены", allowsNote: false },
        ],
      },
      {
        id: "life",
        title: "Анамнез жизни",
        items: [
          { id: "a.chronic", label: "Хронические заболевания", allowsNote: true },
          { id: "a.meds", label: "Лекарственные препараты и БАД", allowsNote: true },
          { id: "a.allergy", label: "Аллергологический анамнез", allowsNote: true },
          { id: "a.heredity", label: "Наследственность, включая онкологические заболевания", allowsNote: false },
          { id: "a.habits", label: "Курение / алкоголь и другие значимые факторы", allowsNote: false },
          { id: "a.surgery", label: "Операции", allowsNote: false },
          { id: "a.thrombosis", label: "Тромбозы / тромбоэмболии", allowsNote: false },
          { id: "a.oncology_personal", label: "Личный онкологический анамнез", allowsNote: false },
        ],
      },
    ],
  },
  {
    id: "exam",
    number: 4,
    title: "Объективный осмотр",
    hint: "Отмечайте только фактически выполненные элементы.",
    items: [
      { id: "e.general", label: "Общее состояние", allowsNote: false },
      { id: "e.anthropometry", label: "Рост, масса тела, ИМТ", allowsNote: false },
      { id: "e.bp", label: "Артериальное давление", allowsNote: false },
      { id: "e.pulse", label: "Пульс — если клинически уместно", allowsNote: false },
      {
        id: "e.breast",
        label: "Осмотр / пальпация молочных желёз — по цели визита и показаниям",
        allowsNote: false,
      },
      { id: "e.external", label: "Осмотр наружных половых органов", allowsNote: false },
      {
        id: "e.speculum",
        label: "Осмотр влагалища и шейки матки в зеркалах — при показаниях / профилактическом маршруте",
        allowsNote: false,
      },
      { id: "e.discharge_char", label: "Оценка характера выделений", allowsNote: false },
      { id: "e.bimanual", label: "Бимануальное исследование — при показаниях", allowsNote: false },
      {
        id: "e.uterus",
        label: "Оценка болезненности, размеров, положения и подвижности матки",
        allowsNote: false,
      },
      {
        id: "e.adnexa",
        label: "Оценка придатков — в пределах возможностей клинического исследования",
        allowsNote: false,
      },
    ],
  },
  {
    id: "labs",
    number: 5,
    title: "Лабораторная диагностика",
    hint:
      "Для каждого назначения: показание, диагностическая задача, срок/день цикла, влияние на тактику. Не назначать панели рутинно без показаний.",
    subsections: [
      {
        id: "labs-program",
        title: "А. В рамках программы диспансеризации",
        items: [
          { id: "l.age_periodicity", label: "Проверены возраст, периодичность и критерии включения", allowsNote: false },
          { id: "l.dorz_algorithm", label: "Проверен действующий алгоритм ДОРЗ / программы", allowsNote: false },
          {
            id: "l.microscopy",
            label: "Микроскопическое исследование влагалищного отделяемого — если предусмотрено",
            allowsNote: false,
          },
          { id: "l.hpv", label: "ВПЧ-тестирование — если предусмотрено возрастом и алгоритмом", allowsNote: false },
          { id: "l.cytology", label: "Цитологическое исследование — если предусмотрено", allowsNote: false },
          { id: "l.sti_screen", label: "Исследования на ИППП — если предусмотрены", allowsNote: false },
          { id: "l.prior_screens", label: "Результаты предыдущих скринингов проверены", allowsNote: false },
        ],
      },
      {
        id: "labs-clinical",
        title: "Б. По клиническим показаниям",
        items: [
          { id: "l.cbc", label: "ОАК", allowsNote: false },
          { id: "l.ferritin", label: "Ферритин", allowsNote: false },
          { id: "l.tsh", label: "ТТГ", allowsNote: false },
          { id: "l.prolactin", label: "Пролактин", allowsNote: false },
          { id: "l.fsh", label: "ФСГ", allowsNote: false },
          { id: "l.lh", label: "ЛГ", allowsNote: false },
          { id: "l.estradiol", label: "Эстрадиол", allowsNote: false },
          { id: "l.progesterone", label: "Прогестерон", allowsNote: false },
          { id: "l.amh", label: "АМГ", allowsNote: false },
          { id: "l.glucose", label: "Глюкоза / HbA1c", allowsNote: false },
          { id: "l.biochem", label: "Биохимические исследования", allowsNote: false },
          { id: "l.ua", label: "Общий анализ мочи", allowsNote: false },
          { id: "l.hcg", label: "ХГЧ", allowsNote: false },
          { id: "l.pcr_sti", label: "ПЦР на конкретные ИППП", allowsNote: true },
          { id: "l.culture", label: "Посев / микробиологическое исследование", allowsNote: false },
          { id: "l.other", label: "Другие", allowsNote: true },
        ],
      },
    ],
  },
  {
    id: "imaging",
    number: 6,
    title: "Инструментальная диагностика",
    hint: "Для каждого исследования укажите показание и клинический вопрос.",
    items: [
      { id: "i.tvus", label: "УЗИ органов малого таза трансвагинально", allowsNote: false },
      { id: "i.taus", label: "УЗИ органов малого таза трансабдоминально", allowsNote: false },
      { id: "i.breast_us", label: "УЗИ молочных желёз", allowsNote: false },
      { id: "i.mmg", label: "Маммография — по скрининговому маршруту или показаниям", allowsNote: false },
      { id: "i.colposcopy", label: "Кольпоскопия", allowsNote: false },
      { id: "i.cervix_bx", label: "Биопсия шейки матки", allowsNote: false },
      { id: "i.endometrial_bx", label: "Биопсия эндометрия", allowsNote: false },
      { id: "i.hysteroscopy", label: "Гистероскопия", allowsNote: false },
      { id: "i.other", label: "Другое", allowsNote: true },
    ],
  },
  {
    id: "plan",
    number: 7,
    title: "Заключение и план",
    items: [
      { id: "p.diagnosis", label: "Сформулирован предварительный / клинический диагноз", allowsNote: false },
      { id: "p.icd10", label: "Указан код МКБ-10 при достаточных основаниях", allowsNote: true },
      { id: "p.diff", label: "Рассмотрен дифференциальный диагноз", allowsNote: false },
      { id: "p.orders_justified", label: "Обоснованы назначения", allowsNote: false },
      { id: "p.treatment", label: "Составлен план лечения", allowsNote: false },
      { id: "p.nonpharm", label: "Даны немедикаментозные рекомендации", allowsNote: false },
      { id: "p.contraception", label: "Обсуждены контрацепция / репродуктивные планы", allowsNote: false },
      { id: "p.referral", label: "Оформлено направление к профильному специалисту при необходимости", allowsNote: false },
      { id: "p.followup", label: "Определён срок контроля", allowsNote: true },
      { id: "p.red_flags", label: "Объяснены признаки, требующие срочного обращения", allowsNote: false },
      { id: "p.consent", label: "Информированное согласие оформлено, когда оно требуется", allowsNote: false },
    ],
  },
];

export const CHART_FIELD_IDS = [
  "complaints",
  "history_present",
  "history_life_gyn",
  "objective",
  "investigations",
  "assessment",
  "plan",
  "counseling",
] as const;

export type ChartFieldId = (typeof CHART_FIELD_IDS)[number];

export const CHART_FIELD_LABELS: Record<ChartFieldId, string> = {
  complaints: "Жалобы",
  history_present: "Анамнез заболевания",
  history_life_gyn: "Анамнез жизни и гинекологический/акушерский анамнез",
  objective: "Объективно",
  investigations: "Обследования",
  assessment: "Клиническая оценка",
  plan: "План",
  counseling: "Разъяснения",
};

export const AMBULATORY_INTAKE_DISCLAIMER =
  "Рабочий шаблон CDS для врача, не утверждённый локальный НПА медицинской организации. Отмечайте только фактически выполненные действия. Не является диагнозом; интерпретация и назначения — решение врача. Перед клиническим применением сверьте актуальные редакции федеральных документов, КР и региональных приказов.";

export const REGULATORY_CHECK_LINKS = [
  { label: "pravo.gov.ru", href: "https://pravo.gov.ru/" },
  { label: "Рубрикатор КР МЗ РФ", href: "https://cr.minzdrav.gov.ru/" },
  { label: "Минздрав России", href: "https://minzdrav.gov.ru/" },
] as const;

export function listAllItems(): {
  sectionId: string;
  subsectionId?: string;
  item: { id: string; label: string; allowsNote: boolean };
}[] {
  const out: {
    sectionId: string;
    subsectionId?: string;
    item: { id: string; label: string; allowsNote: boolean };
  }[] = [];
  for (const section of AMBULATORY_INTAKE_SECTIONS) {
    for (const item of section.items ?? []) {
      out.push({ sectionId: section.id, item });
    }
    for (const sub of section.subsections ?? []) {
      for (const item of sub.items) {
        out.push({ sectionId: section.id, subsectionId: sub.id, item });
      }
    }
  }
  return out;
}

export function getItemLabel(itemId: string): string | undefined {
  return listAllItems().find((row) => row.item.id === itemId)?.item.label;
}
