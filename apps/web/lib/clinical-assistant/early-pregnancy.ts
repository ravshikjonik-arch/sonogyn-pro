import { getBasicCourseLecture } from "@/lib/education/basic-course";

/** МКБ и группы, где уместна лекция ISUOG «ранняя беременность 4–10 нед». */
const EARLY_PREGNANCY_CODE_PREFIXES = ["O00", "O02", "O03", "O20", "O21", "Z33"] as const;

const EARLY_PREGNANCY_GROUPS = ["Ранняя беременность и потери"] as const;

export const FMF_EARLY_ASSISTANT_HREF = "/assistant/fmf";

export const ISUOG_EARLY_LECTURE_ID = "lecture-6-early-pregnancy-4-10";

export function isEarlyPregnancyAssistantCode(code: string, group?: string): boolean {
  if (EARLY_PREGNANCY_CODE_PREFIXES.some((prefix) => code.startsWith(prefix))) return true;
  if (group && EARLY_PREGNANCY_GROUPS.includes(group as (typeof EARLY_PREGNANCY_GROUPS)[number])) return true;
  return false;
}

export function getIsuogEarlyLectureLink() {
  const lecture = getBasicCourseLecture(ISUOG_EARLY_LECTURE_ID);
  return {
    lecture,
    courseHref: `/library/basic-course?lecture=${ISUOG_EARLY_LECTURE_ID}`,
    fmfHref: FMF_EARLY_ASSISTANT_HREF,
  };
}
