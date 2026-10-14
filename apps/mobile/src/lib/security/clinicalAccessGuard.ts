import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Mobile Web/PWA: SecureStore недоступен — блокируем доступ к PHI-модулям.
 * Native iOS/Android (Expo Go, dev client, store build) используют Keychain через secureAuthStorage.
 */
export function isMobileWebRuntime(): boolean {
  return Platform.OS === "web";
}

export function isNativeSecureStorageAvailable(): boolean {
  if (isMobileWebRuntime()) return false;
  return Platform.OS === "ios" || Platform.OS === "android";
}

export function canAccessClinicalPhi(): boolean {
  return isNativeSecureStorageAvailable();
}

/** Для подсказок на экране блокировки (без ПДн). */
export function getClinicalAccessRuntimeLabel(): string {
  if (isMobileWebRuntime()) return "mobile-web";
  return `${Platform.OS}-${Constants.executionEnvironment ?? "unknown"}`;
}

export const CLINICAL_WEB_BLOCK_MESSAGE_RU =
  "Клинические данные пациентов недоступны в браузерной версии мобильного приложения. Используйте установленное приложение (iOS/Android) или веб-версию на компьютере.";

export const CLINICAL_WEB_BLOCK_HINTS_RU: readonly string[] = [
  "Если вы открыли приложение в Safari или Chrome на телефоне — это веб-режим. Закройте вкладку и откройте проект в приложении Expo Go (QR с компьютера) или в установленной сборке SonoGyn Pro.",
  "На iPhone/Android в Expo Go и в сборке из App Store / APK клинический раздел доступен.",
  "Полная веб-клиника — с компьютера в браузере (не мобильная вкладка localhost).",
];
