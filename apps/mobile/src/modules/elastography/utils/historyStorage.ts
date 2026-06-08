import AsyncStorage from "@react-native-async-storage/async-storage";
import { encryptedGet, encryptedRemove, encryptedSet, migrateFromAsyncStorage } from "../../../lib/security/encryptedStore";
import type { ElastographyHistoryEntry } from "../types";

/** Ключ логического хранилища истории (миграция из AsyncStorage) */
export const ELASTOGRAPHY_HISTORY_STORAGE_KEY = "@elastography_history";

/** Максимум записей в локальной истории (мед. требования) */
export const ELASTOGRAPHY_HISTORY_MAX_ENTRIES = 500;

const LEGACY_STORAGE_KEY = "elastography_history_v1_enc";
const LEGACY_PLAIN_ASYNC_KEY = "@elastography_history";

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

async function persistHistory(entries: ElastographyHistoryEntry[]): Promise<void> {
  const next = entries.slice(0, ELASTOGRAPHY_HISTORY_MAX_ENTRIES);
  await encryptedSet(ELASTOGRAPHY_HISTORY_STORAGE_KEY, JSON.stringify(next));
}

async function migrateLegacyAsyncKeysIfNeeded(): Promise<ElastographyHistoryEntry[]> {
  const fromLegacyEnc = await readFromAsyncStorage(LEGACY_STORAGE_KEY);
  if (fromLegacyEnc.length > 0) {
    await persistHistory(fromLegacyEnc);
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
    return fromLegacyEnc;
  }

  const fromPlain = await readFromAsyncStorage(LEGACY_PLAIN_ASYNC_KEY);
  if (fromPlain.length > 0) {
    await persistHistory(fromPlain);
    await AsyncStorage.removeItem(LEGACY_PLAIN_ASYNC_KEY);
    return fromPlain;
  }

  return [];
}

/**
 * Перенос истории из открытого AsyncStorage в SecureStore.
 * @returns true если миграция выполнена
 */
export async function migrateHistoryToSecureStore(): Promise<boolean> {
  const migratedMain = await migrateFromAsyncStorage(
    LEGACY_PLAIN_ASYNC_KEY,
    ELASTOGRAPHY_HISTORY_STORAGE_KEY,
  );
  if (migratedMain) return true;

  const legacy = await migrateLegacyAsyncKeysIfNeeded();
  return legacy.length > 0;
}

export { isEncryptedStorageAvailable } from "../../../lib/security/encryptedStore";

export async function loadElastographyHistory(): Promise<ElastographyHistoryEntry[]> {
  try {
    const raw = await encryptedGet(ELASTOGRAPHY_HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = parseHistoryJson(raw);
      if (parsed) return parsed;
    }

    const migrated = await migrateHistoryToSecureStore();
    if (migrated) {
      const after = await encryptedGet(ELASTOGRAPHY_HISTORY_STORAGE_KEY);
      if (after) {
        return parseHistoryJson(after) ?? [];
      }
    }

    return await migrateLegacyAsyncKeysIfNeeded();
  } catch (err) {
    console.warn("[Elastography] Не удалось загрузить историю:", err);
    return [];
  }
}

export async function saveElastographyEntry(entry: ElastographyHistoryEntry): Promise<void> {
  try {
    const prev = await loadElastographyHistory();
    const next = [entry, ...prev].slice(0, ELASTOGRAPHY_HISTORY_MAX_ENTRIES);
    await persistHistory(next);
  } catch (err) {
    console.error("[Elastography] Не удалось сохранить запись истории:", err);
    throw err;
  }
}

export async function clearElastographyHistory(): Promise<void> {
  await encryptedRemove(ELASTOGRAPHY_HISTORY_STORAGE_KEY);
  await AsyncStorage.multiRemove([LEGACY_PLAIN_ASYNC_KEY, LEGACY_STORAGE_KEY]);
}

export function createHistoryId(): string {
  return `elasto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
