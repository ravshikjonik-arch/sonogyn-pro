import type { FetalAnatomyViewId } from "./types";
import { FETAL_ANATOMY_VIEWS } from "./views";

export const FETAL_ANATOMY_PROGRESS_KEY = "sonogyn:fetal-anatomy-22-views:progress";
export const ISUOG_TOPIC_PROGRESS_KEY = "sonogyn-isuog-topic-progress";
export const FETAL_ANATOMY_MODULE_EXTRA_PROGRESS_KEY = "sonogyn:fetal-anatomy-22-views:extra-sections";

export const FETAL_ANATOMY_ISUOG_LECTURE_ID = "lecture-8-fetal-anatomy-22-views";

/** ISUOG lecture 8 topic id → view ids в модуле 22 срезов. */
export const ISUOG_TOPIC_TO_VIEW_IDS: Record<string, FetalAnatomyViewId[]> = {
  "overview-spine": [
    "overview-1",
    "view-01-spine-sagittal",
    "view-02-spine-coronal",
    "view-03-trunk-coronal",
  ],
  "brain-views": ["view-04-transventricular", "view-05-transthalamic", "view-06-transcerebellar"],
  "heart-views": [
    "view-07a-apical-four-chamber",
    "view-07b-lateral-four-chamber",
    "view-08-lvot",
    "view-09-rvot",
    "view-09b-crossing-outflow",
    "view-10-three-vessel-trachea",
  ],
  "abdomen-pelvis": [
    "view-11-umbilical-vein",
    "view-12-cord-insertion",
    "view-13-kidneys",
    "view-14-bladder-arteries",
  ],
  "limbs-face-overview2": [
    "view-15-femur",
    "view-16-lower-limbs",
    "view-17-upper-limbs",
    "view-18-upper-lip",
    "view-19-orbits",
    "view-20-profile",
    "overview-2",
  ],
};

export const FETAL_ANATOMY_CORE_TOPIC_IDS = Object.keys(ISUOG_TOPIC_TO_VIEW_IDS);

export const VIEW_ID_TO_ISUOG_TOPIC: Partial<Record<FetalAnatomyViewId, string>> = Object.fromEntries(
  Object.entries(ISUOG_TOPIC_TO_VIEW_IDS).flatMap(([topicId, viewIds]) =>
    viewIds.map((viewId) => [viewId, topicId]),
  ),
);

export type FetalAnatomyExtraSectionId =
  | "anomaly-database"
  | "case-library"
  | "assessment"
  | "glossary"
  | "visual-atlas";

export const FETAL_ANATOMY_MODULE_ONLY_SECTIONS: FetalAnatomyExtraSectionId[] = [
  "anomaly-database",
  "case-library",
  "assessment",
  "glossary",
  "visual-atlas",
];

export function isuogTopicKey(lectureId: string, topicId: string): string {
  return `${lectureId}::${topicId}`;
}

export function loadViewProgress(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(FETAL_ANATOMY_PROGRESS_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
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
    return JSON.parse(localStorage.getItem(FETAL_ANATOMY_MODULE_EXTRA_PROGRESS_KEY) ?? "{}") as Record<
      string,
      boolean
    >;
  } catch {
    return {};
  }
}

function saveViewProgress(progress: Record<string, boolean>): void {
  localStorage.setItem(FETAL_ANATOMY_PROGRESS_KEY, JSON.stringify(progress));
}

function saveIsuogTopicProgress(progress: Record<string, boolean>): void {
  localStorage.setItem(ISUOG_TOPIC_PROGRESS_KEY, JSON.stringify(progress));
}

export function saveModuleExtraProgress(progress: Record<string, boolean>): void {
  localStorage.setItem(FETAL_ANATOMY_MODULE_EXTRA_PROGRESS_KEY, JSON.stringify(progress));
}

function isTopicViewsComplete(topicId: string, viewProgress: Record<string, boolean>): boolean {
  const viewIds = ISUOG_TOPIC_TO_VIEW_IDS[topicId] ?? [];
  return viewIds.length > 0 && viewIds.every((id) => Boolean(viewProgress[id]));
}

function syncIsuogTopicsFromViews(viewProgress: Record<string, boolean>): void {
  const isuog = loadIsuogTopicProgress();
  let changed = false;
  for (const topicId of FETAL_ANATOMY_CORE_TOPIC_IDS) {
    const key = isuogTopicKey(FETAL_ANATOMY_ISUOG_LECTURE_ID, topicId);
    const complete = isTopicViewsComplete(topicId, viewProgress);
    if (complete && !isuog[key]) {
      isuog[key] = true;
      changed = true;
    } else if (!complete && isuog[key]) {
      delete isuog[key];
      changed = true;
    }
  }
  if (changed) saveIsuogTopicProgress(isuog);
}

