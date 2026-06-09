import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  encryptedGet,
  encryptedRemove,
  encryptedSet,
  migrateFromAsyncStorage,
} from "../../../lib/security/encryptedStore";
import { supabaseMobile } from "../../../lib/supabase/mobileClient";
import type { AIQueueItem, OradsInput, OradsResult } from "../types";

const CASES_BASE_KEY = "orads_case_history_v1";
const AI_QUEUE_BASE_KEY = "orads_ai_queue_v1";
const UX_METRIC_BASE_KEY = "orads_ux_metric_v1";

/** Legacy global keys (pre–SecureStore / pre–per-user migration) */
const LEGACY_CASES_KEY = "orads_case_history_v1";
const LEGACY_AI_QUEUE_KEY = "orads_ai_queue_v1";
const LEGACY_UX_METRIC_KEY = "orads_ux_metric_v1";

const MAX_CASES = 120;

export type StoredCase = {
  id: string;
  at: number;
  input: OradsInput;
  result: OradsResult;
};

export type UXMetric = {
  samples: number;
  avgTimeToResultSec: number;
};

async function resolveUserId(): Promise<string | null> {
  if (!supabaseMobile) return null;
  const { data } = await supabaseMobile.auth.getUser();
  return data.user?.id ?? null;
}

function casesKey(userId: string | null): string {
  return userId ? `${CASES_BASE_KEY}_${userId}` : `${CASES_BASE_KEY}_anonymous`;
}

function aiQueueKey(userId: string | null): string {
  return userId ? `${AI_QUEUE_BASE_KEY}_${userId}` : `${AI_QUEUE_BASE_KEY}_anonymous`;
}

function uxMetricKey(userId: string | null): string {
  return userId ? `${UX_METRIC_BASE_KEY}_${userId}` : `${UX_METRIC_BASE_KEY}_anonymous`;
}

async function readJson<T>(storageKey: string): Promise<T | null> {
  const raw = await encryptedGet(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson(storageKey: string, value: unknown): Promise<void> {
  await encryptedSet(storageKey, JSON.stringify(value));
}

async function ensureMigrated(userId: string | null): Promise<void> {
  const ck = casesKey(userId);
  const qk = aiQueueKey(userId);
  const uk = uxMetricKey(userId);

  if (!(await encryptedGet(ck))) {
    await migrateFromAsyncStorage(LEGACY_CASES_KEY, ck);
    if (!(await encryptedGet(ck))) {
      await migrateFromAsyncStorage(CASES_BASE_KEY, ck);
    }
  }
  if (!(await encryptedGet(qk))) {
    await migrateFromAsyncStorage(LEGACY_AI_QUEUE_KEY, qk);
    if (!(await encryptedGet(qk))) {
      await migrateFromAsyncStorage(AI_QUEUE_BASE_KEY, qk);
    }
  }
  if (!(await encryptedGet(uk))) {
    await migrateFromAsyncStorage(LEGACY_UX_METRIC_KEY, uk);
    if (!(await encryptedGet(uk))) {
      await migrateFromAsyncStorage(UX_METRIC_BASE_KEY, uk);
    }
  }
}

/** Перенос O-RADS из открытого AsyncStorage в SecureStore (один раз). */
export async function migrateOradsToSecureStore(): Promise<boolean> {
  const userId = await resolveUserId();
  await ensureMigrated(userId);
  return true;
}

/** Удалить локальные O-RADS данные текущего пользователя (при выходе). */
export async function wipeOradsLocalStorage(): Promise<void> {
  const userId = await resolveUserId();
  await Promise.all([
    encryptedRemove(casesKey(userId)),
    encryptedRemove(aiQueueKey(userId)),
    encryptedRemove(uxMetricKey(userId)),
    encryptedRemove(casesKey(null)),
    encryptedRemove(aiQueueKey(null)),
    encryptedRemove(uxMetricKey(null)),
    AsyncStorage.multiRemove([LEGACY_CASES_KEY, LEGACY_AI_QUEUE_KEY, LEGACY_UX_METRIC_KEY]),
  ]);
}

/** Wipe all known O-RADS keys (logout / account switch). */
export async function wipeAllOradsLocalStorage(): Promise<void> {
  await wipeOradsLocalStorage();
}

export async function loadCaseHistory(): Promise<StoredCase[]> {
  const userId = await resolveUserId();
  await ensureMigrated(userId);
  const data = await readJson<StoredCase[]>(casesKey(userId));
  return Array.isArray(data) ? data : [];
}

export async function appendCaseToHistory(input: OradsInput, result: OradsResult): Promise<void> {
  const userId = await resolveUserId();
  await ensureMigrated(userId);
  const prev = await loadCaseHistory();
  const next: StoredCase = { id: `${Date.now()}`, at: Date.now(), input, result };
  const out = [next, ...prev].slice(0, MAX_CASES);
  await writeJson(casesKey(userId), out);
}

export async function loadAIQueue(): Promise<AIQueueItem[]> {
  const userId = await resolveUserId();
  await ensureMigrated(userId);
  const data = await readJson<Partial<AIQueueItem>[]>(aiQueueKey(userId));
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
}

export async function saveAIQueue(items: AIQueueItem[]): Promise<void> {
  const userId = await resolveUserId();
  await writeJson(aiQueueKey(userId), items);
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

export async function loadUXMetric(): Promise<UXMetric> {
  const userId = await resolveUserId();
  await ensureMigrated(userId);
  const p = await readJson<Partial<UXMetric>>(uxMetricKey(userId));
  if (typeof p?.samples !== "number" || typeof p?.avgTimeToResultSec !== "number") {
    return { samples: 0, avgTimeToResultSec: 0 };
  }
  return { samples: p.samples, avgTimeToResultSec: p.avgTimeToResultSec };
}

export async function pushTimeToResult(seconds: number): Promise<UXMetric> {
  const userId = await resolveUserId();
  const current = await loadUXMetric();
  const samples = current.samples + 1;
  const avgTimeToResultSec = (current.avgTimeToResultSec * current.samples + seconds) / samples;
  const next = { samples, avgTimeToResultSec: Number(avgTimeToResultSec.toFixed(2)) };
  await writeJson(uxMetricKey(userId), next);
  return next;
}
