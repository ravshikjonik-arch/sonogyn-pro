/**
 * SSOT product modules — navigation, surfaces, clinical domain.
 * Calculator titles/subtitles stay in registry.ts and appointment-calculators/catalog.ts (ref only).
 */

export type ModuleDomain =
  | "obstetrics"
  | "gynecology"
  | "rads"
  | "library"
  | "ai-assistant"
  | "doctors-chat"
  | "education"
  | "pro"
  | "infra";

export type ModuleKind =
  | "hub"
  | "route"
  | "calculator"
  | "calculator-appointment"
  | "mockup"
  | "education"
  | "reference"
  | "report"
  | "community"
  | "external";

export type ModuleSubkind = "mockup";

export type ModuleCatalogRef =
  | { catalog: "registry"; slug: string }
  | { catalog: "appointment"; id: string };

export type ModuleSidebarGroup = "community" | "appointment" | "knowledge" | "more" | "mockups";

export type EducationShelf = "courses" | "assistant" | "reference" | "atlases" | "calculators";

export type ModuleSurfaces = {
  homeTile?: boolean;
  sidebar?: boolean;
  sidebarGroup?: ModuleSidebarGroup;
  educationShelf?: EducationShelf;
  clinicalSearch?: boolean;
  appointmentHub?: boolean;
};

export type ModuleId =
  | "community.chat"
  | "community.new-case"
  | "community.telegram"
  | "workspace.home"
  | "workspace.ai"
  | "admin.patients"
  | "admin.dashboard"
  | "account.profile"
  | "billing.paywall"
  | "assistant.hub"
  | "assistant.fmf"
  | "calculator.ob-hub"
  | "calculator.appointment.ga-lmp"
  | "calculator.appointment.ga-us"
  | "calculator.appointment.ga-ivf"
  | "calculator.appointment.ga-movement"
  | "calculator.appointment.ga-antenatal"
  | "calculator.appointment.maternity-leave"
  | "calculator.appointment.ga-edd"
  | "calculator.appointment.ga-crl"
  | "calculator.appointment.ga-feto"
  | "calculator.fetal-weight"
  | "calculator.bishop"
  | "calculator.vbac"
  | "calculator.pregnancy-meds"
  | "calculator.cervical-length"
  | "calculator.o-rads"
  | "calculator.bi-rads"
  | "calculator.ti-rads"
  | "calculator.ln-rads"
  | "calculator.figo"
  | "report.adnex-orads"
  | "calculator.endometrium"
  | "calculator.pop-q"
  | "calculator.colposcopy"
  | "calculator.elastography"
  | "calculator.risk-breast"
  | "calculator.risk-cervical"
  | "calculator.risk-cin"
  | "calculator.risk-ovarian"
  | "clinical.idea-endometriosis"
  | "mockup.hub"
  | "mockup.uterus"
  | "mockup.ovary"
  | "mockup.breast"
  | "calculator.hub"
  | "education.library-hub"
  | "reference.guidelines"
  | "reference.clinical-norms"
  | "reference.evidence"
  | "reference.nosologies"
  | "reference.medvedev"
  | "education.isuog-basic"
  | "education.orads-guide"
  | "education.orads-echograms"
  | "education.iota-terms-2026"
  | "education.cervix-pathology"
  | "education.fetal-anatomy-22"
  | "education.fetal-doppler-1t"
  | "education.obstetric-atlas"
  | "education.fetal-spine"
  | "education.orads-flow"
  | "education.calculators-shelf";

export type ModuleEntry = {
  id: ModuleId;
  domain: ModuleDomain;
  kind: ModuleKind;
  subkind?: ModuleSubkind;
  title: string;
  description?: string;
  /** In-app route (relative path). */
  href?: string;
  /** Off-site link (e.g. Telegram channel). */
  externalHref?: string;
  ref?: ModuleCatalogRef;
  surfaces?: ModuleSurfaces;
  /** Legacy source ids for migration / audit. */
  legacy?: {
    clinicalTools?: string[];
    education?: string;
    mockupId?: "uterus" | "breast" | "ovary";
  };
};

