/** Связи нозологии ↔ учебные модули (самопроверка, курсы). */

export type NosologyEducationLink = {
  href: string;
  title: string;
  description: string;
  badge?: string;
};

export const NOSOLOGY_EDUCATION_LINKS: Partial<Record<string, NosologyEducationLink>> = {
  "cervix-pathology": {
    href: "/tools/refs/cervix-pathology?tab=cytology",
    title: "Справочник · патология шейки",
    description: "8 глав + интерактив «Цитология · скрининг», AI Bethesda, 25 вопросов самопроверки.",
    badge: "8+25",
  },
};
