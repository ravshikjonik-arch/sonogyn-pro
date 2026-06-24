import { z } from "zod";

import {
  NAVIGATION_ACCENT_OVERRIDES,
  NAVIGATION_DOMAIN_ACCENT_BARS,
  NAVIGATION_LINK_OVERRIDES,
} from "./navigation-links";

/** Clinical / product domain for navigation grouping. */
export const NavigationDomainSchema = z.enum([
  "obstetrics",
  "gynecology",
  "rads",
  "library",
  "ai-assistant",
  "doctors-chat",
  "education",
  "pro",
]);

export type NavigationDomain = z.infer<typeof NavigationDomainSchema>;

/** Lucide icon component names used across web clinical UI. */
export const NavigationIconNameSchema = z.enum([
  "MessageCircle",
  "HandHeart",
  "Baby",
  "Calculator",
  "FileText",
  "Layers",
  "GraduationCap",
  "CircleDot",
  "Stethoscope",
  "ScanLine",
  "Brain",
  "BookOpen",
  "BookMarked",
  "ClipboardList",
  "Library",
  "Users",
  "HeartPulse",
  "Sparkles",
  "UserRound",
  "LayoutDashboard",
  "ScanSearch",
  "FileCheck",
  "BarChart3",
  "Mic",
  "Infinity",
  "Lock",
  "Send",
]);

export type NavigationIconName = z.infer<typeof NavigationIconNameSchema>;

export const NavigationItemSchema = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
  domain: NavigationDomainSchema,
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: NavigationIconNameSchema,
  badge: z.string().nullable(),
  isPro: z.boolean(),
  order: z.number().int().nonnegative(),
  href: z.string().min(1).optional(),
  externalHref: z.string().min(1).optional(),
  accentBar: z.string().min(1).optional(),
});

export type NavigationItem = z.infer<typeof NavigationItemSchema>;

export const NavigationConfigSchema = z.array(NavigationItemSchema);

export type NavigationConfig = z.infer<typeof NavigationConfigSchema>;

