/** Связи нозологии ↔ учебные модули (самопроверка, курсы). */

export type NosologyEducationLink = {
  href: string;
  title: string;
  description: string;
  badge?: string;
};

export const NOSOLOGY_EDUCATION_LINKS: Partial<Record<string, NosologyEducationLink>> = {
  "cervix-pathology": {
    href: "/library/cervix-pathology",
    title: "Справочник · патология шейки",
    description: "7 глав + самопроверка (16 вопросов). TTS для student-guide, quickref для врача.",
    badge: "7+16",
  },
};
