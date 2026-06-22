import type { FetalDopplerSectionId } from "./types";

export const ISUOG_TOPIC_PROGRESS_KEY = "sonogyn-isuog-topic-progress";

export const FETAL_DOPPLER_MODULE_EXTRA_PROGRESS_KEY = "sonogyn:fetal-doppler:extra-sections";

export const FETAL_DOPPLER_ISUOG_LECTURE_ID = "lecture-7-fetal-doppler-first-trimester";

/** ISUOG lecture 7 topic id → section id в модуле допплера. */
export const FETAL_DOPPLER_TOPIC_TO_SECTION: Record<string, FetalDopplerSectionId> = {
  "alara-safety": "safety",
  "five-positions": "five-positions",
  "fetal-heart-doppler": "fetal-heart",
  "ductus-venosus": "ductus-venosus",
  "umbilical-vessels": "umbilical-arteries",
  "umbilical-ring": "umbilical-ring",
  "uterine-arteries": "uterine-arteries",
};

/** Секции модуля без отдельной темы в ISUOG (только здесь). */
export const FETAL_DOPPLER_MODULE_ONLY_SECTIONS: FetalDopplerSectionId[] = [
  "introduction",
  "common-pitfalls",
  "sonogyn-educational-mode",
  "case-library",
  "assessment",
  "visual-atlas",
];

export const FETAL_DOPPLER_CORE_TOPIC_IDS = Object.keys(FETAL_DOPPLER_TOPIC_TO_SECTION);

export const SECTION_TO_ISUOG_TOPIC: Record<FetalDopplerSectionId, string | undefined> =
  Object.fromEntries(
    Object.entries(FETAL_DOPPLER_TOPIC_TO_SECTION).map(([topicId, sectionId]) => [sectionId, topicId]),
  ) as Record<FetalDopplerSectionId, string | undefined>;

export function isuogTopicKey(lectureId: string, topicId: string): string {
  return `${lectureId}::${topicId}`;
}

export function loadIsuogTopicProgress(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ISUOG_TOPIC_PROGRESS_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function loadModuleExtraProgress(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(FETAL_DOPPLER_MODULE_EXTRA_PROGRESS_KEY) ?? "{}") as Record<
      string,
      boolean
    >;
  } catch {
    return {};
  }
}

export function saveIsuogTopicProgress(progress: Record<string, boolean>): void {
  localStorage.setItem(ISUOG_TOPIC_PROGRESS_KEY, JSON.stringify(progress));
}

export function saveModuleExtraProgress(progress: Record<string, boolean>): void {
  localStorage.setItem(FETAL_DOPPLER_MODULE_EXTRA_PROGRESS_KEY, JSON.stringify(progress));
}

export function isCoreTopicDone(topicId: string, progress = loadIsuogTopicProgress()): boolean {
  return Boolean(progress[isuogTopicKey(FETAL_DOPPLER_ISUOG_LECTURE_ID, topicId)]);
}

export function isFetalDopplerSectionDone(
  sectionId: FetalDopplerSectionId,
  isuogProgress = loadIsuogTopicProgress(),
  extraProgress = loadModuleExtraProgress(),
): boolean {
  const topicId = SECTION_TO_ISUOG_TOPIC[sectionId];
  if (topicId) return isCoreTopicDone(topicId, isuogProgress);
  return Boolean(extraProgress[sectionId]);
}

export function setCoreTopicDone(topicId: string, done: boolean): Record<string, boolean> {
  const progress = loadIsuogTopicProgress();
  const key = isuogTopicKey(FETAL_DOPPLER_ISUOG_LECTURE_ID, topicId);
  if (done) progress[key] = true;
  else delete progress[key];
  saveIsuogTopicProgress(progress);
  return progress;
}

export function setModuleExtraSectionDone(sectionId: FetalDopplerSectionId, done: boolean): Record<string, boolean> {
  const progress = loadModuleExtraProgress();
  if (done) progress[sectionId] = true;
  else delete progress[sectionId];
  saveModuleExtraProgress(progress);
  return progress;
}

export function toggleFetalDopplerSectionDone(sectionId: FetalDopplerSectionId): {
  isuogProgress: Record<string, boolean>;
  extraProgress: Record<string, boolean>;
  done: boolean;
} {
  const topicId = SECTION_TO_ISUOG_TOPIC[sectionId];
  if (topicId) {
    const nextDone = !isCoreTopicDone(topicId);
    const isuogProgress = setCoreTopicDone(topicId, nextDone);
    return { isuogProgress, extraProgress: loadModuleExtraProgress(), done: nextDone };
  }
  const nextDone = !loadModuleExtraProgress()[sectionId];
  const extraProgress = setModuleExtraSectionDone(sectionId, nextDone);
  return { isuogProgress: loadIsuogTopicProgress(), extraProgress, done: nextDone };
}

export function fetalDopplerCoreProgressPercent(
  isuogProgress = loadIsuogTopicProgress(),
): number {
  if (!FETAL_DOPPLER_CORE_TOPIC_IDS.length) return 0;
  const done = FETAL_DOPPLER_CORE_TOPIC_IDS.filter((id) => isCoreTopicDone(id, isuogProgress)).length;
  return Math.round((done / FETAL_DOPPLER_CORE_TOPIC_IDS.length) * 100);
}

export function fetalDopplerFullModuleProgressPercent(
  isuogProgress = loadIsuogTopicProgress(),
  extraProgress = loadModuleExtraProgress(),
): number {
  const total = FETAL_DOPPLER_CORE_TOPIC_IDS.length + FETAL_DOPPLER_MODULE_ONLY_SECTIONS.length;
  if (!total) return 0;
  const coreDone = FETAL_DOPPLER_CORE_TOPIC_IDS.filter((id) => isCoreTopicDone(id, isuogProgress)).length;
  const extraDone = FETAL_DOPPLER_MODULE_ONLY_SECTIONS.filter((id) =>
    Boolean(extraProgress[id]),
  ).length;
  return Math.round(((coreDone + extraDone) / total) * 100);
}

export function fetalDopplerProgressSummary(isuogProgress = loadIsuogTopicProgress()) {
  const coreDone = FETAL_DOPPLER_CORE_TOPIC_IDS.filter((id) => isCoreTopicDone(id, isuogProgress)).length;
  return {
    coreDone,
    coreTotal: FETAL_DOPPLER_CORE_TOPIC_IDS.length,
    corePercent: fetalDopplerCoreProgressPercent(isuogProgress),
    isuogHref: `/library/basic-course?lecture=${FETAL_DOPPLER_ISUOG_LECTURE_ID}&tab=practice`,
  };
}
