import { FETAL_ANATOMY_ISUOG_LECTURE_ID, syncViewsFromIsuogTopic } from "@/lib/education/fetal-anatomy-22-views/progress";
import {
  FETAL_DOPPLER_ISUOG_LECTURE_ID,
  ISUOG_TOPIC_PROGRESS_KEY,
} from "@/lib/education/fetal-doppler-first-trimester/progress";

export { ISUOG_TOPIC_PROGRESS_KEY as ISUOG_TOPIC_PROGRESS_STORAGE_KEY };

export const ISUOG_LECTURE_MODULE_SYNC: Record<
  string,
  { moduleHref: string; label: string; syncMessage: string }
> = {
  [FETAL_DOPPLER_ISUOG_LECTURE_ID]: {
    moduleHref: "/tools/refs/fetal-doppler-first-trimester",
    label: "5 позиций допплера",
    syncMessage: "Отметки синхронизированы с модулем /tools/refs/fetal-doppler-first-trimester.",
  },
  [FETAL_ANATOMY_ISUOG_LECTURE_ID]: {
    moduleHref: "/tools/refs/fetal-anatomy-22-views",
    label: "22 среза · 65 ВПР",
    syncMessage:
      "Отметки синхронизированы с модулем /tools/refs/fetal-anatomy-22-views (сreзы ↔ темы ISUOG).",
  },
};

export function onIsuogTopicToggled(lectureId: string, topicId: string, done: boolean): void {
  if (lectureId === FETAL_ANATOMY_ISUOG_LECTURE_ID) {
    syncViewsFromIsuogTopic(topicId, done);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("sonogyn:fetal-anatomy-progress"));
    }
  }
}
