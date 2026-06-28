/**
 * Абстракция над шифрованным хранилищем.
 * На мобильных платформах использует expo-secure-store (Keychain / Android Keystore).
 * На Web (expo-secure-store не поддерживается) — fallback на AsyncStorage с предупреждением.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const IS_MOBILE = Platform.OS === "ios" || Platform.OS === "android";
const ENCRYPTED_KEY_PREFIX = "elasto_enc_";

function securityLog(message: string, level: "warn" | "error" = "warn") {
  const timestamp = new Date().toISOString();
  if (level === "error") {
    console.error(`[Security] ${timestamp}: ${message}`);
  } else {
    console.warn(`[Security] ${timestamp}: ${message}`);
  }
}

function storageKeyFor(key: string): string {
  return ENCRYPTED_KEY_PREFIX + key.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Сохранить зашифрованные данные.
 * На мобильных — SecureStore с привязкой к Keychain / Keystore.
 * На Web — AsyncStorage (с предупреждением в консоль).
 */
export async function encryptedSet(key: string, value: string): Promise<void> {
  const storageKey = storageKeyFor(key);

  if (IS_MOBILE) {
    try {
      await SecureStore.setItemAsync(storageKey, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        requireAuthentication: false,
      });
    } catch (err) {
      securityLog(`SecureStore.setItemAsync failed for key "${key}": ${String(err)}`, "error");
      throw new Error("Не удалось сохранить данные в защищённом хранилище");
    }
  } else {
    securityLog(`Используется незащищённое хранилище для ключа "${key}" (веб-платформа)`);
    await AsyncStorage.setItem(storageKey, value);
  }
}

/**
 * Прочитать зашифрованные данные.
 * Если данных нет — возвращает null (не выбрасывает ошибку).
 */
export async function encryptedGet(key: string): Promise<string | null> {
  const storageKey = storageKeyFor(key);

  if (IS_MOBILE) {
    try {
      return await SecureStore.getItemAsync(storageKey);
    } catch (err) {
      securityLog(`SecureStore.getItemAsync failed for key "${key}": ${String(err)}`, "error");
      return null;
    }
  }

  return AsyncStorage.getItem(storageKey);
}

/** Удалить зашифрованные данные. */
export async function encryptedRemove(key: string): Promise<void> {
  const storageKey = storageKeyFor(key);

  if (IS_MOBILE) {
    try {
      await SecureStore.deleteItemAsync(storageKey);
    } catch (err) {
      securityLog(`SecureStore.deleteItemAsync failed for key "${key}": ${String(err)}`, "error");
    }
  } else {
    await AsyncStorage.removeItem(storageKey);
  }
}

/** Проверить доступность шифрованного хранилища. */
export async function isEncryptedStorageAvailable(): Promise<boolean> {
  if (!IS_MOBILE) return false;

  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Миграция: перенести данные из открытого AsyncStorage в защищённое хранилище.
 * Вызывается один раз при обновлении приложения.
 */
export async function migrateFromAsyncStorage(oldKey: string, newKey: string): Promise<boolean> {
  try {
    const oldData = await AsyncStorage.getItem(oldKey);
    if (!oldData) return false;

    await encryptedSet(newKey, oldData);
    await AsyncStorage.removeItem(oldKey);

    securityLog(`Успешно мигрированы данные: "${oldKey}" → "${newKey}"`);
    return true;
  } catch (err) {
    securityLog(`Ошибка миграции "${oldKey}" → "${newKey}": ${String(err)}`, "error");
    return false;
  }
}
