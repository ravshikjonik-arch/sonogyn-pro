import type { FetalDopplerSectionId } from "./types";

export type FetalDopplerKnowledgeEntry = {
  id: string;
  sectionId: FetalDopplerSectionId;
  title: string;
  tags: string[];
  content: string;
  searchableText: string;
};

/** Searchable knowledge base for SonoGyn-Pro assistant / library search. */
export const FETAL_DOPPLER_KNOWLEDGE_BASE: FetalDopplerKnowledgeEntry[] = [
  {
    id: "kb-alara",
    sectionId: "safety",
    title: "ALARA · TI · время экспозиции",
    tags: ["ALARA", "TI", "безопасность", "color", "pulsed"],
    content:
      "Минимальная мощность и время. TI ≤ 1.0. Ориентир 5–10 мин на протокол. Color → pulsed. Маленький box, минимальная глубина.",
    searchableText: "ALARA TI safety color pulsed doppler exposure time",
  },
  {
    id: "kb-dv-pi",
    sectionId: "ductus-venosus",
    title: "PI венозного протока · техника",
    tags: ["VP", "PI", "A-wave", "FMF"],
    content:
      "Правый парасагиттальный. Color ПВ→VP→ПП. Sample ~1 mm. 3 цикла. PI + A-wave antegrade в норме. Не путать с печёночными венами.",
    searchableText: "ductus venosus PI pulsatility index A wave hepatic vein",
  },
  {
    id: "kb-uta",
    sectionId: "uterine-arteries",
    title: "PI маточных артерий · протокол",
    tags: ["UTA", "PE", "preeclampsia", "PI"],
    content:
      "11–13+6. TA sagittal, internal os. Angle < 30°. SV 2 mm. 3 waveforms. Mean = (R+L)/2. PE screening component.",
    searchableText: "uterine artery PI preeclampsia screening mean",
  },
  {
    id: "kb-sua",
    sectionId: "umbilical-arteries",
    title: "SUA · 3-vessel cord",
    tags: ["SUA", "umbilical", "bladder"],
    content: "Transverse pelvis at bladder. 2 arteries lateral, vein central. SUA → extended workup per protocol.",
    searchableText: "single umbilical artery three vessel cord bladder",
  },
  {
    id: "kb-abd-wall",
    sectionId: "umbilical-ring",
    title: "Omphalocele vs gastroschisis",
    tags: ["omphalocele", "gastroschisis", "hernia"],
    content:
      "Physiological hernia до 11 нед. Omphalocele: midline, membrane. Gastroschisis: paraumbilical, free loops, no membrane. Document after 12 weeks.",
    searchableText: "omphalocele gastroschisis abdominal wall defect cord ring",
  },
  {
    id: "kb-heart",
    sectionId: "fetal-heart",
    title: "Сердце · 4CV · 3VT · TR",
    tags: ["4CV", "3VT", "TR", "heart"],
    content: "4CV color diastole filling. 3VT color three vessels. TR pulsed only on indication. Not full echo.",
    searchableText: "four chamber three vessel trachea tricuspid regurgitation",
  },
];

export function searchKnowledgeBase(query: string): FetalDopplerKnowledgeEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return FETAL_DOPPLER_KNOWLEDGE_BASE;
  return FETAL_DOPPLER_KNOWLEDGE_BASE.filter((e) => {
    const hay = `${e.title} ${e.content} ${e.tags.join(" ")} ${e.searchableText}`.toLowerCase();
    return hay.includes(q);
  });
}
