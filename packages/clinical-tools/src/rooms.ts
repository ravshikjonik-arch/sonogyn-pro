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

export const CLINICAL_ROOMS: ClinicalRoom[] = [ORADS_US_ROOM];

export function getClinicalRoom(id: string): ClinicalRoom | undefined {
  return CLINICAL_ROOMS.find((room) => room.id === id);
}

export function getClinicalRoomByHref(href: string): ClinicalRoom | undefined {
  return CLINICAL_ROOMS.find((room) => room.href === href);
}
