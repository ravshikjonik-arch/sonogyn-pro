import { getBasicCourseLecture } from "@/lib/education/basic-course";

export const FETAL_DOPPLER_FIRST_TRIMESTER_LECTURE_ID = "lecture-7-fetal-doppler-first-trimester";

export const FETAL_DOPPLER_EDUCATIONAL_HREF = "/library/fetal-doppler-first-trimester";

export function getFetalDopplerFirstTrimesterEducationalLink() {
  const lecture = getBasicCourseLecture(FETAL_DOPPLER_FIRST_TRIMESTER_LECTURE_ID);
  return {
    lecture,
    moduleHref: FETAL_DOPPLER_EDUCATIONAL_HREF,
    courseHref: `/library/basic-course?lecture=${FETAL_DOPPLER_FIRST_TRIMESTER_LECTURE_ID}&tab=lecture`,
    fmfFirstHref: "/assistant/fmf?section=first",
    fmfDopplerHref: "/assistant/fmf?section=doppler",
  };
}
