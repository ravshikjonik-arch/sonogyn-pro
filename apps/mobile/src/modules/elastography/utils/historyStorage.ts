import AsyncStorage from "@react-native-async-storage/async-storage";
import { encryptedGet, encryptedRemove, encryptedSet, migrateFromAsyncStorage } from "../../../lib/security/encryptedStore";
import { supabaseMobile } from "../../../lib/supabase/mobileClient";
import type { ElastographyHistoryEntry } from "../types";

/** Базовый ключ логического хранилища истории */
export const ELASTOGRAPHY_HISTORY_BASE_KEY = "elastography_history_v1";

/** @deprecated Use per-user keys via storageKey(); kept for module re-exports. */
export const ELASTOGRAPHY_HISTORY_STORAGE_KEY = ELASTOGRAPHY_HISTORY_BASE_KEY;

/** Максимум записей в локальной истории (мед. требования) */
export const ELASTOGRAPHY_HISTORY_MAX_ENTRIES = 500;

const LEGACY_STORAGE_KEY = "elastography_history_v1_enc";
const LEGACY_PLAIN_ASYNC_KEY = "@elastography_history";

async function resolveUserId(): Promise<string | null> {
  if (!supabaseMobile) return null;
  const { data } = await supabaseMobile.auth.getUser();
  return data.user?.id ?? null;
}

function storageKey(userId: string | null): string {
  return userId
    ? `${ELASTOGRAPHY_HISTORY_BASE_KEY}_${userId}`
    : `${ELASTOGRAPHY_HISTORY_BASE_KEY}_anonymous`;
}

/** Простое base64-кодирование legacy (миграция, не шифрование) */
function decodeLegacyBase64Json(raw: string): ElastographyHistoryEntry[] | null {
  try {
    if (typeof atob !== "function") return null;
    const json = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(json) as ElastographyHistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, ELASTOGRAPHY_HISTORY_MAX_ENTRIES) : null;
  } catch {
    return null;
  }
}

function decodeLegacyPlainJson(raw: string): ElastographyHistoryEntry[] | null {
  try {
    const parsed = JSON.parse(raw) as ElastographyHistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, ELASTOGRAPHY_HISTORY_MAX_ENTRIES) : null;
  } catch {
    return null;
  }
}

function parseHistoryJson(raw: string): ElastographyHistoryEntry[] | null {
  return decodeLegacyPlainJson(raw) ?? decodeLegacyBase64Json(raw);
}

async function readFromAsyncStorage(key: string): Promise<ElastographyHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  return parseHistoryJson(raw) ?? [];
}

async function persistHistory(userId: string | null, entries: ElastographyHistoryEntry[]): Promise<void> {
  const next = entries.slice(0, ELASTOGRAPHY_HISTORY_MAX_ENTRIES);
  await encryptedSet(storageKey(userId), JSON.stringify(next));
}

async function migrateLegacyAsyncKeysIfNeeded(userId: string | null): Promise<ElastographyHistoryEntry[]> {
  const fromLegacyEnc = await readFromAsyncStorage(LEGACY_STORAGE_KEY);
  if (fromLegacyEnc.length > 0) {
    await persistHistory(userId, fromLegacyEnc);
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
    return fromLegacyEnc;
  }

  const fromPlain = await readFromAsyncStorage(LEGACY_PLAIN_ASYNC_KEY);
  if (fromPlain.length > 0) {
    await persistHistory(userId, fromPlain);
    await AsyncStorage.removeItem(LEGACY_PLAIN_ASYNC_KEY);
    return fromPlain;
  }

  return [];
}

async function ensureMigrated(userId: string | null): Promise<void> {
  const key = storageKey(userId);
  if (await encryptedGet(key)) return;
  await migrateFromAsyncStorage(LEGACY_PLAIN_ASYNC_KEY, key);
  if (await encryptedGet(key)) return;
  await migrateFromAsyncStorage(ELASTOGRAPHY_HISTORY_BASE_KEY, key);
}

/**
 * Перенос истории из открытого AsyncStorage в SecureStore.
 * @returns true если миграция выполнена
 */
export async function migrateHistoryToSecureStore(): Promise<boolean> {
  const userId = await resolveUserId();
  await ensureMigrated(userId);
  const key = storageKey(userId);
  const migratedMain = await migrateFromAsyncStorage(LEGACY_PLAIN_ASYNC_KEY, key);
  if (migratedMain) return true;

  const legacy = await migrateLegacyAsyncKeysIfNeeded(userId);
  return legacy.length > 0;
}

export { isEncryptedStorageAvailable } from "../../../lib/security/encryptedStore";

export async function loadElastographyHistory(): Promise<ElastographyHistoryEntry[]> {
  try {
    const userId = await resolveUserId();
    await ensureMigrated(userId);
    const key = storageKey(userId);

    const raw = await encryptedGet(key);
    if (raw) {
      const parsed = parseHistoryJson(raw);
      if (parsed) return parsed;
    }

    const migrated = await migrateHistoryToSecureStore();
    if (migrated) {
      const after = await encryptedGet(key);
      if (after) {
        return parseHistoryJson(after) ?? [];
      }
    }

    return await migrateLegacyAsyncKeysIfNeeded(userId);
  } catch (err) {
    console.warn("[Elastography] Не удалось загрузить историю:", err);
    return [];
  }
}

export async function saveElastographyEntry(entry: ElastographyHistoryEntry): Promise<void> {
  try {
    const userId = await resolveUserId();
    await ensureMigrated(userId);
    const prev = await loadElastographyHistory();
    const next = [entry, ...prev].slice(0, ELASTOGRAPHY_HISTORY_MAX_ENTRIES);
    await persistHistory(userId, next);
  } catch (err) {
    console.error("[Elastography] Не удалось сохранить запись истории:", err);
    throw err;
  }
}

export async function clearElastographyHistory(): Promise<void> {
  const userId = await resolveUserId();
  await encryptedRemove(storageKey(userId));
  await encryptedRemove(storageKey(null));
  await AsyncStorage.multiRemove([LEGACY_PLAIN_ASYNC_KEY, LEGACY_STORAGE_KEY]);
}

export function createHistoryId(): string {
  return `elasto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
