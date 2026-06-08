import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "prolapse_assessment_history_v1";
const MAX = 40;

export type ProlapseHistoryEntry = { id: string; at: number; summary: string };

export async function loadProlapseHistory(): Promise<ProlapseHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ProlapseHistoryEntry =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as ProlapseHistoryEntry).id === "string" &&
        typeof (x as ProlapseHistoryEntry).at === "number" &&
        typeof (x as ProlapseHistoryEntry).summary === "string"
    );
  } catch {
    return [];
  }
}

export async function appendProlapseHistory(summary: string): Promise<void> {
  const prev = await loadProlapseHistory();
  const entry: ProlapseHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    summary,
  };
  const next = [entry, ...prev].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
