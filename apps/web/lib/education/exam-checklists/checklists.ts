import type { ExamChecklistCategoryMeta, ExamProtocol, ExamProtocolId } from "./types";

export const EXAM_CHECKLIST_CATEGORIES: ExamChecklistCategoryMeta[] = [
  {
    id: "visualize",
    labelRu: "Визуализация",
    description: "Обязательные проекции и структуры для визуальной оценки",
  },
  {
    id: "measure",
    labelRu: "Измерения",
    description: "Параметры, которые необходимо измерить и зафиксировать",
  },
  {
    id: "document",
    labelRu: "Документирование",
    description: "Элементы протокола и сопроводительной информации",
  },
  {
    id: "mustNotMiss",
    labelRu: "Нельзя пропустить",
    description: "Критические находки и красные флаги",
  },
];

export const EXAM_PROTOCOLS: ExamProtocol[] = [
  {
    id: "gynecologic-pelvic",
    titleRu: "УЗИ органов малого таза (TA + TV)",
    subtitle: "AIUM Practice Parameter · Female Pelvis (2024)",
    source: "AIUM · Female Pelvis",
    sourceUrl: "https://www.aium.org/resources/practice-parameters",
    relatedHref: "/calculators/endometrium",
    relatedLabel: "Калькулятор эндометрия",
    items: [
      { id: "gp-ta-uterus", category: "visualize", label: "TA: матка — размер, форма, положение, версия", required: true },
      { id: "gp-ta-myometrium", category: "visualize", label: "TA: миометрий — однородность, узлы, контуры", required: true },
      { id: "gp-ta-endometrium", category: "visualize", label: "TA: эндометрий — толщина, контуры, полость", required: true },
      { id: "gp-ta-ovaries", category: "visualize", label: "TA: яичники — локализация, размер, кисты/массы", required: true },
      { id: "gp-ta-cul-de-sac", category: "visualize", label: "TA: Douglas / cul-de-sac — свободная жидкость", required: true },
      { id: "gp-tv-uterus", category: "visualize", label: "TV: матка — эндометрий, миометрий, шейка", required: true, hint: "TV выполняется после TA при доступности" },
      { id: "gp-tv-ovaries", category: "visualize", label: "TV: яичники — фолликулы, кисты, массы, кровоток", required: true },
      { id: "gp-tv-adnexa", category: "visualize", label: "TV: придатки — трубы, гидросальпинкс, эндометриома", required: true },
      { id: "gp-measure-uterus", category: "measure", label: "Размеры матки (DL × DAP × DT)", required: true },
      { id: "gp-measure-endometrium", category: "measure", label: "Толщина эндометрия (максимум, фаза цикла)", required: true },
      { id: "gp-measure-ovaries", category: "measure", label: "Размеры яичников, объём кист/масс", required: true },
      { id: "gp-doppler", category: "measure", label: "Допплер при подозрении на злокачественность / torsion", required: false },
      { id: "gp-doc-indication", category: "document", label: "Показания, метод (TA/TV), качество визуализации", required: true },
      { id: "gp-doc-iud", category: "document", label: "ВМС / импланты — положение, если есть", required: false },
      { id: "gp-doc-comparison", category: "document", label: "Сравнение с предыдущим исследованием", required: false },
      { id: "gp-miss-malignancy", category: "mustNotMiss", label: "Подозрительная солидная/сложная аднексальная масса", required: true },
      { id: "gp-miss-endometrial", category: "mustNotMiss", label: "Утолщение эндометрия вне физиологии", required: true },
      { id: "gp-miss-hemoperitoneum", category: "mustNotMiss", label: "Гемоперитонеум / свободная жидкость при острой боли", required: true },
    ],
  },
  {
    id: "obstetric-standard",
    titleRu: "Стандартное акушерское УЗИ",
    subtitle: "AIUM Practice Parameter · Obstetric Standard (2024)",
    source: "AIUM · Obstetric Standard",
    sourceUrl: "https://www.aium.org/resources/practice-parameters",
    relatedHref: "/reports/obstetric",
    relatedLabel: "Structured Report · акушерство",
    items: [
      { id: "os-fetal-number", category: "visualize", label: "Число плодов, хориальность/амниальность (многоплодие)", required: true },
      { id: "os-presentation", category: "visualize", label: "Предлежание плода", required: true },
      { id: "os-cardiac-activity", category: "visualize", label: "Сердечная деятельность плода", required: true },
      { id: "os-placenta", category: "visualize", label: "Локализация плаценты, отношение к OS", required: true },
      { id: "os-afi", category: "visualize", label: "Объём околоплодных вод (AFI / deepest pocket)", required: true },
      { id: "os-cervix", category: "visualize", label: "Длина и морфология шейки матки", required: true },
      { id: "os-biometry", category: "measure", label: "BPD, HC, AC, FL (± HL) — соответствие сроку", required: true },
      { id: "os-efw", category: "measure", label: "Расчёт массы плода (EFW) и перцентиль", required: true },
      { id: "os-ga", category: "document", label: "Срок беременности (LMP / US / IVF)", required: true },
      { id: "os-edd", category: "document", label: "ПДР и метод её определения", required: true },
      { id: "os-limitations", category: "document", label: "Ограничения исследования (ожирение, подвижность)", required: true },
      { id: "os-miss-iugr", category: "mustNotMiss", label: "Задержка роста / асимметрия биометрии", required: true },
      { id: "os-miss-oligo", category: "mustNotMiss", label: "Олигогидрамнион / полигидрамнион", required: true },
      { id: "os-miss-placenta-previa", category: "mustNotMiss", label: "Placenta previa / low-lying placenta", required: true },
      { id: "os-miss-short-cl", category: "mustNotMiss", label: "Укорочение шейки при факторах риска ПР", required: true },
    ],
  },
  {
    id: "obstetric-first-trimester",
    titleRu: "УЗИ I триместра (11–13+6 нед)",
    subtitle: "ISUOG Practice Guidelines · 11–14 week scan + AIUM Detailed 1st Trimester",
    source: "ISUOG · 11–14 week scan",
    sourceUrl: "https://www.isuog.org/clinical-resources/isuog-guidelines.html",
    relatedHref: "/ai/consultants/fmf?section=first",
    relatedLabel: "FMF · I скрининг",
    items: [
      { id: "ft-location", category: "visualize", label: "Локализация ПЯ (внутриматочно / исключить эктопию)", required: true },
      { id: "ft-fetal-pole", category: "visualize", label: "Эмбрион/плод, ЧСС, жизненность", required: true },
      { id: "ft-crl", category: "measure", label: "КТР — dating, соответствие сроку", required: true },
      { id: "ft-nt", category: "measure", label: "Толщина воротникового пространства (ТВ)", required: true },
      { id: "ft-nasal-bone", category: "visualize", label: "Носовая кость — наличие/отсутствие", required: true },
      { id: "ft-tricuspid", category: "visualize", label: "Трicuspid valve flow — regurgitation", required: true },
      { id: "ft-dv", category: "measure", label: "Ductus venosus — PI, a-wave", required: true },
      { id: "ft-ua-doppler", category: "measure", label: "Uterine arteries PI (mean) — по протоколу скрининга", required: false },
      { id: "ft-anatomy", category: "visualize", label: "Базовая анатомия: желудок, мочевой пузырь, конечности", required: true },
      { id: "ft-chorion", category: "visualize", label: "Хорion / placenta location", required: true },
      { id: "ft-doc-risk", category: "document", label: "Расчёт риска (комбинированный скрининг / NIPT)", required: true },
      { id: "ft-doc-criteria", category: "document", label: "Критерии неудачной Б (СДПМ, КТР, ЧСС)", required: true },
      { id: "ft-miss-ectopic", category: "mustNotMiss", label: "Эктопия / CSSP / интерстициальная", required: true },
      { id: "ft-miss-nt-nb", category: "mustNotMiss", label: "↑ ТВ + отсутствие носовой кости", required: true },
      { id: "ft-miss-anomalies", category: "mustNotMiss", label: "Крупные структурные аномалии I триместра", required: true },
    ],
  },
  {
    id: "obstetric-third-trimester",
    titleRu: "УЗИ III триместра (≥28 нед)",
    subtitle: "ISUOG Practice Guidelines · Third-trimester obstetric scan",
    source: "ISUOG · III trimester",
    sourceUrl: "https://www.isuog.org/clinical-resources/isuog-guidelines.html",
    relatedHref: "/calculators/cervical-length",
    relatedLabel: "Калькулятор длины шейки",
    items: [
      { id: "tt-presentation", category: "visualize", label: "Предлежание, положение плода", required: true },
      { id: "tt-placenta", category: "visualize", label: "Placenta — локализация, зрелость, отрыв", required: true },
      { id: "tt-afi", category: "visualize", label: "AFV — deepest pocket / AFI", required: true },
      { id: "tt-biometry", category: "measure", label: "BPD, HC, AC, FL — перцентили, рост", required: true },
      { id: "tt-efw", category: "measure", label: "EFW и перцентиль (Hadlock / INTERGROWTH)", required: true },
      { id: "tt-doppler-ua", category: "measure", label: "Umbilical artery Doppler — PI, absent/reversed ED", required: true },
      { id: "tt-doppler-mca", category: "measure", label: "MCA Doppler при подозрении на FGR", required: false },
      { id: "tt-doppler-cpr", category: "measure", label: "CPR (MCA/UA) при FGR", required: false },
      { id: "tt-cervix", category: "measure", label: "Cervical length при факторах риска ПР", required: false },
      { id: "tt-doc-growth", category: "document", label: "Динамика роста vs предыдущие исследования", required: true },
      { id: "tt-doc-doppler", category: "document", label: "Интерпретация допплера и план наблюдения", required: true },
      { id: "tt-miss-fgr", category: "mustNotMiss", label: "FGR / SGA — критерии и стадия", required: true },
      { id: "tt-miss-doppler", category: "mustNotMiss", label: "Absent/reversed end-diastolic flow в ПА", required: true },
      { id: "tt-miss-oligo", category: "mustNotMiss", label: "Олигогидрамнион (deepest pocket <2 cm)", required: true },
    ],
  },
];

