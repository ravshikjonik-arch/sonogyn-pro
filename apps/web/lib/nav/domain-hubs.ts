/** Domain hub cards — single source for /tools, sidebar, and domain landing pages. */

import { isCopyrightLockedHref } from "@/lib/copyright/book-content-gate";

export type DomainHubCard = {
  href: string;
  title: string;
  description: string;
  badge?: string;
  primary?: boolean;
};

export type DomainHubGroup = {
  title: string;
  cards: DomainHubCard[];
};

export const TOOLS_HOME_DOMAINS = [
  {
    href: "/tools/obstetrics",
    title: "Акушерство",
    description: "Беременность, FMF, фетометрия, допплер, калькуляторы",
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
    href: "/ai/consultants/us-prep",
    title: "Live приём · УЗИ",
    description: "Голосовой брифинг: жалобы → чеклист под роль врача",
    accent: "from-emerald-600 to-teal-500",
  },
  {
    href: "/ai/consultants",
    title: "Исслед. AI · помощник врача",
    description: "МКБ → УЗИ → протокол · гинеколог · акушер · FMF",
    accent: "from-teal-600 to-cyan-500",
  },
  {
    href: "/tools/refs/evidence-sources",
    title: "Доказательства и источники",
    description: "КР · PubMed · ГРЛС · Новое · ссылки вовне",
    accent: "from-amber-500 to-orange-400",
  },
] as const;

export const OBSTETRICS_GROUPS: DomainHubGroup[] = [
  {
    title: "Приём",
    cards: [
      {
        href: "/tools/refs/ambulatory-intake",
        title: "ЧЕК-ЛИСТ АМБУЛАТОРИИ",
        description: "Быстрый чек-лист приёма АГ · нормы · итог",
        primary: true,
      },
      {
        href: "/ai/consultants/us-prep",
        title: "Live приём · голосовой брифинг",
        description: "Жалобы → чеклист УЗИ под роль врача",
        primary: true,
        badge: "Live",
      },
      {
        href: "/ai/consultants/obstetrics",
        title: "Помощник акушера",
        description: "Ранняя беременность, потери, ГСД",
        badge: "AI",
      },
      {
        href: "/ai/consultants/fmf",
        title: "FMF · I скрининг",
        description: "Малый срок, КТР, ТВП, допплер",
        badge: "FMF",
      },
      {
        href: "/ai/consultants/fmf/guided",
        title: "Протокол по сроку",
        description: "Guided: смотреть → измерить → не пропустить",
        badge: "Guided",
      },
    ],
  },
  {
    title: "Расчёты",
    cards: [
      {
        href: "/tools/calc/ob",
        title: "Акушерский калькулятор",
        description: "Срок, КТР, Bishop, VBAC, длина шейки, гинекологические риски",
        primary: true,
      },
      {
        href: "/tools/calc/ob/fetometry",
        title: "Расчёт плода",
        description: "Биометрия, калиперы, нормы I–III триместра",
        badge: "Таблицы",
      },
    ],
  },
  {
    title: "Срезы",
    cards: [
      {
        href: "/tools/refs/fetal-anatomy-22-views",
        title: "22 проекции фетальной анатомии",
        description: "Чеклист срезов I триместра",
      },
      {
        href: "/tools/refs/fetal-doppler-first-trimester",
        title: "Допплер I триместра",
        description: "Венозный проток, маточные артерии",
      },
      {
        href: "/tools/refs/fetal-spine",
        title: "Фетальный позвоночник",
        description: "Срезы и нормы",
      },
    ],
  },
  {
    title: "Источники",
    cards: [
      {
        href: "/tools/refs/sources",
        title: "Официальные гайдлайны",
        description: "ACR · FIGO · ISUOG · КР (без книжных атласов)",
      },
      {
        href: "/tools/refs/guidelines",
        title: "КР и приказы",
        description: "Клинические рекомендации в кабинете",
      },
      {
        href: "/tools/refs/evidence-sources",
        title: "Доказательства и источники",
        description: "КР · Evidence · ГРЛС · Новое — одна крыша",
        primary: true,
      },
    ],
  },
  {
    title: "Протокол",
    cards: [
      {
        href: "/reports/obstetric",
        title: "Акушерский протокол",
        description: "Структурированный отчёт",
      },
    ],
  },
];

