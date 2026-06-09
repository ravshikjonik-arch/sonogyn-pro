import { IDEA_STORAGE_KEY } from "@/features/idea-deep-endometriosis/lib/default-values";

const PROTOCOL_DRAFT_PREFIX = "protocol-draft-";
const NOSOLOGY_NOTES_PREFIX = "nosology:notes:";

/** Удалить локальные клинические черновики в браузере (при выходе). */
export function wipeWebClinicalLocalData(): void {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(PROTOCOL_DRAFT_PREFIX) || key.startsWith(NOSOLOGY_NOTES_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* private mode */
  }

  try {
    window.sessionStorage.removeItem(IDEA_STORAGE_KEY);
    window.sessionStorage.removeItem("nosology-pending-apply");
  } catch {
    /* ignore */
  }
}
