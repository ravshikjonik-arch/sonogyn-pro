/** Domain hub cards — single source for /tools, sidebar, and domain landing pages. */

export type DomainHubCard = {
  href: string;
  title: string;
  description: string;
  badge?: string;
  primary?: boolean;
};

export const TOOLS_HOME_DOMAINS = [
  {
    href: "/tools/obstetrics",
    title: "Акушерство",
    description: "Беременность, FMF, фетометрия, допплер, акушерский атлас",
    accent: "from-teal-600 to-cyan-500",
  },
  {
    href: "/tools/gynecology",
    title: "Гинекология",
    description: "O-RADS, FIGO, эндометрий, шейка, эластография, нозологии",
    accent: "from-rose-500 to-pink-400",
  },
  {
    href: "/tools/calc/rads/o-rads",
    title: "O-RADS · всё в одном месте",
    description: "Калькулятор, картинки, расчет по тексту, таблицы, IOTA 2026",
    accent: "from-violet-600 to-indigo-500",
  },
  {
    href: "/tools/calc",
    title: "Калькуляторы",
    description: "Отдельно: акушерские · гинекологические · RADS · приём",
    accent: "from-slate-600 to-slate-500",
  },
  {
    href: "/ai/consultants",
    title: "Помощник врача",
    description: "МКБ → УЗИ → протокол · гинеколог · акушер · FMF",
    accent: "from-emerald-600 to-teal-500",
  },
  {
    href: "/tools/refs/evidence-assistant",
    title: "Evidence AI",
    description: "PubMed · Cochrane · КР · AI с цитатами",
    accent: "from-amber-500 to-orange-400",
  },
] as const;

export const OBSTETRICS_HUB: DomainHubCard[] = [
  {
    href: "/ai/consultants/obstetrics",
    title: "Помощник акушера",
    description: "Ранняя Б, потери, ГСД, маршрутизация по МКБ",
    primary: true,
    badge: "AI",
  },
  {
    href: "/ai/consultants/fmf",
    title: "FMF · I скрининг",
    description: "Малый срок, CRL, NT, допплер, red flags",
    badge: "FMF",
  },
  {
    href: "/tools/calc/ob",
    title: "Калькуляторы беременности",
    description: "Срок Б, КТР, Bishop, VBAC, длина шейки, препараты",
    primary: true,
  },
  {
    href: "/tools/refs/fetal-anatomy-22-views",
    title: "22 проекции фетальной анатомии",
    description: "ISUOG · чеклист срезов I триместра",
  },
  {
    href: "/tools/refs/fetal-doppler-first-trimester",
    title: "Допплер I триместра",
    description: "DV, UtA PI, образовательный режим",
  },
  {
    href: "/tools/refs/fetal-spine",
    title: "Фетальный позвоночник",
    description: "Срезы и нормы",
  },
  {
    href: "/tools/refs/obstetric-atlas",
    title: "Акушерский атлас",
    description: "Срезы и протоколы",
  },
  {
    href: "/reports/obstetric",
    title: "SRE · акушерский протокол",
    description: "Структурированный отчёт с EBM-цитатами",
  },
];

export const GYNECOLOGY_HUB: DomainHubCard[] = [
  {
    href: "/ai/consultants/gynecology",
    title: "Помощник гинеколога",
    description: "Нозология → анализы → УЗИ → лечение",
    primary: true,
    badge: "AI",
  },
  {
    href: "/tools/calc/rads/o-rads",
    title: "O-RADS US",
    description: "Калькулятор, картинки, расчет по тексту, таблицы, IOTA",
    primary: true,
    badge: "O-RADS",
  },
  {
    href: "/tools/calc/gyn",
    title: "Калькуляторы гинекологии",
    description: "Эндометрий, POP-Q, кольпоскопия, CIN, эластография",
    primary: true,
  },
  {
    href: "/tools/mapping/uterus",
    title: "FIGO · матка 3D",
    description: "Миома, MUSA · аденомиоз",
  },
  {
    href: "/tools/mapping/endometriosis",
    title: "IDEA · глубокий эндометриоз",
    description: "ENZIAN mapping",
  },
  {
    href: "/tools/refs/cervix-pathology?tab=cytology",
    title: "Патология шейки",
    description: "8 глав + цитология, Bethesda, скрининг, кейсы",
  },
  {
    href: "/tools/refs/nosologies",
    title: "Нозологии",
    description: "Заболевания: обследование, УЗИ, лечение",
  },
  {
    href: "/reports/adnex",
    title: "SRE · протокол придатков",
    description: "O-RADS + live EBM citations",
  },
];

export const ORADS_HUB: DomainHubCard[] = [
  {
    href: "/tools/calc/rads/o-rads",
    title: "O-RADS Pro · калькулятор",
    description: "ACR O-RADS US v2022 + IOTA Simple Rules",
    primary: true,
    badge: "Calc",
  },
  {
    href: "/tools/refs/orads-echograms",
    title: "Эхограммы и случаи Озерской",
    description: "Учебные карточки по нозологиям — то, что вы искали",
    primary: true,
    badge: "Карточки",
  },
  {
    href: "/tools/refs/orads-guide",
    title: "Реферат O-RADS US",
    description: "Алгоритм ACR v2022 + 10 клинических случаев",
    badge: "v2022",
  },
  {
    href: "/tools/refs/iota-terms-2026",
    title: "IOTA 2026 · термины",
    description: "Консенсус IOTA Group: определения и самопроверка",
  },
  {
    href: "/tools/mapping/ovary",
    title: "IOTA triangulation · mapping",
    description: "Ввод находок в протокол",
  },
  {
    href: "/reports/adnex",
    title: "SRE · структурированный протокол",
    description: "Описание + заключение + EBM citations",
  },
];

export const CALCULATORS_HUB: DomainHubCard[] = [
  {
    href: "/tools/calc/ob",
    title: "Акушерство",
    description: "Срок Б, Bishop, VBAC, CL, фетометрия",
    primary: true,
  },
  {
    href: "/tools/calc/gyn",
    title: "Гинекология",
    description: "Эндометрий, POP-Q, кольпоскопия, CIN, эластография",
    primary: true,
  },
  {
    href: "/tools/calc/rads",
    title: "RADS",
    description: "O-RADS, BI-RADS, LN-RADS",
    primary: true,
  },
  {
    href: "/tools/calc/appointment",
    title: "Приём · быстрые расчёты",
    description: "Калькуляторы на одном экране приёма",
  },
  {
    href: "/tools/adjunct/ti-rads",
    title: "TI-RADS · щитовидная",
    description: "Adjunct-модуль ACR TI-RADS",
  },
];

export const ASSISTANT_HUB: DomainHubCard[] = [
  {
    href: "/ai/consultants/gynecology",
    title: "Помощник гинеколога",
    description: "МКБ → приём → УЗИ → протокол",
    primary: true,
  },
  {
    href: "/ai/consultants/obstetrics",
    title: "Помощник акушера",
    description: "Беременность, потери, ГСД",
    primary: true,
  },
  {
    href: "/ai/consultants/fmf",
    title: "FMF · скрининг",
    description: "I/II/III триместр, допплер",
  },
  {
    href: "/tools/refs/evidence-assistant",
    title: "Evidence AI",
    description: "PubMed · Cochrane · КР · закладки",
    primary: true,
    badge: "EBM",
  },
  {
    href: "/ai/workspace",
    title: "AI-зона · снимки",
    description: "Copilot + CDS-preview по DICOM",
  },
];
