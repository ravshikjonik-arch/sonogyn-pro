import { ideaFormSchema, type IdeaFormValues } from "./schema";

import { IDEA_STORAGE_KEY } from "./default-values";

const DEBOUNCE_MS = 500;

export function loadIdeaDraft(): IdeaFormValues | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(IDEA_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const res = ideaFormSchema.safeParse(parsed);
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export function saveIdeaDraftImmediate(values: IdeaFormValues): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(IDEA_STORAGE_KEY, JSON.stringify(values));
  } catch {
    /* quota / private mode */
  }
}

export function createDebouncedIdeaSaver(): (values: IdeaFormValues) => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (values: IdeaFormValues) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      saveIdeaDraftImmediate(values);
    }, DEBOUNCE_MS);
  };
}

export function clearIdeaDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(IDEA_STORAGE_KEY);
}
