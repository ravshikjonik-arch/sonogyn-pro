const PREFIX = "sonogyn-speech-draft:";

export function loadDictationDraft(storageKey: string): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(PREFIX + storageKey) ?? localStorage.getItem(PREFIX + storageKey) ?? "";
  } catch {
    return "";
  }
}

export function saveDictationDraft(storageKey: string, text: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PREFIX + storageKey, text);
  } catch {
    /* quota */
  }
}

export function clearDictationDraft(storageKey: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PREFIX + storageKey);
    localStorage.removeItem(PREFIX + storageKey);
  } catch {
    /* noop */
  }
}
