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

export const CLINICAL_ROOMS: ClinicalRoom[] = [
  ORADS_US_ROOM,
  FMF_ROOM,
  ACR_RADS_ROOM,
  FIGO_UTERUS_ROOM,
];

export function getClinicalRoom(id: string): ClinicalRoom | undefined {
  return CLINICAL_ROOMS.find((room) => room.id === id);
}

export function getClinicalRoomByHref(href: string): ClinicalRoom | undefined {
  return CLINICAL_ROOMS.find((room) => room.href === href);
}
