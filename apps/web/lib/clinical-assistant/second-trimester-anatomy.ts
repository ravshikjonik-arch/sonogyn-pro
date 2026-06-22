import { getBasicCourseLecture } from "@/lib/education/basic-course";

export const FETAL_ANATOMY_22_VIEWS_LECTURE_ID = "lecture-8-fetal-anatomy-22-views";

export const FETAL_ANATOMY_EDUCATIONAL_HREF = "/library/fetal-anatomy-22-views";

export function getFetalAnatomy22ViewsEducationalLink() {
  const lecture = getBasicCourseLecture(FETAL_ANATOMY_22_VIEWS_LECTURE_ID);
  return {
    lecture,
    moduleHref: FETAL_ANATOMY_EDUCATIONAL_HREF,
    courseHref: `/library/basic-course?lecture=${FETAL_ANATOMY_22_VIEWS_LECTURE_ID}&tab=lecture`,
    fmfSecondHref: "/assistant/fmf?section=second",
  };
}
