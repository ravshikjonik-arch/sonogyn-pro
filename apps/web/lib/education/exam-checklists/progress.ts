import type { ExamProtocolId } from "./types";

export const EXAM_CHECKLISTS_PROGRESS_PREFIX = "sonogyn:exam-checklists:";

export function progressKey(protocolId: ExamProtocolId): string {
  return `${EXAM_CHECKLISTS_PROGRESS_PREFIX}${protocolId}`;
}

export function loadProtocolProgress(protocolId: ExamProtocolId): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(progressKey(protocolId)) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function saveProtocolProgress(protocolId: ExamProtocolId, progress: Record<string, boolean>): void {
  localStorage.setItem(progressKey(protocolId), JSON.stringify(progress));
}

export function setItemDone(
  protocolId: ExamProtocolId,
  itemId: string,
  done: boolean,
): Record<string, boolean> {
  const progress = loadProtocolProgress(protocolId);
  if (done) progress[itemId] = true;
  else delete progress[itemId];
  saveProtocolProgress(protocolId, progress);
  notifyExamChecklistsProgressChange();
  return progress;
}

export function resetProtocolProgress(protocolId: ExamProtocolId): void {
  localStorage.removeItem(progressKey(protocolId));
  notifyExamChecklistsProgressChange();
}

export function notifyExamChecklistsProgressChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("sonogyn:exam-checklists-progress"));
}
