import type { MobileToolAction } from "./types";

/**
 * One classification / nosology = one room.
 * Search and home tiles should point at `href` (the room), not at every child.
 */
export type ClinicalRoomChildKind =
  | "calculator"
  | "reference"
  | "mapping"
  | "protocol"
  | "education";

export type ClinicalRoomChild = {
  id: string;
  title: string;
  description: string;
  href: string;
  kind: ClinicalRoomChildKind;
  primary?: boolean;
  badge?: string;
  mobileAction?: MobileToolAction;
};

export type ClinicalRoom = {
  id: string;
  /** Canonical product name, e.g. "O-RADS US" */
  title: string;
  description: string;
  /** Landing page for the room */
  href: string;
  /** Fast path for physicians who already know the tool */
  primaryHref: string;
  domain: "rads" | "gynecology" | "obstetrics" | "breast" | "thyroid";
  children: ClinicalRoomChild[];
  /** Single CLINICAL_TOOLS id that represents this room in search */
  catalogPrimaryId: string;
};

/** ACR O-RADS US v2022 — adnexal mass room (pilot). */
export const ORADS_US_ROOM: ClinicalRoom = {
  id: "orads-us",
  title: "O-RADS US",
  description:
    "Одна комната: калькулятор ACR v2022, IOTA, эхограммы, реферат и протокол. Без подстановки категории.",
  href: "/tools/o-rads",
  primaryHref: "/tools/calc/rads/o-rads",
  domain: "rads",
  catalogPrimaryId: "orads-hub",
  children: [
    {
      id: "calc",
      title: "Калькулятор O-RADS US",
      description: "ACR O-RADS US v2022 · IOTA Simple Rules",
      href: "/tools/calc/rads/o-rads",
      kind: "calculator",
      primary: true,
      badge: "Приём",
      mobileAction: "orads",
    },
    {
      id: "iota",
      title: "IOTA · ADNEX / LR2",
      description: "Модели риска IOTA рядом с O-RADS",
      href: "/tools/calc/rads/iota",
      kind: "calculator",
      badge: "IOTA",
      mobileAction: "iota",
    },
    {
      id: "echograms",
      title: "Эхограммы и случаи",
      description: "Учебные карточки придатков по нозологиям",
      href: "/tools/refs/orads-echograms",
      kind: "education",
      badge: "Учёба",
      mobileAction: "orads_echograms",
    },
    {
      id: "guide",
      title: "Реферат O-RADS US",
      description: "Алгоритм ACR v2022 и клинические случаи",
      href: "/tools/refs/orads-guide",
      kind: "reference",
      mobileAction: "orads_guide",
    },
    {
      id: "iota-terms",
      title: "IOTA 2026 · термины",
      description: "Определения консенсуса IOTA Group",
      href: "/tools/refs/iota-terms-2026",
      kind: "reference",
    },
    {
      id: "mapping",
      title: "Mapping яичника",
      description: "Ввод находок в протокол",
      href: "/tools/mapping/ovary",
      kind: "mapping",
    },
    {
      id: "sre",
      title: "Структурированный протокол",
      description: "Описание · заключение · EBM citations",
      href: "/tools/calc/rads/adnex-report",
      kind: "protocol",
    },
  ],
};

/** FMF · скрининг 11–13, assessment, учебный риск, консультант. */
export const FMF_ROOM: ClinicalRoom = {
  id: "fmf",
  title: "FMF · скрининг",
  description:
    "Комната: техника 11–13 нед, калькуляторы fmf-core (этапы 1–3), консультант I–III. Лицензированный risk engine FMF — не копируем.",
  href: "/tools/fmf",
  primaryHref: "/tools/refs/fmf-11-13",
  domain: "obstetrics",
  catalogPrimaryId: "fmf-hub",
  children: [
    {
      id: "refs-11-13",
      title: "Сканирование 11–13 нед",
      description: "Техника, NT, учебный риск, блок калькуляторов",
      href: "/tools/refs/fmf-11-13",
      kind: "reference",
      primary: true,
      badge: "FMF",
      mobileAction: "fmf",
    },
    {
      id: "calc-fmf",
      title: "Калькуляторы FMF",
      description: "Этапы 1–3: assessment, маршруты риска, анемия (Mari)",
      href: "/tools/calc/fmf",
      kind: "calculator",
      badge: "Расчёт",
    },
    {
      id: "consultant",
      title: "FMF · консультант I–III",
      description: "КТР, ТВП, допплер, MAP, PI МА",
      href: "/ai/consultants/fmf",
      kind: "reference",
      badge: "AI",
    },
    {
      id: "guided",
      title: "Протокол по сроку (guided)",
      description: "Смотреть → измерить → не пропустить",
      href: "/ai/consultants/fmf/guided",
      kind: "education",
      badge: "Guided",
    },
    {
      id: "consensus",
      title: "Каталог стандартов",
      description: "Все международные консенсусы и статусы",
      href: "/tools/consensus",
      kind: "reference",
    },
  ],
};