function findDuplicateKeys(items: NavigationItem[], key: "id" | "slug"): string | null {
  const seen = new Set<string>();
  for (const item of items) {
    const value = item[key];
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return null;
}

/**
 * Validates navigation config shape (Zod) and uniqueness of `id` and `slug`.
 * Call at module init / build — throws on invalid or duplicate entries.
 */
export function validateNavigationConfig(input: unknown): NavigationConfig {
  const parsed = NavigationConfigSchema.parse(input);

  const duplicateId = findDuplicateKeys(parsed, "id");
  if (duplicateId) {
    throw new Error(`[navigation.config] Duplicate id: "${duplicateId}"`);
  }

  const duplicateSlug = findDuplicateKeys(parsed, "slug");
  if (duplicateSlug) {
    throw new Error(`[navigation.config] Duplicate slug: "${duplicateSlug}"`);
  }

  return parsed;
}

/** Applies href / accent metadata and asserts every module is navigable. */
export function enrichNavigationItems(items: NavigationItem[]): NavigationItem[] {
  return items.map((item) => {
    const link = NAVIGATION_LINK_OVERRIDES[item.id];
    if (!link?.href && !link?.externalHref) {
      throw new Error(`[navigation.config] Missing href for id: "${item.id}"`);
    }

    return {
      ...item,
      href: link.href,
      externalHref: link.externalHref,
      accentBar:
        NAVIGATION_ACCENT_OVERRIDES[item.id] ??
        NAVIGATION_DOMAIN_ACCENT_BARS[item.domain],
    };
  });
}

export const NAVIGATION_DOMAIN_ORDER = [
  "obstetrics",
  "gynecology",
  "rads",
  "library",
  "ai-assistant",
  "doctors-chat",
  "education",
  "pro",
] as const satisfies readonly NavigationDomain[];

export const NAVIGATION_DOMAIN_LABELS: Record<NavigationDomain, string> = {
  obstetrics: "Акушерство",
  gynecology: "Гинекология",
  rads: "RADS-классификации",
  library: "Библиотека",
  "ai-assistant": "AI-помощник",
  "doctors-chat": "Чат врачей",
  education: "Обучение",
  pro: "PRO",
};

export type NavigationDomainSection = {
  domain: NavigationDomain;
  label: string;
  items: NavigationItem[];
};

export function getNavigationGroupedByDomain(): NavigationDomainSection[] {
  return NAVIGATION_DOMAIN_ORDER.map((domain) => ({
    domain,
    label: NAVIGATION_DOMAIN_LABELS[domain],
    items: getNavigationByDomain(domain),
  })).filter((section) => section.items.length > 0);
}

export function getNavigationItemUrl(item: NavigationItem): string {
  return item.externalHref ?? item.href ?? "#";
}

/**
 * All product modules — one card per `id`.
 * Domain rules: rads CDS separate from gynecology calculators; library = shelves + КР + norms.
 */
const RAW_NAVIGATION_CONFIG: NavigationItem[] = [
  // —— doctors-chat (100+) ——
  {
    id: "community.chat",
    slug: "doctors-chat",
    domain: "doctors-chat",
    category: "community",
    title: "Чат врачей",
    description:
      "Общий чат + гинекология + акушерство. Фото/видео в сообщениях и разбор клинических случаев.",
    icon: "MessageCircle",
    badge: "Live",
    isPro: false,
    order: 100,
  },
  {
    id: "community.new-case",
    slug: "new-ultrasound-case",
    domain: "doctors-chat",
    category: "case-discussion",
    title: "Новый кейс УЗИ",
    description: "Снимок в галерею кейса для разбора с коллегами.",
    icon: "ScanLine",
    badge: null,
    isPro: false,
    order: 110,
  },
  {
    id: "community.telegram",
    slug: "telegram-community",
    domain: "doctors-chat",
    category: "external-community",
    title: "Telegram сообщество",
    description: "@UltraGynAnalytics — аналитика, обновления и материалы для врачей УЗИ.",
    icon: "Send",
    badge: null,
    isPro: false,
    order: 120,
  },

  // —— ai-assistant (200+) ——
  {
    id: "assistant.hub",
    slug: "assistant",
    domain: "ai-assistant",
    category: "clinical-routes",
    title: "Помощник врача",
    description: "Нозология → анализы → УЗИ → лечение → протокол. Поиск и голос.",
    icon: "HandHeart",
    badge: "Маршрут",
    isPro: false,
    order: 200,
  },
  {
    id: "ai-assistant.create-conclusion",
    slug: "create-conclusion",
    domain: "ai-assistant",
    category: "quick-actions",
    title: "Создать заключение",
    description: "AI-помощь в составлении медицинского заключения по УЗИ.",
    icon: "FileText",
    badge: "AI",
    isPro: false,
    order: 210,
  },
  {
    id: "ai-assistant.analyze-ultrasound",
    slug: "analyze-ultrasound",
    domain: "ai-assistant",
    category: "quick-actions",
    title: "Проанализировать УЗИ",
    description: "Загрузка снимков в AI-рабочую зону — orchestrator и CDS-preview.",
    icon: "ScanLine",
    badge: "AI",
    isPro: false,
    order: 220,
  },
  {
    id: "ai-assistant.consultation",
    slug: "ai-consultation",
    domain: "ai-assistant",
    category: "quick-actions",
    title: "AI консультация",
    description: "Консультация по клиническому случаю с контекстом протокола.",
    icon: "Brain",
    badge: "AI",
    isPro: false,
    order: 230,
  },
  {
    id: "ai-assistant.find-patient",
    slug: "find-patient",
    domain: "ai-assistant",
    category: "quick-actions",
    title: "Найти пациента",
    description: "Поиск карточки пациентки и привязка протокола к исследованию.",
    icon: "Users",
    badge: null,
    isPro: false,
    order: 240,
  },
  {
    id: "ai-assistant.create-protocol",
    slug: "create-protocol",
    domain: "ai-assistant",
    category: "quick-actions",
    title: "Создать протокол",
    description: "Маршрут помощника → структурированный протокол УЗИ одним кликом.",
    icon: "Stethoscope",
    badge: null,
    isPro: false,
    order: 250,
  },
  {
    id: "workspace.ai",
    slug: "ai-workspace",
    domain: "ai-assistant",
    category: "ai-workspace",
    title: "AI-рабочая зона",
    description: "Загрузка снимков, orchestrator, CDS-preview — ассистивно.",
    icon: "Brain",
    badge: "AI",
    isPro: false,
    order: 260,
  },

  // —— obstetrics (300+) ——
  {
    id: "calculator.ob-hub",
    slug: "pregnancy-calculator",
    domain: "obstetrics",
    category: "pregnancy-calculators",
    title: "Калькулятор расчёта срока беременности",
    description: "ПМП, УЗИ, КТР, ЭКО, фетометрия, декрет — отдельный модуль. Поиск: срок, ПДР, ПМП.",
    icon: "Baby",
    badge: "Срок",
    isPro: false,
    order: 300,
  },
  {
    id: "calculator.appointment.ga-lmp",
    slug: "ga-lmp",
    domain: "obstetrics",
    category: "pregnancy-calculators",
    title: "Срок беременности по менструации",
    description: "ПМП → срок сегодня, ПДР (Негеле), окна скринингов.",
    icon: "Baby",
    badge: null,
    isPro: false,
    order: 310,
  },
  {
    id: "calculator.appointment.ga-us",
    slug: "ga-ultrasound",
    domain: "obstetrics",
    category: "pregnancy-calculators",
    title: "Срок беременности по УЗИ",
    description: "Дата исследования + срок на момент осмотра → ПДР.",
    icon: "Baby",
    badge: null,
    isPro: false,
    order: 320,
  },
  {
    id: "calculator.appointment.ga-ivf",
    slug: "ga-ivf",
    domain: "obstetrics",
    category: "pregnancy-calculators",
    title: "Срок по овуляции/ЭКО",
    description: "Дата переноса / овуляции → срок и ПДР.",
    icon: "Baby",
    badge: null,
    isPro: false,
    order: 330,
  },
  {
    id: "calculator.appointment.ga-movement",
    slug: "ga-fetal-movement",
    domain: "obstetrics",
    category: "pregnancy-calculators",
    title: "Срок по шевелениям плода",
    description: "Дата первых шевелений → оценка срока.",
    icon: "Baby",
    badge: null,
    isPro: false,
    order: 340,
  },
  {
    id: "calculator.appointment.ga-antenatal",
    slug: "ga-antenatal-visit",
    domain: "obstetrics",
    category: "pregnancy-calculators",
    title: "Срок по явке в ЖК",
    description: "Дата явки в женскую консультацию → срок беременности.",
    icon: "Baby",
    badge: null,
    isPro: false,
    order: 350,
  },
  {
    id: "calculator.appointment.maternity-leave",
    slug: "maternity-leave",
    domain: "obstetrics",
    category: "pregnancy-calculators",
    title: "Сроки декретного отпуска",
    description: "ПДР → даты декрета и выхода из отпуска.",
    icon: "Baby",
    badge: null,
    isPro: false,
    order: 360,
  },
  {
    id: "calculator.appointment.ga-edd",
    slug: "ga-edd",
    domain: "obstetrics",
    category: "pregnancy-calculators",
    title: "Срок по ПДР",
    description: "Известная ПДР → текущий срок беременности.",
    icon: "Baby",
    badge: null,
    isPro: false,
    order: 370,
  },
  {
    id: "calculator.appointment.ga-crl",
    slug: "ga-crl",
    domain: "obstetrics",
    category: "pregnancy-calculators",
    title: "Срок по КТР",
    description: "КТР на дату УЗИ → срок и ПДР по таблицам.",
    icon: "Baby",
    badge: null,
    isPro: false,
    order: 380,
  },
  {
    id: "calculator.appointment.ga-feto",
    slug: "ga-fetometry",
    domain: "obstetrics",
    category: "pregnancy-calculators",
    title: "Срок по фетометрии",
    description: "БПР, ОГ, ОЖ, ДБ — комбинированная оценка срока.",
    icon: "Baby",
    badge: null,
    isPro: false,
    order: 390,
  },
  {
    id: "calculator.fetal-weight",
    slug: "fetal-weight",
    domain: "obstetrics",
    category: "fetal-biometry",
    title: "Масса плода",
    description: "Hadlock, Рудаков, антропометрия матери — EFW.",
    icon: "Baby",
    badge: "EFW",
    isPro: false,
    order: 400,
  },
  {
    id: "calculator.bishop",
    slug: "bishop-score",
    domain: "obstetrics",
    category: "labor-induction",
    title: "Шкала Бишопа",
    description: "Созревание шейки перед индукцией родов.",
    icon: "Stethoscope",
    badge: null,
    isPro: false,
    order: 410,
  },
  {
    id: "calculator.vbac",
    slug: "vbac-tolac",
    domain: "obstetrics",
    category: "labor-delivery",
    title: "VBAC / TOLAC",
    description: "До родов и в родах после кесарева сечения.",
    icon: "Stethoscope",
    badge: null,
    isPro: false,
    order: 420,
  },
  {
    id: "calculator.pregnancy-meds",
    slug: "pregnancy-medications",
    domain: "obstetrics",
    category: "pregnancy-reference",
    title: "Лекарства при беременности",
    description: "Справочник категорий FDA (ориентир) для беременных.",
    icon: "FileText",
    badge: null,
    isPro: false,
    order: 430,
  },
  {
    id: "calculator.cervical-length",
    slug: "cervical-length",
    domain: "obstetrics",
    category: "preterm-screening",
    title: "Длина шейки матки (CL)",
    description: "Скрининг 16–24 нед, воронка, sludge — риск преждевременных родов.",
    icon: "Baby",
    badge: "CL",
    isPro: false,
    order: 440,
  },
  {
    id: "education.obstetric-atlas",
    slug: "obstetric-atlas-blinov",
    domain: "obstetrics",
    category: "obstetric-atlas",
    title: "Атлас I триместра (Блинов)",
    description: "Эхограммы 4–14 нед.: ранняя беременность, топоанатомия, пороги ЖК/кольца ПЯ.",
    icon: "GraduationCap",
    badge: "Атлас",
    isPro: false,
    order: 450,
  },
  {
    id: "education.fetal-anatomy-22",
    slug: "fetal-anatomy-22-views",
    domain: "obstetrics",
    category: "fetal-anatomy",
    title: "22 среза · 65 ВПР (II триместр)",
    description: "Систематический протокол Емельяненко: 24 views, 65 ВПР, 15 cases, ISUOG лекция 8.",
    icon: "GraduationCap",
    badge: "22+65",
    isPro: false,
    order: 460,
  },
  {
    id: "education.fetal-doppler-1t",
    slug: "fetal-doppler-first-trimester",
    domain: "obstetrics",
    category: "fetal-doppler",
    title: "Допплер I триместра (11–14 нед)",
    description: "5 допплер-позиций FMF: сердце, VP, пуповина, кольцо, UTA. ALARA, ISUOG лекция 7.",
    icon: "GraduationCap",
    badge: "11–14",
    isPro: false,
    order: 470,
  },
  {
    id: "education.fetal-spine",
    slug: "fetal-spine-atlas",
    domain: "obstetrics",
    category: "fetal-anatomy",
    title: "УЗИ позвоночника плода",
    description: "15 карточек: норма, spina bifida, миеломенингоцеле, сколиоз — II–III триместр.",
    icon: "GraduationCap",
    badge: "15",
    isPro: false,
    order: 480,
  },

  // —— gynecology (500+) ——
  {
    id: "calculator.endometrium",
    slug: "endometrium",
    domain: "gynecology",
    category: "uterine-pathology",
    title: "Эндометрий · ISUOG / КР РФ",
    description: "M-эхо, пороги, очаг, тамоксифен — протокол и экспорт.",
    icon: "Stethoscope",
    badge: null,
    isPro: false,
    order: 500,
  },
  {
    id: "calculator.pop-q",
    slug: "pop-q",
    domain: "gynecology",
    category: "pelvic-floor",
    title: "POP-Q · русская версия",
    description: "Золотой стандарт стадирования пролапса по точкам Aa/Ba/C/D/Ap/Bp/TVL.",
    icon: "Stethoscope",
    badge: null,
    isPro: false,
    order: 510,
  },
  {
    id: "calculator.colposcopy",
    slug: "colposcopy-swede",
    domain: "gynecology",
    category: "cervix-pathology",
    title: "Кольпоскопия · Swede Score",
    description: "Протокол по бланку, 5 признаков IFCPC, риск CIN 2+, PDF.",
    icon: "ScanLine",
    badge: null,
    isPro: false,
    order: 520,
  },
  {
    id: "calculator.cin-risk",
    slug: "cin-risk",
    domain: "gynecology",
    category: "cervix-pathology",
    title: "CIN Risk Calculator",
    description: "Вероятности CIN1 / CIN2+ / CIN3+ / AIS / инвазия — HPV, Bethesda, IFCPC.",
    icon: "ScanLine",
    badge: "IFCPC",
    isPro: false,
    order: 522,
  },
  {
    id: "calculator.cervical-intelligence",
    slug: "cervical-intelligence",
    domain: "gynecology",
    category: "cervix-pathology",
    title: "Cervical Pathology Intelligence",
    description: "CDS: IFCPC + HPV + Bethesda + Swede + Quality + клинические рекомендации.",
    icon: "Brain",
    badge: "CPI",
    isPro: false,
    order: 524,
  },
  {
    id: "calculator.risk-breast",
    slug: "breast-cancer-risk",
    domain: "gynecology",
    category: "oncologic-risk",
    title: "Риск рака молочной железы",
    description: "Образовательный чеклист факторов риска РМЖ.",
    icon: "ScanLine",
    badge: null,
    isPro: false,
    order: 530,
  },
  {
    id: "calculator.risk-cervical",
    slug: "cervical-cancer-risk",
    domain: "gynecology",
    category: "oncologic-risk",
    title: "Риск рака шейки матки",
    description: "Стратификация риска РШМ по факторам и скринингу.",
    icon: "ScanLine",
    badge: null,
    isPro: false,
    order: 540,
  },
  {
    id: "calculator.risk-cin",
    slug: "cin-follow-up",
    domain: "gynecology",
    category: "cervix-pathology",
    title: "Наблюдение после CIN",
    description: "Интервалы наблюдения ASCCP / КР РФ после CIN.",
    icon: "ScanLine",
    badge: null,
    isPro: false,
    order: 550,
  },
  {
    id: "calculator.risk-ovarian",
    slug: "ovarian-cancer-risk",
    domain: "gynecology",
    category: "oncologic-risk",
    title: "Риск рака яичников",
    description: "Эпидемиологическая стратификация / семейный анамнез.",
    icon: "CircleDot",
    badge: null,
    isPro: false,
    order: 560,
  },
  {
    id: "clinical.idea-endometriosis",
    slug: "idea-deep-endometriosis",
    domain: "gynecology",
    category: "deep-endometriosis",
    title: "IDEA · эндометриоз",
    description: "Deep infiltrating endometriosis — консенсус и тактика.",
    icon: "Stethoscope",
    badge: "IDEA",
    isPro: false,
    order: 570,
  },
  {
    id: "education.cervix-pathology",
    slug: "cervix-pathology-reference",
    domain: "gynecology",
    category: "cervix-pathology",
    title: "Патология шейки · справочник",
    description: "7 глав: анатомия, ЦИН, РШМ, FIGO. Режимы «студент» и «врач» + 16 вопросов.",
    icon: "BookOpen",
    badge: "7+16",
    isPro: false,
    order: 580,
  },
  {
    id: "mockup.hub",
    slug: "mockups",
    domain: "gynecology",
    category: "mockups",
    title: "Макеты УЗИ",
    description: "Матка, яичник, МЖ — выбор макета и порядка в меню.",
    icon: "Layers",
    badge: "3 макета",
    isPro: false,
    order: 590,
  },
  {
    id: "mockup.uterus",
    slug: "uterus-3d-mockup",
    domain: "gynecology",
    category: "mockups",
    title: "Макет матки · FIGO",
    description: "Коронарный разрез или сагиттальный срез — локализация и FIGO в протокол.",
    icon: "Stethoscope",
    badge: "FIGO",
    isPro: false,
    order: 600,
  },

  // —— rads / CDS (700+) ——
  {
    id: "calculator.hub",
    slug: "calculators-rads-hub",
    domain: "rads",
    category: "rads-hub",
    title: "Калькуляторы RADS",
    description: "O-RADS, BI-RADS, TI-RADS, LN-RADS, FIGO, FMF, эластография — по гайдлайнам.",
    icon: "Calculator",
    badge: "CDS",
    isPro: false,
    order: 700,
  },
  {
    id: "calculator.o-rads",
    slug: "o-rads-pro",
    domain: "rads",
    category: "rads-classifications",
    title: "O-RADS Pro",
    description: "O-RADS US v2022 + IOTA 2026 — полный калькулятор яичника.",
    icon: "CircleDot",
    badge: "O-RADS",
    isPro: false,
    order: 710,
  },
  {
    id: "calculator.bi-rads",
    slug: "bi-rads-us-pro",
    domain: "rads",
    category: "rads-classifications",
    title: "BI-RADS US Pro",
    description: "Быстрый калькулятор · брошюра v2025 · атлас · AI Assistant.",
    icon: "ScanLine",
    badge: "BI-RADS",
    isPro: false,
    order: 720,
  },
  {
    id: "calculator.ti-rads",
    slug: "ti-rads-thyroid",
    domain: "rads",
    category: "rads-classifications",
    title: "TI-RADS ЩЖ",
    description: "ACR TI-RADS Pro · Pattern Recognition · FNA · РФ 2023.",
    icon: "ScanLine",
    badge: "TI-RADS",
    isPro: false,
    order: 730,
  },
  {
    id: "calculator.ln-rads",
    slug: "ln-rads-us-pro",
    domain: "rads",
    category: "rads-classifications",
    title: "LN-RADS US Pro",
    description: "Morphology · Doppler · Atlas · Academy · AI · Cases · Board.",
    icon: "ScanLine",
    badge: "LN-RADS",
    isPro: false,
    order: 740,
  },
  {
    id: "calculator.figo",
    slug: "figo-fibroid",
    domain: "rads",
    category: "rads-classifications",
    title: "FIGO fibroid typing",
    description: "Morphology / mural mapping миомы матки.",
    icon: "Stethoscope",
    badge: "FIGO",
    isPro: false,
    order: 750,
  },
  {
    id: "calculator.elastography",
    slug: "elastography",
    domain: "rads",
    category: "rads-classifications",
    title: "Эластография",
    description: "Strain / SWE — шейка, миометрий, яичники, МЖ.",
    icon: "ScanLine",
    badge: null,
    isPro: false,
    order: 760,
  },
  {
    id: "assistant.fmf",
    slug: "fmf-screening",
    domain: "rads",
    category: "rads-classifications",
    title: "FMF · скрининги",
    description: "I–III скрининг, допплер, шейка — перцентили Медведева, протокол одним кликом.",
    icon: "Baby",
    badge: "FMF",
    isPro: false,
    order: 770,
  },
  {
    id: "report.adnex-orads",
    slug: "adnex-orads-report",
    domain: "rads",
    category: "rads-protocols",
    title: "Протокол O-RADS",
    description: "Структурированный протокол придатков по O-RADS US.",
    icon: "FileText",
    badge: null,
    isPro: false,
    order: 780,
  },
  {
    id: "mockup.ovary",
    slug: "ovary-atlas",
    domain: "rads",
    category: "rads-mockups",
    title: "Макет яичника · O-RADS",
    description: "Увеличенный яичник: фолликулы, кисты, ИИ по фото/видео, текст в протокол.",
    icon: "CircleDot",
    badge: "ИИ",
    isPro: false,
    order: 790,
  },
  {
    id: "mockup.breast",
    slug: "breast-3d-mockup",
    domain: "rads",
    category: "rads-mockups",
    title: "Макет молочной железы",
    description: "Схема обеих МЖ: часы, см от соска, квадрант — текст в протокол.",
    icon: "ScanLine",
    badge: "BI-RADS",
    isPro: false,
    order: 800,
  },
  {
    id: "education.orads-guide",
    slug: "orads-us-guide",
    domain: "rads",
    category: "rads-education",
    title: "O-RADS US · руководство",
    description: "Учебный реферат: алгоритм ACR v2022, 10 клинических случаев, категории 0–5.",
    icon: "BookOpen",
    badge: "v2022",
    isPro: false,
    order: 810,
  },
  {
    id: "education.orads-echograms",
    slug: "orads-echograms",
    domain: "rads",
    category: "rads-education",
    title: "O-RADS · эхограммы и случаи",
    description: "Учебные и клинические эхограммы придатков по нозологиям.",
    icon: "BookOpen",
    badge: "IOTA",
    isPro: false,
    order: 820,
  },
  {
    id: "education.iota-terms-2026",
    slug: "iota-terms-2026",
    domain: "rads",
    category: "rads-education",
    title: "IOTA 2026 · термины и ADNEX",
    description: "Консенсус IOTA Group 2026: solid component, color score, ADNEX — инфографика + 12 Q.",
    icon: "BookMarked",
    badge: "2026",
    isPro: false,
    order: 830,
  },
  {
    id: "education.orads-flow",
    slug: "orads-decision-tree",
    domain: "rads",
    category: "rads-education",
    title: "O-RADS Library",
    description: "Дерево решений O-RADS — mobile и обучение.",
    icon: "CircleDot",
    badge: null,
    isPro: false,
    order: 840,
  },

  // —— library (900+) — unified shelves + КР + norms ——
  {
    id: "education.library-hub",
    slug: "library",
    domain: "library",
    category: "library-shelves",
    title: "Библиотека",
    description: "Протоколы, чеклисты, атласы, курсы — образовательный слой.",
    icon: "Library",
    badge: "Edu",
    isPro: false,
    order: 900,
  },
  {
    id: "reference.guidelines",
    slug: "guidelines",
    domain: "library",
    category: "clinical-guidelines",
    title: "КР и приказы",
    description: "КР МЗ РФ, приказы ДЗМ — отдельные полки с быстрым поиском.",
    icon: "FileText",
    badge: "КР",
    isPro: false,
    order: 910,
  },
  {
    id: "reference.clinical-norms",
    slug: "clinical-norms",
    domain: "library",
    category: "clinical-reference",
    title: "Клинические нормы УЗИ",
    description: "КТР, БПР, AFI, допплер, скрининговые сроки — ISUOG / Hadlock.",
    icon: "BookOpen",
    badge: null,
    isPro: false,
    order: 920,
  },
  {
    id: "reference.evidence",
    slug: "evidence-base",
    domain: "library",
    category: "evidence-base",
    title: "УЗИ · доказательная база",
    description: "SonoEvidence v1: 7 полок, 235 тем — FMF, BI-RADS, O-RADS, эндокринология.",
    icon: "BookMarked",
    badge: "v1",
    isPro: false,
    order: 930,
  },
  {
    id: "reference.nosologies",
    slug: "nosologies",
    domain: "library",
    category: "clinical-reference",
    title: "Нозологии",
    description: "Справочник заболеваний: обследование, УЗ-диагностика, лечение, вставка в протокол.",
    icon: "ClipboardList",
    badge: null,
    isPro: false,
    order: 940,
  },
  {
    id: "reference.medvedev",
    slug: "medvedev-consensus",
    domain: "library",
    category: "clinical-reference",
    title: "Консенсусы УЗИ",
    description: "MUSA · IETA · IOTA · IDEA — консенсусы Медведева.",
    icon: "BookMarked",
    badge: null,
    isPro: false,
    order: 950,
  },
  {
    id: "workspace.home",
    slug: "workspace",
    domain: "library",
    category: "workspace",
    title: "Рабочий стол",
    description: "Персональный кабинет врача — быстрый доступ к модулям.",
    icon: "LayoutDashboard",
    badge: null,
    isPro: false,
    order: 960,
  },
  {
    id: "admin.dashboard",
    slug: "dashboard",
    domain: "library",
    category: "admin-tools",
    title: "Дашборд",
    description: "Сводка активности и клинических метрик.",
    icon: "HeartPulse",
    badge: null,
    isPro: false,
    order: 970,
  },
  {
    id: "account.profile",
    slug: "profile",
    domain: "library",
    category: "account",
    title: "Профиль",
    description: "ФИО, специализация, дата рождения, клинические настройки.",
    icon: "UserRound",
    badge: null,
    isPro: false,
    order: 980,
  },

  // —— education (1000+) ——
  {
    id: "education.isuog-basic",
    slug: "isuog-basic-course",
    domain: "education",
    category: "courses",
    title: "ISUOG — базовый курс",
    description:
      "Basic Training: лекция 6 — ранняя беременность 4–10 нед, презентация на Яндекс.Диске.",
    icon: "GraduationCap",
    badge: "ISUOG",
    isPro: false,
    order: 1000,
  },
  {
    id: "education.career-path",
    slug: "career-path",
    domain: "education",
    category: "career-ladder",
    title: "Путь врача · ординатор",
    description: "Студент → ординатор → врач → PRO: лестница карьеры и открытие модулей.",
    icon: "GraduationCap",
    badge: "Карьера",
    isPro: false,
    order: 1010,
  },

  // —— pro (1100+) ——
  {
    id: "billing.paywall",
    slug: "pro-subscription",
    domain: "pro",
    category: "subscription",
    title: "SonoGyn PRO",
    description: "Подписка PRO — расширенные AI-возможности и безлимитные запросы.",
    icon: "Sparkles",
    badge: "PRO",
    isPro: false,
    order: 1100,
  },
  {
    id: "pro.ai-full-conclusion",
    slug: "pro-ai-full-conclusion",
    domain: "pro",
    category: "pro-features",
    title: "AI полное заключение",
    description: "Генерация полного структурированного заключения по УЗИ.",
    icon: "FileCheck",
    badge: "PRO",
    isPro: true,
    order: 1110,
  },
  {
    id: "pro.ai-diagnostic-recommendations",
    slug: "pro-ai-diagnostic-recommendations",
    domain: "pro",
    category: "pro-features",
    title: "AI диагностические рекомендации",
    description: "Расширенные рекомендации по тактике после УЗИ.",
    icon: "Stethoscope",
    badge: "PRO",
    isPro: true,
    order: 1120,
  },
  {
    id: "pro.advanced-analytics",
    slug: "pro-advanced-analytics",
    domain: "pro",
    category: "pro-features",
    title: "Расширенная аналитика",
    description: "Статистика практики и клинические метрики.",
    icon: "BarChart3",
    badge: "PRO",
    isPro: true,
    order: 1130,
  },
  {
    id: "pro.voice-assistant",
    slug: "pro-voice-assistant",
    domain: "pro",
    category: "pro-features",
    title: "Голосовой помощник",
    description: "Голосовой ввод и диктовка протокола.",
    icon: "Mic",
    badge: "PRO",
    isPro: true,
    order: 1140,
  },
  {
    id: "pro.unlimited-ai",
    slug: "pro-unlimited-ai",
    domain: "pro",
    category: "pro-features",
    title: "Безлимитные AI-запросы",
    description: "Снятие лимитов на AI-запросы в клиническом кабинете.",
    icon: "Infinity",
    badge: "PRO",
    isPro: true,
    order: 1150,
  },
];

/** Validated navigation config — throws at import if ids/slugs collide or schema fails. */
export const NAVIGATION_CONFIG: NavigationConfig = enrichNavigationItems(
  validateNavigationConfig(RAW_NAVIGATION_CONFIG),
);

export const NAVIGATION_ITEM_COUNT = NAVIGATION_CONFIG.length;

export function getNavigationByDomain(domain: NavigationDomain): NavigationItem[] {
  return NAVIGATION_CONFIG.filter((item) => item.domain === domain).sort((a, b) => a.order - b.order);
}

export function getNavigationBySlug(slug: string): NavigationItem | undefined {
  return NAVIGATION_CONFIG.find((item) => item.slug === slug);
}

export function getNavigationById(id: string): NavigationItem | undefined {
  return NAVIGATION_CONFIG.find((item) => item.id === id);
}

export function getNavigationByCategory(domain: NavigationDomain, category: string): NavigationItem[] {
  return NAVIGATION_CONFIG.filter((item) => item.domain === domain && item.category === category).sort(
    (a, b) => a.order - b.order,
  );
}

/** Home-tile order (legacy /app tiles) — ids only, presentation in web layer. */
export const HOME_TILE_NAVIGATION_ORDER = [
  "community.chat",
  "assistant.hub",
  "calculator.ob-hub",
  "calculator.hub",
  "reference.guidelines",
  "education.library-hub",
  "education.isuog-basic",
  "mockup.hub",
  "mockup.ovary",
  "mockup.uterus",
  "mockup.breast",
  "workspace.ai",
] as const;

export function getHomeTileNavigation(): NavigationItem[] {
  const byId = new Map(NAVIGATION_CONFIG.map((item) => [item.id, item]));
  return HOME_TILE_NAVIGATION_ORDER.map((id) => byId.get(id)).filter(
    (item): item is NavigationItem => item !== undefined,
  );
}