export function isCoreTopicDone(topicId: string, isuogProgress = loadIsuogTopicProgress()): boolean {
  return Boolean(isuogProgress[isuogTopicKey(FETAL_ANATOMY_ISUOG_LECTURE_ID, topicId)]);
}

export function setViewDone(viewId: string, done: boolean): Record<string, boolean> {
  const progress = loadViewProgress();
  if (done) progress[viewId] = true;
  else delete progress[viewId];
  saveViewProgress(progress);
  syncIsuogTopicsFromViews(progress);
  notifyFetalAnatomyProgressChange();
  return progress;
}

export function setModuleExtraSectionDone(
  sectionId: FetalAnatomyExtraSectionId,
  done: boolean,
): Record<string, boolean> {
  const progress = loadModuleExtraProgress();
  if (done) progress[sectionId] = true;
  else delete progress[sectionId];
  saveModuleExtraProgress(progress);
  return progress;
}

export function toggleModuleExtraSection(sectionId: FetalAnatomyExtraSectionId): boolean {
  const next = !loadModuleExtraProgress()[sectionId];
  setModuleExtraSectionDone(sectionId, next);
  return next;
}

export function viewProgressPercent(totalViews: number, progress = loadViewProgress()): number {
  if (!totalViews) return 0;
  const done = Object.values(progress).filter(Boolean).length;
  return Math.round((done / totalViews) * 100);
}

export function fetalAnatomyCoreProgressPercent(isuogProgress = loadIsuogTopicProgress()): number {
  if (!FETAL_ANATOMY_CORE_TOPIC_IDS.length) return 0;
  const done = FETAL_ANATOMY_CORE_TOPIC_IDS.filter((id) => isCoreTopicDone(id, isuogProgress)).length;
  return Math.round((done / FETAL_ANATOMY_CORE_TOPIC_IDS.length) * 100);
}

export function fetalAnatomyFullModuleProgressPercent(
  viewProgress = loadViewProgress(),
  isuogProgress = loadIsuogTopicProgress(),
  extraProgress = loadModuleExtraProgress(),
): number {
  const viewTotal = FETAL_ANATOMY_VIEWS.length;
  const viewDone = Object.values(viewProgress).filter(Boolean).length;
  const extraDone = FETAL_ANATOMY_MODULE_ONLY_SECTIONS.filter((id) => Boolean(extraProgress[id])).length;
  const total = viewTotal + FETAL_ANATOMY_MODULE_ONLY_SECTIONS.length;
  if (!total) return 0;
  return Math.round(((viewDone + extraDone) / total) * 100);
}

export function fetalAnatomyProgressSummary(isuogProgress = loadIsuogTopicProgress()) {
  const coreDone = FETAL_ANATOMY_CORE_TOPIC_IDS.filter((id) => isCoreTopicDone(id, isuogProgress)).length;
  return {
    coreDone,
    coreTotal: FETAL_ANATOMY_CORE_TOPIC_IDS.length,
    corePercent: fetalAnatomyCoreProgressPercent(isuogProgress),
    isuogHref: `/tools/refs/basic-course?lecture=${FETAL_ANATOMY_ISUOG_LECTURE_ID}&tab=practice`,
  };
}

export function topicProgressForView(
  viewId: FetalAnatomyViewId,
  isuogProgress = loadIsuogTopicProgress(),
): { topicId: string; done: boolean } | null {
  const topicId = VIEW_ID_TO_ISUOG_TOPIC[viewId];
  if (!topicId) return null;
  return { topicId, done: isCoreTopicDone(topicId, isuogProgress) };
}

/** Двусторонняя синхронизация: отметка темы ISUOG → все срезы блока. */
export function syncViewsFromIsuogTopic(topicId: string, done: boolean): Record<string, boolean> {
  const viewIds = ISUOG_TOPIC_TO_VIEW_IDS[topicId] ?? [];
  const progress = loadViewProgress();
  for (const id of viewIds) {
    if (done) progress[id] = true;
    else delete progress[id];
  }
  saveViewProgress(progress);
  return progress;
}

export function notifyFetalAnatomyProgressChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("sonogyn:fetal-anatomy-progress"));
}
