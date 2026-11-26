/**
 * Комнаты консенсуса — объединяют несколько классификаций в один вход (пилот: O-RADS US).
 * `classificationKeys` совпадают с `key` в international-standards.json.
 */
export type ConsensusRoom = {
  id: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
  classificationKeys: string[];
};

export const CONSENSUS_ROOMS: ConsensusRoom[] = [
  {
    id: "orads-us",
    title: "O-RADS US · комната придатков",
    description: "Калькулятор ACR v2022, IOTA, эхограммы, термины 2026, протокол.",
    href: "/tools/o-rads",
    badge: "ACR",
    classificationKeys: ["o-rads-us", "o-rads-mri", "iota-adnex", "iota-sr"],
  },
  {
    id: "acr-rads",
    title: "ACR RADS · маммо и щит",
    description: "BI-RADS, TI-RADS, LN-RADS — калькуляторы; EU-TIRADS — маршрут.",
    href: "/tools/rads",
    badge: "ACR",
    classificationKeys: ["bi-rads", "ti-rads-acr", "ln-rads-us", "eu-tirads"],
  },
  {
    id: "fmf",
    title: "FMF · скрининг и допплер",
    description: "11–13 нед, консультант, этапы 1–3: assessment, учебный риск, анемия (Mari).",
    href: "/tools/fmf",
    badge: "FMF",
    classificationKeys: ["fmf-risk", "doppler-velocimetry", "mca-psv-anemia"],
  },
  {
    id: "figo-uterus",
    title: "FIGO · матка и миомы",
    description: "Типизация миомы 0–8, PALM-COEIN, макет матки, MUSA.",
    href: "/tools/figo-uterus",
    badge: "FIGO",
    classificationKeys: ["figo-leiomyoma", "palm-coein", "musa"],
  },
  {
    id: "isuog-ob",
    title: "ISUOG · акушерское УЗИ",
    description: "Фетометрия, Bishop, гайдлайны ISUOG; INTERGROWTH — маршрут.",
    href: "/tools/isuog-ob",
    badge: "ISUOG",
    classificationKeys: ["bishop", "hadlock", "intergrowth", "figo-pph", "robson"],
  },
  {
    id: "gyn-us-morphology",
    title: "Гин УЗИ · морфология",
    description: "IETA, IDEA, GI-RADS, Enzian — полка и смежные калькуляторы.",
    href: "/tools/gyn-us-morphology",
    badge: "IOTA",
    classificationKeys: ["ieta", "idea", "gi-rads", "enzian", "rasrm"],
  },
];

export function getConsensusRoom(id: string): ConsensusRoom | undefined {
  return CONSENSUS_ROOMS.find((r) => r.id === id);
}

export function getConsensusRoomForClassificationKey(key: string): ConsensusRoom | undefined {
  return CONSENSUS_ROOMS.find((r) => r.classificationKeys.includes(key));
}