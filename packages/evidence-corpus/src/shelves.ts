import type { EvidenceShelf } from "./types";

export type EvidenceShelfMeta = {
  id: EvidenceShelf;
  label: string;
  description: string;
  /** P0 = уже наполняется; planned = следующие этапы. */
  status: "active" | "planned";
  order: number;
};

export const EVIDENCE_SHELVES: EvidenceShelfMeta[] = [
  {
    id: "us-fmf",
    label: "УЗИ · FMF · доказательная база",
    description: "ISUOG, FMF: I–III скрининг, все калькуляторы FMF, допплер, близнецы, малый срок.",
    status: "active",
    order: 0,
  },
  {
    id: "obgyn",
    label: "Акушерство и гинекология",
    description: "Беременность, невынашивание, гинекологическая патология.",
    status: "active",
    order: 1,
  },
  {
    id: "cervix",
    label: "Шейка матки · риски",
    description: "Скрининг, ВПЧ, CIN, colposcopy triage.",
    status: "active",
    order: 2,
  },
  {
    id: "mammo",
    label: "Маммология",
    description: "BI-RADS US, тактика по образованиям МЖ.",
    status: "active",
    order: 3,
  },
  {
    id: "onco",
    label: "Онкология",
    description: "O-RADS, FIGO, red flags придатков и эндометрия.",
    status: "active",
    order: 4,
  },
  {
    id: "endocrine",
    label: "Эндокринология · гин.",
    description: "PCOS, AMH, щитовидная железа и беременность.",
    status: "active",
    order: 5,
  },
  {
    id: "surgery",
    label: "Хирургия · тазовая",
    description: "Показания, pre-op УЗИ, послеоперационный контроль.",
    status: "active",
    order: 6,
  },
];

export const EVIDENCE_DISCLAIMER =
  "Клиническая поддержка решения специалиста. Не заменяет осмотр, протокол учреждения и очную консультацию.";

export function getShelfMeta(id: EvidenceShelf): EvidenceShelfMeta | undefined {
  return EVIDENCE_SHELVES.find((s) => s.id === id);
}