/** ACR RADS — O-RADS комната + BI / TI / LN калькуляторы. */
export const ACR_RADS_ROOM: ClinicalRoom = {
  id: "acr-rads",
  title: "ACR RADS",
  description: "Семейство ACR: придатки (O-RADS US), молочная железа, щит, лимфоузлы. EU-TIRADS — в плане.",
  href: "/tools/rads",
  primaryHref: "/tools/o-rads",
  domain: "rads",
  catalogPrimaryId: "acr-rads-hub",
  children: [
    {
      id: "orads-room",
      title: "O-RADS US · комната",
      description: "ACR v2022, IOTA, эхограммы, протокол",
      href: "/tools/o-rads",
      kind: "calculator",
      primary: true,
      badge: "O-RADS",
      mobileAction: "orads_hub",
    },
    {
      id: "bi-rads",
      title: "BI-RADS · молочная железа",
      description: "ACR BI-RADS US",
      href: "/tools/calc/rads/bi-rads",
      kind: "calculator",
      badge: "BI-RADS",
    },
    {
      id: "ti-rads",
      title: "TI-RADS · щитовидная",
      description: "ACR TI-RADS 2017",
      href: "/tools/calc/rads/ti-rads",
      kind: "calculator",
      badge: "TI-RADS",
    },
    {
      id: "ln-rads",
      title: "LN-RADS US",
      description: "Лимфоузлы · ACR",
      href: "/tools/calc/rads/ln-rads",
      kind: "calculator",
      badge: "LN-RADS",
    },
    {
      id: "consensus",
      title: "Каталог стандартов",
      description: "Статусы внедрения и перспективы (O-RADS MRI, EU-TIRADS)",
      href: "/tools/consensus#room-acr-rads",
      kind: "reference",
    },
  ],
};

/** FIGO · миома 0–8, PALM-COEIN, макет матки. */
export const FIGO_UTERUS_ROOM: ClinicalRoom = {
  id: "figo-uterus",
  title: "FIGO · матка",
  description: "Типизация миомы FIGO 0–8, PALM-COEIN, макет матки и учебный курс по миоме.",
  href: "/tools/figo-uterus",
  primaryHref: "/tools/mapping/uterus",
  domain: "gynecology",
  catalogPrimaryId: "figo-uterus-hub",
  children: [
    {
      id: "mapping",
      title: "Макет матки · FIGO",
      description: "Локализация узлов, тип в протоколе",
      href: "/tools/mapping/uterus",
      kind: "mapping",
      primary: true,
      badge: "FIGO",
    },
    {
      id: "myoma-course",
      title: "Учебный курс · миома",
      description: "Модули, атлас, квиз",
      href: "/tools/refs/myoma-education",
      kind: "education",
      badge: "Учёба",
    },
    {
      id: "myoma-calc",
      title: "Калькулятор FIGO",
      description: "Тип узла для протокола",
      href: "/tools/refs/myoma-education/calculators",
      kind: "calculator",
    },
    {
      id: "endometrium",
      title: "Эндометрий · IETA",
      description: "ISUOG / КР РФ · рядом с PALM-COEIN",
      href: "/tools/calc/gyn/endometrium",
      kind: "calculator",
      badge: "IETA",
    },
    {
      id: "consensus",
      title: "Каталог стандартов",
      description: "MUSA, PALM-COEIN в реестре",
      href: "/tools/consensus#room-figo-uterus",
      kind: "reference",
    },
  ],
};

