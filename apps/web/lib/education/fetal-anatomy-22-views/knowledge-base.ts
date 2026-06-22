import type { FetalAnatomyViewId } from "./types";

export type FetalAnatomyKnowledgeEntry = {
  id: string;
  viewId?: FetalAnatomyViewId | "introduction";
  title: string;
  tags: string[];
  content: string;
  searchableText: string;
};

export const FETAL_ANATOMY_KNOWLEDGE_BASE: FetalAnatomyKnowledgeEntry[] = [
  {
    id: "kb-protocol",
    viewId: "introduction",
    title: "Протокол 22 срезов · Емельяненко",
    tags: ["protocol", "22 views", "65 anomalies", "II trimester"],
    content:
      "Обзор 1 → spine 1–3 → brain 4–6 → heart 7a/b, 8, 9, 9b, 10 → abdomen 11–13 → pelvis 14 → limbs 15–17 → face 18–20 → overview 2. Каждый срез привязан к списку исключаемых ВПР.",
    searchableText: "22 views protocol emelyanenko second trimester 65",
  },
  {
    id: "kb-screening-vs-diagnostic",
    viewId: "introduction",
    title: "Скрининг vs диагностическое УЗИ",
    tags: ["screening", "diagnostic", "ISUOG"],
    content:
      "II trimester anatomy scan — population screening with defined views. Abnormal finding → targeted diagnostic survey (fetal echo, neurosonography, MRI). Detection rates depend on protocol adherence, not single images.",
    searchableText: "screening diagnostic ultrasound anomaly detection",
  },
  {
    id: "kb-spine-triad",
    viewId: "view-01-spine-sagittal",
    title: "Spina bifida · lemon · banana",
    tags: ["spine", "NTD", "Chiari II"],
    content:
      "Open spina bifida: skin defect, spinal defect, often lemon skull + banana cerebellum. Meningocele: sac without open neural tissue. Always complete spine protocol + overview-2.",
    searchableText: "spina bifida lemon banana meningocele Chiari",
  },
  {
    id: "kb-brain-csp",
    viewId: "view-05-transthalamic",
    title: "CSP и ACC",
    tags: ["brain", "CSP", "ACC", "HPE"],
    content:
      "CSP visible transthalamic until ~36 weeks. Absent CSP → ACC or HPE workup. Alobar HPE: monoventricle, fused thalami, absent CSP.",
    searchableText: "CSP ACC holoprosencephaly transthalamic",
  },
  {
    id: "kb-heart-sequence",
    viewId: "view-07a-apical-four-chamber",
    title: "Cardiac sequence · 7a–10",
    tags: ["heart", "4CV", "LVOT", "RVOT", "3VT"],
    content:
      "Minimum: apical 4CV → lateral 4CV → LVOT → RVOT → outflow crossing → 3VT. Stopping at 4CV misses TGA, TOF, arch anomalies, pulmonary atresia.",
    searchableText: "heart sequence 4CV LVOT RVOT 3VT fetal echo screening",
  },
  {
    id: "kb-abdominal-wall",
    viewId: "view-12-cord-insertion",
    title: "Omphalocele vs gastroschisis",
    tags: ["abdomen", "wall defect"],
    content:
      "Omphalocele: midline, membrane, liver often. Gastroschisis: paraumbilical, free loops, no membrane. View 12 — cord insertion site.",
    searchableText: "omphalocele gastroschisis abdominal wall",
  },
  {
    id: "kb-kidney-bladder",
    viewId: "view-14-bladder-arteries",
    title: "Bladder · kidneys · SUA",
    tags: ["kidney", "bladder", "SUA", "BRA", "LUTO"],
    content:
      "View 13: both kidneys + pelvis. View 14: bladder + 2 umbilical arteries. Absent bladder — rescan; persistent absence + oligohydramnios → BRA/LUTO.",
    searchableText: "bladder kidney SUA BRA LUTO hydronephrosis",
  },
  {
    id: "kb-overview-2",
    viewId: "overview-2",
    title: "Overview-2 · spine sweep",
    tags: ["overview", "spine", "missed anomaly"],
    content:
      "Transverse body sweep neck to sacrum, vertebra by vertebra. Catches spina bifida, sacral agenesis, SCT missed on single static views.",
    searchableText: "overview 2 movement scan spine sweep missed anomaly",
  },
];

export function searchKnowledgeBase(query: string): FetalAnatomyKnowledgeEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return FETAL_ANATOMY_KNOWLEDGE_BASE;
  return FETAL_ANATOMY_KNOWLEDGE_BASE.filter((e) => e.searchableText.includes(q) || e.title.toLowerCase().includes(q));
}
