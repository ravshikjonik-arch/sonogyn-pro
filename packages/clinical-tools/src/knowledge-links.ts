/**
 * Lightweight knowledge graph (code-first fallback, no PHI).
 * DB mirror: `public.knowledge_links` + GET `/api/knowledge/links` (merge).
 */

import { bookAtlasKnowledgeLinksForSeed } from "@repo/book-nosology-registry";

export type KnowledgeLinkKind = "calculator" | "guideline" | "quiz" | "atlas" | "tool" | "education";

export type KnowledgeLink = {
  kind: KnowledgeLinkKind;
  title: string;
  href: string;
  description?: string;
};

const NOSOLOGY_LINKS: Record<string, KnowledgeLink[]> = {
  endometrioma: [
    {
      kind: "calculator",
      title: "O-RADS US v2022",
      href: "/tools/calc/rads/o-rads",
      description: "Калькулятор + IOTA 2026",
    },
    {
      kind: "atlas",
      title: "O-RADS · эхограммы",
      href: "/tools/refs/orads-echograms",
    },
    {
      kind: "quiz",
      title: "IOTA 2026 · самопроверка",
      href: "/tools/refs/iota-terms-2026",
    },
  ],
  "ovarian-functional-cyst": [
    { kind: "calculator", title: "O-RADS US", href: "/tools/calc/rads/o-rads" },
    { kind: "atlas", title: "O-RADS · эхограммы", href: "/tools/refs/orads-echograms" },
  ],
  hydrosalpinx: [
    { kind: "calculator", title: "O-RADS US", href: "/tools/calc/rads/o-rads" },
    { kind: "quiz", title: "OBGYN exam set-pieces", href: "/tools/refs/exam-set-pieces" },
  ],
  "uterine-myoma": [
    { kind: "calculator", title: "FIGO · миома", href: "/tools/mapping/uterus" },
    { kind: "guideline", title: "КР · миома матки", href: "/tools/refs/guidelines" },
    { kind: "quiz", title: "Exam set-pieces · myometrium", href: "/tools/refs/exam-set-pieces" },
  ],
  adenomyosis: [
    { kind: "tool", title: "IDEA · эндометриоз", href: "/tools/mapping/endometriosis" },
    { kind: "calculator", title: "Эндометрий · ISUOG", href: "/tools/calc/gyn/endometrium" },
  ],
  "endometrial-hyperplasia": [
    { kind: "calculator", title: "Эндометрий", href: "/tools/calc/gyn/endometrium" },
    { kind: "guideline", title: "КР · гиперплазия эндометрия", href: "/tools/refs/guidelines" },
  ],
  "cervix-pathology": [
    {
      kind: "education",
      title: "Патология шейки · модуль",
      href: "/tools/refs/cervix-pathology",
      description: "Цитология · скрининг · quiz",
    },
    { kind: "quiz", title: "Каталог задач", href: "/tools/refs/quiz-hub" },
  ],
  "short-cervix-pregnancy": [
    { kind: "calculator", title: "Длина шейки матки", href: "/tools/calc/ob/cervical-length" },
    { kind: "calculator", title: "Срок беременности", href: "/tools/calc/ob" },
  ],
  "fetal-growth-restriction": [
    { kind: "calculator", title: "Срок · фетометрия", href: "/tools/calc/ob" },
    { kind: "atlas", title: "Акушерский атлас", href: "/tools/refs/obstetric-atlas" },
  ],
  oligohydramnios: [
    { kind: "calculator", title: "AFI / срок", href: "/tools/calc/ob" },
    { kind: "guideline", title: "КР · акушерство", href: "/tools/refs/guidelines" },
  ],
  polyhydramnios: [
    { kind: "calculator", title: "Срок · фетометрия", href: "/tools/calc/ob" },
  ],
  "placenta-previa": [
    { kind: "calculator", title: "Акушерство · hub", href: "/tools/calc/ob" },
    { kind: "quiz", title: "Exam checklists", href: "/tools/refs/exam-checklists" },
  ],
  "breast-fibroadenoma-us": [
    { kind: "calculator", title: "BI-RADS US", href: "/tools/calc/rads/bi-rads" },
    { kind: "atlas", title: "Маммология · Каприн", href: "/tools/refs/mammology-national-atlas" },
  ],
  "breast-cyst-us": [
    { kind: "calculator", title: "BI-RADS US", href: "/tools/calc/rads/bi-rads" },
    { kind: "atlas", title: "Маммология · Каприн", href: "/tools/refs/mammology-national-atlas" },
  ],
  "breast-malignancy-suspicion-us": [
    { kind: "calculator", title: "BI-RADS US", href: "/tools/calc/rads/bi-rads" },
    { kind: "atlas", title: "Маммология · Каприн", href: "/tools/refs/mammology-national-atlas" },
    { kind: "guideline", title: "КР · ЗНО МЖ", href: "/tools/refs/guidelines" },
  ],
  "breast-dense-tissue-us": [
    { kind: "calculator", title: "BI-RADS US", href: "/tools/calc/rads/bi-rads" },
    { kind: "atlas", title: "Маммология · Каприн", href: "/tools/refs/mammology-national-atlas" },
  ],
  "fetal-chd-suspicion": [
    { kind: "atlas", title: "Пренатал · сердце", href: "/tools/refs/prenatal-echography-atlas?slug=glava-15" },
    { kind: "atlas", title: "22 проекции сердца", href: "/tools/refs/fetal-anatomy-22-views" },
    { kind: "education", title: "Otto · эхокардиография", href: "/tools/refs/clinical-echocardiography-atlas" },
  ],
};

function mergeUniqueLinks(base: KnowledgeLink[], extra: KnowledgeLink[]): KnowledgeLink[] {
  const seen = new Set(base.map((l) => l.href));
  const out = [...base];
  for (const link of extra) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    out.push(link);
  }
  return out;
}

export function getKnowledgeLinksForNosology(nosologyId: string): KnowledgeLink[] {
  const base = NOSOLOGY_LINKS[nosologyId] ?? [];
  const fromBooks = bookAtlasKnowledgeLinksForSeed(nosologyId).map((l) => ({
    kind: l.kind,
    title: l.title,
    href: l.href,
    description: l.description,
  })) satisfies KnowledgeLink[];
  return mergeUniqueLinks(base, fromBooks);
}

export function listNosologyIdsWithKnowledgeLinks(): string[] {
  return Object.keys(NOSOLOGY_LINKS);
}
