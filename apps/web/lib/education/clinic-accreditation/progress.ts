const PREFIX = "sonogyn:clinic-accreditation:";

export function progressKey(sectionId: string): string {
  return `${PREFIX}${sectionId}`;
}

export function loadSectionProgress(sectionId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(progressKey(sectionId)) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function setAccreditationItemDone(
  sectionId: string,
  itemId: string,
  done: boolean,
): Record<string, boolean> {
  const progress = loadSectionProgress(sectionId);
  if (done) progress[itemId] = true;
  else delete progress[itemId];
  localStorage.setItem(progressKey(sectionId), JSON.stringify(progress));
  window.dispatchEvent(new Event("sonogyn:clinic-accreditation-progress"));
  return progress;
}

export function resetSectionProgress(sectionId: string): void {
  localStorage.removeItem(progressKey(sectionId));
  window.dispatchEvent(new Event("sonogyn:clinic-accreditation-progress"));
}
