/**
 * Supabase auth persistence: SecureStore on native (chunked for large JWT payloads),
 * AsyncStorage on web. Migrates legacy AsyncStorage session on first read.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { SupportedStorage } from "@supabase/supabase-js";

const IS_NATIVE = Platform.OS === "ios" || Platform.OS === "android";
const CHUNK_SIZE = 1800;
const CHUNK_COUNT_SUFFIX = "__chunk_count";

async function secureGet(key: string): Promise<string | null> {
  if (!IS_NATIVE) return AsyncStorage.getItem(key);

  const direct = await SecureStore.getItemAsync(key);
  if (direct !== null) return direct;

  const countRaw = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
  if (!countRaw) return null;

  const count = Number.parseInt(countRaw, 10);
  if (!Number.isFinite(count) || count <= 0) return null;

  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const part = await SecureStore.getItemAsync(`${key}__chunk_${i}`);
    if (part === null) return null;
    parts.push(part);
  }
  return parts.join("");
}

async function secureSet(key: string, value: string): Promise<void> {
  if (!IS_NATIVE) {
    await AsyncStorage.setItem(key, value);
    return;
  }

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`).catch(() => undefined);
    for (let i = 0; i < 8; i++) {
      await SecureStore.deleteItemAsync(`${key}__chunk_${i}`).catch(() => undefined);
    }
    return;
  }

  const chunks = Math.ceil(value.length / CHUNK_SIZE);
  for (let i = 0; i < chunks; i++) {
    const slice = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}__chunk_${i}`, slice, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  await SecureStore.setItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`, String(chunks), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await SecureStore.deleteItemAsync(key).catch(() => undefined);
}

async function secureRemove(key: string): Promise<void> {
  if (!IS_NATIVE) {
    await AsyncStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key).catch(() => undefined);
  const countRaw = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
  if (countRaw) {
    const count = Number.parseInt(countRaw, 10);
    if (Number.isFinite(count)) {
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${key}__chunk_${i}`).catch(() => undefined);
      }
    }
    await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`).catch(() => undefined);
  }
}

/** Migrate session blob from legacy AsyncStorage key to SecureStore. */
export async function migrateAuthStorageFromAsyncStorage(storageKey: string): Promise<boolean> {
  if (!IS_NATIVE) return false;
  try {
    const legacy = await AsyncStorage.getItem(storageKey);
    if (!legacy) return false;
    await secureSet(storageKey, legacy);
    await AsyncStorage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
}

export const secureAuthStorage: SupportedStorage = {
  getItem: async (key: string) => {
    await migrateAuthStorageFromAsyncStorage(key);
    return secureGet(key);
  },
  setItem: async (key: string, value: string) => {
    await secureSet(key, value);
    if (IS_NATIVE) {
      await AsyncStorage.removeItem(key).catch(() => undefined);
    }
  },
  removeItem: async (key: string) => {
    await secureRemove(key);
    await AsyncStorage.removeItem(key).catch(() => undefined);
  },
};