/** Canonical product modules (63 entries). */
export const MODULES: ModuleEntry[] = [
  // —— doctors-chat ——
  {
    id: "community.chat",
    domain: "doctors-chat",
    kind: "community",
    title: "Чат врачей",
    description: "Общий чат + гинекология + акушерство. Фото/видео в сообщениях и кейсы.",
    href: "/cases",
    surfaces: { homeTile: true, sidebar: true, sidebarGroup: "community", clinicalSearch: true },
    legacy: { clinicalTools: ["chat"] },
  },
  {
    id: "community.new-case",
    domain: "doctors-chat",
    kind: "community",
    title: "Новый кейс УЗИ",
    description: "Снимок в галерею кейса для разбора",
    href: "/cases/new",
    surfaces: { clinicalSearch: true },
    legacy: { clinicalTools: ["new-case"] },
  },
  {
    id: "community.telegram",
    domain: "doctors-chat",
    kind: "external",
    title: "Telegram сообщество",
    description: "@UltraGynAnalytics",
    externalHref: "https://t.me/UltraGynAnalytics",
    surfaces: { clinicalSearch: true },
    legacy: { clinicalTools: ["telegram"] },
  },

  // —— infra / pro ——
  {
    id: "workspace.home",
    domain: "infra",
    kind: "route",
    title: "Рабочий стол",
    href: "/app",
    surfaces: { sidebar: true, sidebarGroup: "community" },
  },
  {
    id: "workspace.ai",
    domain: "ai-assistant",
    kind: "route",
    title: "AI-рабочая зона",
    description: "Загрузка снимков, orchestrator, CDS-preview — ассистивно.",
    href: "/workspace",
    surfaces: { homeTile: true, sidebar: true, sidebarGroup: "more" },
  },
  {
    id: "admin.patients",
    domain: "infra",
    kind: "route",
    title: "Пациенты",
    href: "/patients",
    surfaces: { sidebar: true, sidebarGroup: "more" },
  },
  {
    id: "admin.dashboard",
    domain: "infra",
    kind: "route",
    title: "Дашборд",
    href: "/dashboard",
    surfaces: { sidebar: true, sidebarGroup: "more" },
  },
  {
    id: "account.profile",
    domain: "infra",
    kind: "route",
    title: "Профиль",
    href: "/profile",
    surfaces: { sidebar: true, sidebarGroup: "more" },
  },
  {
    id: "billing.paywall",
    domain: "pro",
    kind: "route",
    title: "PRO",
    href: "/paywall",
    surfaces: { sidebar: true, sidebarGroup: "more" },
  },

  // —— ai-assistant ——
  {
    id: "assistant.hub",
    domain: "ai-assistant",
    kind: "route",
    title: "Помощник врача",
    description: "Нозология → анализы → УЗИ → лечение → протокол. Поиск и голос.",
    href: "/assistant",
    surfaces: {
      homeTile: true,
      sidebar: true,
      sidebarGroup: "appointment",
      educationShelf: "assistant",
      clinicalSearch: true,
    },
    legacy: { clinicalTools: ["assistant-gyn", "assistant-obs"], education: "assistant" },
  },
  {
    id: "assistant.fmf",
    domain: "obstetrics",
    kind: "calculator",
    title: "FMF · скрининги",
    description: "I–III скрининг, допплер, шейка — перцентили Медведева, протокол одним кликом.",
    href: "/assistant/fmf",
    ref: { catalog: "registry", slug: "fmf" },
    surfaces: { educationShelf: "assistant", clinicalSearch: true },
    legacy: { clinicalTools: ["fmf"], education: "fmf" },
  },

  // —— obstetrics calculators ——
  {
    id: "calculator.ob-hub",
    domain: "obstetrics",
    kind: "calculator",
    title: "Калькулятор расчёта срока беременности",
    description: "ПМП, УЗИ, КТР, ЭКО, фетометрия, декрет — отдельный модуль.",
    href: "/calculators/ob",
    ref: { catalog: "registry", slug: "ob-calc" },
    surfaces: { homeTile: true, sidebar: true, sidebarGroup: "appointment", clinicalSearch: true },
    legacy: { clinicalTools: ["ob-calc"] },
  },
  {
    id: "calculator.appointment.ga-lmp",
    domain: "obstetrics",
    kind: "calculator-appointment",
    title: "Срок беременности по менструации",
    href: "/calculators/ob?tab=lmp",
    ref: { catalog: "appointment", id: "ga-lmp" },
    surfaces: { clinicalSearch: true, appointmentHub: true },
    legacy: { clinicalTools: ["ga-lmp"] },
  },
  {
    id: "calculator.appointment.ga-us",
    domain: "obstetrics",
    kind: "calculator-appointment",
    title: "Срок беременности по УЗИ",
    href: "/calculators/ob?tab=us",
    ref: { catalog: "appointment", id: "ga-us" },
    surfaces: { clinicalSearch: true, appointmentHub: true },
    legacy: { clinicalTools: ["ga-us"] },
  },
  {
    id: "calculator.appointment.ga-ivf",
    domain: "obstetrics",
    kind: "calculator-appointment",
    title: "Срок по овуляции/ЭКО",
    href: "/calculators/ob?tab=ivf",
    ref: { catalog: "appointment", id: "ga-ivf" },
    surfaces: { clinicalSearch: true, appointmentHub: true },
    legacy: { clinicalTools: ["ga-ivf"] },
  },
  {
    id: "calculator.appointment.ga-movement",
    domain: "obstetrics",
    kind: "calculator-appointment",
    title: "Срок по шевелениям плода",
    href: "/calculators/ob?tab=movement",
    ref: { catalog: "appointment", id: "ga-movement" },
    surfaces: { appointmentHub: true },
  },
  {
    id: "calculator.appointment.ga-antenatal",
    domain: "obstetrics",
    kind: "calculator-appointment",
    title: "Срок по явке в ЖК",
    href: "/calculators/ob?tab=antenatal",
    ref: { catalog: "appointment", id: "ga-antenatal" },
    surfaces: { appointmentHub: true },
  },
  {
    id: "calculator.appointment.maternity-leave",
    domain: "obstetrics",
    kind: "calculator-appointment",
    title: "Сроки декретного отпуска",
    href: "/calculators/ob?tab=dekret",
    ref: { catalog: "appointment", id: "maternity-leave" },
    surfaces: { appointmentHub: true },
  },
  {
    id: "calculator.appointment.ga-edd",
    domain: "obstetrics",
    kind: "calculator-appointment",
    title: "Срок по ПДР",
    href: "/calculators/ob?tab=edd",
    ref: { catalog: "appointment", id: "ga-edd" },
    surfaces: { appointmentHub: true },
  },
  {
    id: "calculator.appointment.ga-crl",
    domain: "obstetrics",
    kind: "calculator-appointment",
    title: "Срок по КТР",
    href: "/calculators/ob?tab=crl",
    ref: { catalog: "appointment", id: "ga-crl" },
    surfaces: { clinicalSearch: true, appointmentHub: true },
    legacy: { clinicalTools: ["ga-crl"] },
  },
  {
    id: "calculator.appointment.ga-feto",
    domain: "obstetrics",
    kind: "calculator-appointment",
    title: "Срок по фетометрии",
    href: "/calculators/ob?tab=feto",
    ref: { catalog: "appointment", id: "ga-feto" },
    surfaces: { clinicalSearch: true, appointmentHub: true },
    legacy: { clinicalTools: ["ga-feto"] },
  },
  {
    id: "calculator.fetal-weight",
    domain: "obstetrics",
    kind: "calculator",
    title: "Масса плода",
    description: "Hadlock, Рудаков, антропометрия матери",
    href: "/calculators/fetal-weight",
    ref: { catalog: "registry", slug: "fetal-weight" },
    surfaces: { appointmentHub: true },
  },
  {
    id: "calculator.bishop",
    domain: "obstetrics",
    kind: "calculator",
    title: "Шкала Бишопа",
    href: "/calculators/bishop",
    ref: { catalog: "registry", slug: "bishop" },
    surfaces: { appointmentHub: true },
  },
  {
    id: "calculator.vbac",
    domain: "obstetrics",
    kind: "calculator",
    title: "VBAC / TOLAC",
    href: "/calculators/vbac",
    ref: { catalog: "registry", slug: "vbac" },
    surfaces: { appointmentHub: true },
  },
  {
    id: "calculator.pregnancy-meds",
    domain: "obstetrics",
    kind: "calculator",
    title: "Лекарства при беременности",
    href: "/calculators/pregnancy-medications",
    ref: { catalog: "registry", slug: "pregnancy-medications" },
    surfaces: { appointmentHub: true },
  },
  {
    id: "calculator.cervical-length",
    domain: "obstetrics",
    kind: "calculator",
    title: "Длина шейки матки (CL)",
    description: "Скрининг 16–24 нед, воронка, sludge — риск преждевременных родов",
    href: "/calculators/cervical-length",
    ref: { catalog: "registry", slug: "cervical-length" },
    surfaces: { clinicalSearch: true },
    legacy: { clinicalTools: ["cervical-length"] },
  },

  // —— rads ——
  {
    id: "calculator.o-rads",
    domain: "rads",
    kind: "calculator",
    title: "O-RADS Pro",
    href: "/calculators/o-rads",
    ref: { catalog: "registry", slug: "o-rads" },
    surfaces: { sidebar: true, sidebarGroup: "appointment", clinicalSearch: true },
    legacy: { clinicalTools: ["orads-wizard", "orads"] },
  },
  {
    id: "calculator.bi-rads",
    domain: "rads",
    kind: "calculator",
    title: "BI-RADS US Pro",
    href: "/calculators/bi-rads",
    ref: { catalog: "registry", slug: "bi-rads" },
    surfaces: { clinicalSearch: true },
    legacy: { clinicalTools: ["birads"] },
  },
  {
    id: "calculator.ti-rads",
    domain: "rads",
    kind: "calculator",
    title: "TI-RADS ЩЖ",
    href: "/calculators/ti-rads",
    ref: { catalog: "registry", slug: "ti-rads" },
    surfaces: { clinicalSearch: true },
    legacy: { clinicalTools: ["tirads"] },
  },
  {
    id: "calculator.ln-rads",
    domain: "rads",
    kind: "calculator",
    title: "LN-RADS US Pro",
    href: "/calculators/ln-rads",
    ref: { catalog: "registry", slug: "ln-rads" },
    surfaces: { clinicalSearch: true },
    legacy: { clinicalTools: ["ln-rads"] },
  },
  {
    id: "calculator.figo",
    domain: "rads",
    kind: "calculator",
    title: "FIGO fibroid typing",
    href: "/uterus-3d",
    ref: { catalog: "registry", slug: "figo" },
    surfaces: { clinicalSearch: true },
    legacy: { clinicalTools: ["uterus-clinic"] },
  },
  {
    id: "report.adnex-orads",
    domain: "rads",
    kind: "report",
    title: "Протокол O-RADS",
    href: "/reports/adnex",
    surfaces: { sidebar: true, sidebarGroup: "appointment" },
  },

  // —— gynecology calculators ——
  {
    id: "calculator.endometrium",
    domain: "gynecology",
    kind: "calculator",
    title: "Эндометрий · ISUOG / КР РФ",
    href: "/calculators/endometrium",
    ref: { catalog: "registry", slug: "endometrium" },
    surfaces: { clinicalSearch: true },
    legacy: { clinicalTools: ["endometrium"] },
  },
  {
    id: "calculator.pop-q",
    domain: "gynecology",
    kind: "calculator",
    title: "POP-Q · русская версия",
    href: "/calculators/pop-q",
    ref: { catalog: "registry", slug: "pop-q" },
    surfaces: { clinicalSearch: true },
    legacy: { clinicalTools: ["popq"] },
  },
  {
    id: "calculator.colposcopy",
    domain: "gynecology",
    kind: "calculator",
    title: "Кольпоскопия · Swede Score",
    href: "/calculators/colposcopy",
    ref: { catalog: "registry", slug: "colposcopy" },
    surfaces: { clinicalSearch: true },
    legacy: { clinicalTools: ["colposcopy"] },
  },
  {
    id: "calculator.elastography",
    domain: "gynecology",
    kind: "calculator",
    title: "Эластография",
    href: "/calculators/elastography",
    ref: { catalog: "registry", slug: "elastography" },
    surfaces: { clinicalSearch: true },
    legacy: { clinicalTools: ["elastography"] },
  },
  {
    id: "calculator.risk-breast",
    domain: "gynecology",
    kind: "calculator-appointment",
    title: "Риск рака молочной железы",
    href: "/calculators/breast-risk",
    ref: { catalog: "appointment", id: "breast-risk" },
    surfaces: { appointmentHub: true },
  },
  {
    id: "calculator.risk-cervical",
    domain: "gynecology",
    kind: "calculator-appointment",
    title: "Риск рака шейки матки",
    href: "/calculators/cervical-cancer-risk",
    ref: { catalog: "appointment", id: "cervical-risk" },
    surfaces: { appointmentHub: true },
  },
  {
    id: "calculator.risk-cin",
    domain: "gynecology",
    kind: "calculator-appointment",
    title: "Наблюдение после CIN",
    href: "/calculators/cin-follow-up",
    ref: { catalog: "appointment", id: "cin-follow-up" },
    surfaces: { appointmentHub: true },
  },
  {
    id: "calculator.risk-ovarian",
    domain: "gynecology",
    kind: "calculator-appointment",
    title: "Риск рака яичников",
    href: "/calculators/ovarian-cancer-risk",
    ref: { catalog: "appointment", id: "ovarian-risk" },
    surfaces: { appointmentHub: true },
  },
  {
    id: "clinical.idea-endometriosis",
    domain: "gynecology",
    kind: "route",
    title: "IDEA · эндометриоз",
    href: "/idea-deep-endometriosis",
    surfaces: { sidebar: true, sidebarGroup: "more" },
  },

  // —— mockups ——
  {
    id: "mockup.hub",
    domain: "infra",
    kind: "hub",
    subkind: "mockup",
    title: "Макеты УЗИ",
    description: "Матка, яичник, МЖ — выбор макета и порядка в меню.",
    href: "/mockups",
    surfaces: { homeTile: true, sidebar: true, sidebarGroup: "mockups" },
  },
  {
    id: "mockup.uterus",
    domain: "gynecology",
    kind: "mockup",
    subkind: "mockup",
    title: "Макет матки · FIGO",
    description: "Коронарный разрез или сагиттальный срез — локализация и FIGO в протокол.",
    href: "/uterus-3d",
    surfaces: { homeTile: true, sidebar: true, sidebarGroup: "mockups", educationShelf: "atlases" },
    legacy: { clinicalTools: ["uterus-clinic"], education: "uterus-3d", mockupId: "uterus" },
  },
  {
    id: "mockup.ovary",
    domain: "rads",
    kind: "mockup",
    subkind: "mockup",
    title: "Макет яичника · O-RADS",
    description: "Увеличенный яичник: фолликулы, кисты, ИИ по фото/видео, текст в протокол.",
    href: "/ovary-atlas",
    surfaces: { homeTile: true, sidebar: true, sidebarGroup: "mockups", educationShelf: "atlases" },
    legacy: { education: "ovary-atlas", mockupId: "ovary" },
  },
  {
    id: "mockup.breast",
    domain: "rads",
    kind: "mockup",
    subkind: "mockup",
    title: "Макет молочной железы",
    description: "Схема обеих МЖ: часы, см от соска, квадрант — текст в протокол.",
    href: "/breast-3d",
    surfaces: { homeTile: true, sidebar: true, sidebarGroup: "mockups" },
    legacy: { clinicalTools: ["breast-3d"], mockupId: "breast" },
  },

  // —— infra hubs ——
  {
    id: "calculator.hub",
    domain: "infra",
    kind: "hub",
    title: "Калькуляторы",
    description: "O-RADS, BI-RADS, TI-RADS, FIGO, FMF, эластография — по гайдлайнам и КР.",
    href: "/calculators",
    surfaces: { homeTile: true, sidebar: true, sidebarGroup: "appointment", educationShelf: "calculators" },
  },

  // —— library ——
  {
    id: "education.library-hub",
    domain: "library",
    kind: "hub",
    title: "Библиотека",
    description: "Протоколы, чеклисты, атласы — образовательный слой.",
    href: "/library",
    surfaces: { homeTile: true, sidebar: true, sidebarGroup: "knowledge" },
  },
  {
    id: "reference.guidelines",
    domain: "library",
    kind: "reference",
    title: "КР и приказы",
    description: "КР МЗ РФ, приказы ДЗМ — отдельные полки с быстрым поиском.",
    href: "/guidelines",
    surfaces: { homeTile: true, sidebar: true, sidebarGroup: "knowledge", clinicalSearch: true },
    legacy: { clinicalTools: ["guidelines"], education: "guidelines" },
  },
  {
    id: "reference.clinical-norms",
    domain: "library",
    kind: "reference",
    title: "Клинические нормы УЗИ",
    href: "/reference",
    surfaces: { sidebar: true, sidebarGroup: "knowledge", clinicalSearch: true },
    legacy: { clinicalTools: ["clinical-ref"], education: "reference" },
  },
  {
    id: "reference.evidence",
    domain: "library",
    kind: "reference",
    title: "УЗИ · доказательная база",
    href: "/evidence",
    surfaces: { sidebar: true, sidebarGroup: "knowledge" },
    legacy: { education: "evidence-us-fmf" },
  },
  {
    id: "reference.nosologies",
    domain: "library",
    kind: "reference",
    title: "Нозологии",
    href: "/nosologies",
    surfaces: { sidebar: true, sidebarGroup: "appointment", clinicalSearch: true },
    legacy: { clinicalTools: ["nosology"], education: "nosologies" },
  },
  {
    id: "reference.medvedev",
    domain: "library",
    kind: "reference",
    title: "Консенсусы УЗИ",
    description: "MUSA · IETA · IOTA · IDEA",
    surfaces: { clinicalSearch: true },
    legacy: { clinicalTools: ["medvedev"] },
  },

  // —— education ——
  {
    id: "education.isuog-basic",
    domain: "education",
    kind: "education",
    title: "ISUOG — базовый курс",
    href: "/library/basic-course",
    surfaces: { homeTile: true, educationShelf: "courses" },
    legacy: { education: "isuog-basic" },
  },
  {
    id: "education.orads-guide",
    domain: "education",
    kind: "education",
    title: "O-RADS US · руководство",
    href: "/library/orads-guide",
    surfaces: { educationShelf: "courses", clinicalSearch: true },
    legacy: { clinicalTools: ["orads-guide"], education: "orads-guide" },
  },
  {
    id: "education.orads-echograms",
    domain: "education",
    kind: "education",
    title: "O-RADS · эхограммы и случаи",
    href: "/library/orads-echograms",
    surfaces: { educationShelf: "courses" },
    legacy: { education: "orads-echograms" },
  },
  {
    id: "education.iota-terms-2026",
    domain: "education",
    kind: "education",
    title: "IOTA 2026 · термины и определения",
    href: "/library/iota-terms-2026",
    surfaces: { educationShelf: "reference" },
    legacy: { education: "iota-terms-2026" },
  },
  {
    id: "education.cervix-pathology",
    domain: "education",
    kind: "education",
    title: "Патология шейки · справочник",
    href: "/library/cervix-pathology",
    surfaces: { educationShelf: "reference" },
    legacy: { education: "cervix-pathology-quiz" },
  },
  {
    id: "education.fetal-anatomy-22",
    domain: "education",
    kind: "education",
    title: "22 среза · 65 ВПР (II триместр)",
    href: "/library/fetal-anatomy-22-views",
    surfaces: { educationShelf: "courses" },
    legacy: { education: "fetal-anatomy-22-views" },
  },
  {
    id: "education.fetal-doppler-1t",
    domain: "education",
    kind: "education",
    title: "Допплер I триместра (11–14 нед)",
    href: "/library/fetal-doppler-first-trimester",
    surfaces: { educationShelf: "courses" },
    legacy: { education: "fetal-doppler-first-trimester" },
  },
  {
    id: "education.obstetric-atlas",
    domain: "education",
    kind: "education",
    title: "Атлас I триместра (Блинов)",
    href: "/library/obstetric-atlas",
    surfaces: { educationShelf: "atlases" },
    legacy: { education: "obstetric-atlas" },
  },
  {
    id: "education.fetal-spine",
    domain: "education",
    kind: "education",
    title: "УЗИ позвоночника плода",
    href: "/library/fetal-spine",
    surfaces: { educationShelf: "atlases" },
    legacy: { education: "fetal-spine-atlas" },
  },
  {
    id: "education.orads-flow",
    domain: "education",
    kind: "education",
    title: "O-RADS Library",
    description: "Дерево решений (mobile)",
    surfaces: { clinicalSearch: true },
    legacy: { clinicalTools: ["orads-flow"] },
  },
  {
    id: "education.calculators-shelf",
    domain: "education",
    kind: "education",
    title: "Калькуляторы RADS",
    description: "Полка в библиотеке — ссылка на hub калькуляторов",
    href: "/calculators",
    surfaces: { educationShelf: "calculators" },
    legacy: { education: "calculators" },
  },
];

export const MODULE_COUNT = MODULES.length;

export const MODULES_BY_DOMAIN: Record<ModuleDomain, ModuleEntry[]> = MODULES.reduce(
  (acc, mod) => {
    acc[mod.domain].push(mod);
    return acc;
  },
  {
    obstetrics: [],
    gynecology: [],
    rads: [],
    library: [],
    "ai-assistant": [],
    "doctors-chat": [],
    education: [],
    pro: [],
    infra: [],
  } as Record<ModuleDomain, ModuleEntry[]>,
);

export function getModuleById(id: ModuleId): ModuleEntry | undefined {
  return MODULES.find((m) => m.id === id);
}

export function getModulesByDomain(domain: ModuleDomain): ModuleEntry[] {
  return MODULES_BY_DOMAIN[domain];
}

export function getModulesWithSurface(surface: keyof ModuleSurfaces): ModuleEntry[] {
  return MODULES.filter((m) => Boolean(m.surfaces?.[surface]));
}