/** ISUOG · акушерское УЗИ, фетометрия, смежные FIGO/WHO справочно. */
export const ISUOG_OB_ROOM: ClinicalRoom = {
  id: "isuog-ob",
  title: "ISUOG · акушерское УЗИ",
  description:
    "Комната: гайдлайны ISUOG, фетометрия (Hadlock), Bishop, связь с FMF. INTERGROWTH — в плане (реестр).",
  href: "/tools/isuog-ob",
  primaryHref: "/tools/refs/isuog-guidelines",
  domain: "obstetrics",
  catalogPrimaryId: "isuog-ob-hub",
  children: [
    {
      id: "isuog-guidelines",
      title: "Гайдлайны ISUOG",
      description: "Полка «Международные» · practice guidelines",
      href: "/tools/refs/isuog-guidelines",
      kind: "reference",
      primary: true,
      badge: "ISUOG",
      mobileAction: "isuog_ob_hub",
    },
    {
      id: "fetometry",
      title: "Фетометрия",
      description: "Калиперы и нормы I–III триместра",
      href: "/tools/calc/ob/fetometry",
      kind: "calculator",
      badge: "Таблицы",
      mobileAction: "fetometry_panel",
    },
    {
      id: "fetal-weight",
      title: "Масса плода (Hadlock)",
      description: "EFW и альтернативные формулы",
      href: "/tools/calc/ob/fetal-weight",
      kind: "calculator",
    },
    {
      id: "bishop",
      title: "Шкала Bishop",
      description: "Готовность шейки матки",
      href: "/tools/calc/ob/bishop",
      kind: "calculator",
    },
    {
      id: "fmf-link",
      title: "FMF · комната",
      description: "Скрининг 11–13, допплер, этапы риска",
      href: "/tools/fmf",
      kind: "reference",
      badge: "FMF",
      mobileAction: "fmf_hub",
    },
    {
      id: "biometry-formulas",
      title: "Формулы фетометрии",
      description: "Справочник расчётов и источников",
      href: "/tools/refs/fetal-biometry-formulas",
      kind: "education",
    },
    {
      id: "ob-calc",
      title: "Акушерский калькулятор",
      description: "Срок, CL, VBAC и др.",
      href: "/tools/calc/ob",
      kind: "calculator",
    },
    {
      id: "consensus",
      title: "Каталог стандартов",
      description: "Robson, FIGO PPH, INTERGROWTH — статусы",
      href: "/tools/consensus#room-isuog-ob",
      kind: "reference",
    },
  ],
};

/** IOTA/IETA/IDEA · морфология гин УЗИ. */
export const GYN_US_MORPHOLOGY_ROOM: ClinicalRoom = {
  id: "gyn-us-morphology",
  title: "Гин УЗИ · морфология",
  description:
    "IETA (эндометрий), IDEA (карта эндометриоза), термины IOTA 2026, эластография. Enzian/rASRM — полка знаний.",
  href: "/tools/gyn-us-morphology",
  primaryHref: "/tools/calc/gyn/endometrium",
  domain: "gynecology",
  catalogPrimaryId: "gyn-us-morphology-hub",
  children: [
    {
      id: "endometrium",
      title: "Эндометрий · IETA",
      description: "ISUOG / КР РФ · калькулятор",
      href: "/tools/calc/gyn/endometrium",
      kind: "calculator",
      primary: true,
      badge: "IETA",
      mobileAction: "gyn_us_morphology_hub",
    },
    {
      id: "idea-map",
      title: "Глубокий эндометриоз · IDEA",
      description: "Карта по сегментам",
      href: "/tools/mapping/endometriosis",
      kind: "mapping",
      badge: "IDEA",
    },
    {
      id: "iota-terms",
      title: "IOTA 2026 · термины",
      description: "Консенсусные определения придатков",
      href: "/tools/refs/iota-terms-2026",
      kind: "education",
      badge: "IOTA",
    },
    {
      id: "ten-steps",
      title: "10 шагов УЗИ малого таза",
      description: "Структура осмотра",
      href: "/tools/calc/gyn/ultrasound-10-steps",
      kind: "reference",
    },
    {
      id: "elastography",
      title: "Эластография",
      description: "Шейка матки · придатки — adjunct",
      href: "/tools/calc/gyn/elastography",
      kind: "calculator",
      mobileAction: "elastography",
    },
    {
      id: "orads-link",
      title: "O-RADS US · комната",
      description: "Придатки — ACR v2022",
      href: "/tools/o-rads",
      kind: "reference",
      badge: "O-RADS",
      mobileAction: "orads_hub",
    },
    {
      id: "consensus",
      title: "Каталог стандартов",
      description: "GI-RADS, Enzian, rASRM — corpus / план",
      href: "/tools/consensus#room-gyn-us-morphology",
      kind: "reference",
    },
  ],
};

export const CLINICAL_ROOMS: ClinicalRoom[] = [
  ORADS_US_ROOM,
  FMF_ROOM,
  ACR_RADS_ROOM,
  FIGO_UTERUS_ROOM,
  ISUOG_OB_ROOM,
  GYN_US_MORPHOLOGY_ROOM,
];

export function getClinicalRoom(id: string): ClinicalRoom | undefined {
  return CLINICAL_ROOMS.find((room) => room.id === id);
}

export function getClinicalRoomByHref(href: string): ClinicalRoom | undefined {
  return CLINICAL_ROOMS.find((room) => room.href === href);
}
