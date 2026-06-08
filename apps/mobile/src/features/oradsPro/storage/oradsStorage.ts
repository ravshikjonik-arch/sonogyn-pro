import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AIQueueItem, OradsInput, OradsResult } from "../types";

const CASES_KEY = "orads_case_history_v1";
const AI_QUEUE_KEY = "orads_ai_queue_v1";
const UX_METRIC_KEY = "orads_ux_metric_v1";
const MAX_CASES = 120;

export type StoredCase = {
  id: string;
  at: number;
  input: OradsInput;
  result: OradsResult;
};

export async function loadCaseHistory(): Promise<StoredCase[]> {
  try {
    const raw = await AsyncStorage.getItem(CASES_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as StoredCase[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function appendCaseToHistory(input: OradsInput, result: OradsResult): Promise<void> {
  const prev = await loadCaseHistory();
  const next: StoredCase = { id: `${Date.now()}`, at: Date.now(), input, result };
  const out = [next, ...prev].slice(0, MAX_CASES);
  await AsyncStorage.setItem(CASES_KEY, JSON.stringify(out));
}

export async function loadAIQueue(): Promise<AIQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(AI_QUEUE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Partial<AIQueueItem>[];
    if (!Array.isArray(data)) return [];
    return data
      .filter((x) => !!x && typeof x.id === "string" && typeof x.createdAt === "number" && typeof x.payload === "object")
      .map((x) => ({
        id: x.id as string,
        createdAt: x.createdAt as number,
        payload: x.payload as AIQueueItem["payload"],
        retryCount: typeof x.retryCount === "number" ? x.retryCount : 0,
        lastError: typeof x.lastError === "string" ? x.lastError : undefined,
        nextAttemptAt: typeof x.nextAttemptAt === "number" ? x.nextAttemptAt : undefined,
      }));
  } catch {
    return [];
  }
}

export async function saveAIQueue(items: AIQueueItem[]): Promise<void> {
  await AsyncStorage.setItem(AI_QUEUE_KEY, JSON.stringify(items));
}

export async function enqueueAIRequest(payload: OradsInput): Promise<AIQueueItem> {
  const q = await loadAIQueue();
  const item: AIQueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    payload,
    retryCount: 0,
  };
  await saveAIQueue([...q, item]);
  return item;
}

export type UXMetric = {
  samples: number;
  avgTimeToResultSec: number;
};

export async function loadUXMetric(): Promise<UXMetric> {
  try {
    const raw = await AsyncStorage.getItem(UX_METRIC_KEY);
    if (!raw) return { samples: 0, avgTimeToResultSec: 0 };
    const p = JSON.parse(raw) as Partial<UXMetric>;
    if (typeof p.samples !== "number" || typeof p.avgTimeToResultSec !== "number") {
      return { samples: 0, avgTimeToResultSec: 0 };
    }
    return { samples: p.samples, avgTimeToResultSec: p.avgTimeToResultSec };
  } catch {
    return { samples: 0, avgTimeToResultSec: 0 };
  }
}

export async function pushTimeToResult(seconds: number): Promise<UXMetric> {
  const current = await loadUXMetric();
  const samples = current.samples + 1;
  const avgTimeToResultSec = (current.avgTimeToResultSec * current.samples + seconds) / samples;
  const next = { samples, avgTimeToResultSec: Number(avgTimeToResultSec.toFixed(2)) };
  await AsyncStorage.setItem(UX_METRIC_KEY, JSON.stringify(next));
  return next;
}