export const OBSTETRICS_HUB: DomainHubCard[] = OBSTETRICS_GROUPS.flatMap((group) => group.cards).filter(
  (card) => !isCopyrightLockedHref(card.href),
);

export const GYNECOLOGY_GROUPS: DomainHubGroup[] = [
  {
    title: "Приём",
    cards: [
      {
        href: "/tools/refs/ambulatory-intake",
        title: "ЧЕК-ЛИСТ АМБУЛАТОРИИ",
        description: "Быстрый чек-лист приёма АГ · нормы · итог",
        primary: true,
      },
      {
        href: "/ai/consultants/us-prep",
        title: "Live приём · голосовой брифинг",
        description: "Жалобы → чеклист УЗИ под роль врача",
        primary: true,
        badge: "Live",
      },
      {
        href: "/ai/consultants/gynecology",
        title: "Помощник гинеколога",
        description: "Нозология, анализы, УЗИ",
        badge: "AI",
      },
    ],
  },
  {
    title: "Придатки и матка",
    cards: [
      {
        href: "/tools/calc/rads/o-rads",
        title: "O-RADS",
        description: "Образования придатков",
        primary: true,
        badge: "O-RADS",
      },
      {
        href: "/tools/calc/gyn",
        title: "Калькуляторы",
        description: "Эндометрий, POP-Q, шейка, эластография",
        primary: true,
      },
      {
        href: "/tools/mapping/uterus",
        title: "FIGO · миома",
        description: "Тип узла и аденомиоз",
      },
      {
        href: "/tools/mapping/endometriosis",
        title: "Глубокий эндометриоз",
        description: "Карта IDEA",
      },
    ],
  },
  {
    title: "Шейка матки",
    cards: [
      {
        href: "/tools/refs/cervix-pathology?tab=cytology",
        title: "Патология шейки",
        description: "Цитология, Bethesda, скрининг",
      },
    ],
  },
  {
    title: "Источники",
    cards: [
      {
        href: "/tools/refs/sources",
        title: "Официальные гайдлайны",
        description: "ACR · FIGO · ISUOG · КР",
      },
    ],
  },
  {
    title: "Нозологии",
    cards: [
      {
        href: "/tools/refs/nosologies",
        title: "Нозологии",
        description: "Обследование, УЗИ, лечение",
      },
      {
        href: "/reports/adnex",
        title: "Протокол придатков",
        description: "Описание и заключение",
      },
    ],
  },
];

export const GYNECOLOGY_HUB: DomainHubCard[] = GYNECOLOGY_GROUPS.flatMap((group) => group.cards).filter(
  (card) => !isCopyrightLockedHref(card.href),
);

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
    title: "Учебные эхограммы и случаи придатков",
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
    description: "O-RADS, BI-RADS, TI-RADS, LN-RADS",
    primary: true,
  },
  {
    href: "/tools/calc/rads/bi-rads",
    title: "BI-RADS · молочная железа",
    description: "Стратификация ACR (калькулятор)",
    primary: true,
  },
  {
    href: "/tools/calc/rads/ti-rads",
    title: "TI-RADS · щитовидная",
    description: "ACR Score · Анализ → Доклад → Store",
    primary: true,
  },
  {
    href: "/tools/calc/appointment",
    title: "Приём · быстрые расчёты",
    description: "Калькуляторы на одном экране приёма",
  },
  {
    href: "/tools/refs/ambulatory-intake",
    title: "ЧЕК-ЛИСТ АМБУЛАТОРИИ",
    description: "Быстрый чек-лист приёма АГ · нормы · итог",
    primary: true,
  },
];

export const ASSISTANT_HUB: DomainHubCard[] = [
  {
    href: "/ai/consultants/us-prep",
    title: "Live приём · голосовой брифинг",
    description: "Микрофон → жалобы → чеклист под роль врача",
    badge: "Live",
    primary: true,
  },
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
    href: "/tools/refs/evidence-sources",
    title: "Доказательства и источники",
    description: "КР · PubMed · ГРЛС · Новое",
    primary: true,
    badge: "EBM",
  },
  {
    href: "/ai/workspace",
    title: "AI-зона · снимки",
    description: "Copilot + CDS-preview по DICOM",
  },
];