export function getExamProtocol(id: ExamProtocolId): ExamProtocol | undefined {
  return EXAM_PROTOCOLS.find((p) => p.id === id);
}

export function itemsByCategory(protocol: ExamProtocol) {
  return EXAM_CHECKLIST_CATEGORIES.map((cat) => ({
    ...cat,
    items: protocol.items.filter((item) => item.category === cat.id),
  })).filter((group) => group.items.length > 0);
}

export function protocolCompleteness(
  protocol: ExamProtocol,
  progress: Record<string, boolean>,
): { percent: number; requiredDone: number; requiredTotal: number; missingRequired: string[] } {
  const required = protocol.items.filter((i) => i.required);
  const requiredDone = required.filter((i) => progress[i.id]).length;
  const missingRequired = required.filter((i) => !progress[i.id]).map((i) => i.label);
  const allDone = Object.values(progress).filter(Boolean).length;
  const percent = protocol.items.length ? Math.round((allDone / protocol.items.length) * 100) : 0;
  return {
    percent,
    requiredDone,
    requiredTotal: required.length,
    missingRequired,
  };
}

export const EXAM_PROTOCOL_COUNT = EXAM_PROTOCOLS.length;
export const EXAM_ITEM_COUNT = EXAM_PROTOCOLS.reduce((n, p) => n + p.items.length, 0);
