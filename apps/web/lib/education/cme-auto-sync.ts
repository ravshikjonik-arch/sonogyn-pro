/** Автозачёт часов из learning paths в CME-трекер. */

import { LEARNING_PATHS, loadLearningPathProgress } from "@/lib/education/learning-paths/catalog";

const CME_STORAGE_KEY = "sonogyn:cme-tracker:entries";
const CME_SYNC_KEY = "sonogyn:cme-tracker:synced-paths";

type CmeEntry = {
  id: string;
  title: string;
  hours: number;
  date: string;
  source: string;
};

function loadEntries(): CmeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CME_STORAGE_KEY) ?? "[]") as CmeEntry[];
  } catch {
    return [];
  }
}

function saveEntries(entries: CmeEntry[]): void {
  localStorage.setItem(CME_STORAGE_KEY, JSON.stringify(entries));
}

function loadSyncedPaths(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CME_SYNC_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveSyncedPaths(synced: Record<string, boolean>): void {
  localStorage.setItem(CME_SYNC_KEY, JSON.stringify(synced));
}

/** Добавляет в CME журнал завершённые learning paths (1 раз на path). */
export function syncLearningPathsToCme(): number {
  const progress = loadLearningPathProgress();
  const synced = loadSyncedPaths();
  const entries = loadEntries();
  let added = 0;

  for (const path of LEARNING_PATHS) {
    if (synced[path.id]) continue;
    const pathProgress = progress[path.id] ?? {};
    const done = path.steps.filter((s) => pathProgress[s.id]).length;
    if (done < path.steps.length) continue;

    const hours =
      path.steps.reduce((n, s) => n + (s.estimatedMinutes ?? 15), 0) / 60;
    entries.unshift({
      id: `path-${path.id}`,
      title: `Learning Path · ${path.titleRu}`,
      hours: Math.round(hours * 10) / 10,
      date: new Date().toISOString().slice(0, 10),
      source: "SonoGyn Pro · auto",
    });
    synced[path.id] = true;
    added += 1;
  }

  if (added > 0) {
    saveEntries(entries);
    saveSyncedPaths(synced);
    window.dispatchEvent(new Event("sonogyn:cme-updated"));
  }
  return added;
}
