import { getBasicCourseLecture } from "@/lib/education/basic-course";

export const FETAL_DOPPLER_FIRST_TRIMESTER_LECTURE_ID = "lecture-7-fetal-doppler-first-trimester";

export const FETAL_DOPPLER_EDUCATIONAL_HREF = "/tools/refs/fetal-doppler-first-trimester";

export function getFetalDopplerFirstTrimesterEducationalLink() {
  const lecture = getBasicCourseLecture(FETAL_DOPPLER_FIRST_TRIMESTER_LECTURE_ID);
  return {
    lecture,
    moduleHref: FETAL_DOPPLER_EDUCATIONAL_HREF,
    courseHref: "/tools/refs/fetal-doppler-first-trimester",
    fmfFirstHref: "/ai/consultants/fmf?section=first",
    fmfDopplerHref: "/ai/consultants/fmf?section=doppler",
  };
}
