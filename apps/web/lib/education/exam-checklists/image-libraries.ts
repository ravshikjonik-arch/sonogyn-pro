import type { ExamProtocolId } from "./types";

export type ProtocolImageLibraryLink = {
  protocolId: ExamProtocolId;
  label: string;
  href: string;
  description: string;
};

/** AIUM-style image library links → existing SonoGyn atlases & refs. */
export const PROTOCOL_IMAGE_LIBRARIES: ProtocolImageLibraryLink[] = [
  {
    protocolId: "gynecologic-pelvic",
    label: "O-RADS эхограммы",
    href: "/tools/refs/orads-echograms",
    description: "Учебные снимки аднексальных масс (Озерская).",
  },
  {
    protocolId: "gynecologic-pelvic",
    label: "Патология шейки",
    href: "/tools/refs/cervix-pathology",
    description: "Colposcopy, цитология — 8 глав.",
  },
  {
    protocolId: "obstetric-first-trimester",
    label: "Атлас I триместра",
    href: "/tools/refs/obstetric-atlas",
    description: "Блинов — ранняя беременность.",
  },
  {
    protocolId: "obstetric-first-trimester",
    label: "Допплер I триместра",
    href: "/tools/refs/fetal-doppler-first-trimester",
    description: "DV, tricuspid — reference views.",
  },
  {
    protocolId: "obstetric-standard",
    label: "22 среза · II триместр",
    href: "/tools/refs/fetal-anatomy-22-views",
    description: "Mandatory anatomy views + atlas.",
  },
  {
    protocolId: "obstetric-standard",
    label: "Позвоночник плода",
    href: "/tools/refs/fetal-spine",
    description: "15 карточек sagittal/coronal.",
  },
  {
    protocolId: "obstetric-third-trimester",
    label: "FMF · III скрининг",
    href: "/ai/consultants/fmf?section=third",
    description: "Biometry, doppler reference.",
  },
  {
    protocolId: "obstetric-third-trimester",
    label: "Клинические нормы",
    href: "/tools/refs/norms",
    description: "AFI, doppler PI thresholds.",
  },
];

export function imageLibrariesForProtocol(protocolId: ExamProtocolId): ProtocolImageLibraryLink[] {
  return PROTOCOL_IMAGE_LIBRARIES.filter((l) => l.protocolId === protocolId);
}
