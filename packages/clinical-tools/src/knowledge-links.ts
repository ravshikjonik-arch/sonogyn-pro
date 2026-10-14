/**
 * Lightweight knowledge graph (code-first fallback, no PHI).
 * DB mirror: `public.knowledge_links` + GET `/api/knowledge/links` (merge).
 */

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
};

export function getKnowledgeLinksForNosology(nosologyId: string): KnowledgeLink[] {
  return NOSOLOGY_LINKS[nosologyId] ?? [];
}

export function listNosologyIdsWithKnowledgeLinks(): string[] {
  return Object.keys(NOSOLOGY_LINKS);
}
