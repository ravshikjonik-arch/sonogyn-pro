import { ideaFormSchema, type IdeaFormValues } from "./schema";

import { IDEA_STORAGE_KEY } from "./default-values";

const DEBOUNCE_MS = 500;

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function loadIdeaDraft(): IdeaFormValues | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(IDEA_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const res = ideaFormSchema.safeParse(parsed);
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export function saveIdeaDraftImmediate(values: IdeaFormValues): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(IDEA_STORAGE_KEY, JSON.stringify(values));
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
  storage()?.removeItem(IDEA_STORAGE_KEY);
}
