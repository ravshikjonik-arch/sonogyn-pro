import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  encryptedGet,
  encryptedRemove,
  encryptedSet,
  migrateFromAsyncStorage,
} from "../lib/security/encryptedStore";
import { supabaseMobile } from "../lib/supabase/mobileClient";

const LEGACY_KEY = "prolapse_assessment_history_v1";
const MAX = 40;

export type ProlapseHistoryEntry = { id: string; at: number; summary: string };

async function resolveUserId(): Promise<string | null> {
  if (!supabaseMobile) return null;
  const { data } = await supabaseMobile.auth.getUser();
  return data.user?.id ?? null;
}

function storageKey(userId: string | null): string {
  return userId ? `prolapse_assessment_history_v1_${userId}` : `${LEGACY_KEY}_anonymous`;
}

async function ensureMigrated(userId: string | null): Promise<void> {
  const key = storageKey(userId);
  const existing = await encryptedGet(key);
  if (existing) return;
  await migrateFromAsyncStorage(LEGACY_KEY, key);
}

export async function loadProlapseHistory(): Promise<ProlapseHistoryEntry[]> {
  const userId = await resolveUserId();
  await ensureMigrated(userId);
  try {
    const raw = await encryptedGet(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ProlapseHistoryEntry =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as ProlapseHistoryEntry).id === "string" &&
        typeof (x as ProlapseHistoryEntry).at === "number" &&
        typeof (x as ProlapseHistoryEntry).summary === "string",
    );
  } catch {
    return [];
  }
}

export async function appendProlapseHistory(summary: string): Promise<void> {
  const userId = await resolveUserId();
  await ensureMigrated(userId);
  const prev = await loadProlapseHistory();
  const entry: ProlapseHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    summary,
  };
  const next = [entry, ...prev].slice(0, MAX);
  await encryptedSet(storageKey(userId), JSON.stringify(next));
}

export async function clearProlapseHistory(): Promise<void> {
  const userId = await resolveUserId();
  await encryptedRemove(storageKey(userId));
  await AsyncStorage.removeItem(LEGACY_KEY).catch(() => undefined);
}

/** Wipe all known prolapse keys (logout / account switch). */
export async function wipeAllProlapseHistory(): Promise<void> {
  await encryptedRemove(storageKey(null));
  await AsyncStorage.removeItem(LEGACY_KEY).catch(() => undefined);
  const userId = await resolveUserId();
  if (userId) {
    await encryptedRemove(storageKey(userId));
  }
}
