const STORAGE_PREFIX = "sonogyn-structured-editor";

export type AutosaveEnvelope<T> = {
  savedAt: string;
  payload: T;
  serverUpdatedAt?: string;
};

export function localRecoveryKey(scope: "case" | "protocol", entityId: string): string {
  return `${STORAGE_PREFIX}:${scope}:${entityId}`;
}

export function writeLocalRecovery<T>(key: string, payload: T, serverUpdatedAt?: string): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: AutosaveEnvelope<T> = {
      savedAt: new Date().toISOString(),
      payload,
      serverUpdatedAt,
    };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    /* quota or private mode */
  }
}

export function readLocalRecovery<T>(key: string): AutosaveEnvelope<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as AutosaveEnvelope<T>;
  } catch {
    return null;
  }
}

export function clearLocalRecovery(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
