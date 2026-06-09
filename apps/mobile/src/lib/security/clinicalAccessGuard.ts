import { Platform } from "react-native";

/**
 * Mobile Web/PWA: SecureStore недоступен — блокируем доступ к PHI-модулям.
 * Native iOS/Android используют Keychain через secureAuthStorage.
 */
export function isNativeSecureStorageAvailable(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

export function canAccessClinicalPhi(): boolean {
  return isNativeSecureStorageAvailable();
}

export const CLINICAL_WEB_BLOCK_MESSAGE_RU =
  "Клинические данные пациентов недоступны в браузерной версии мобильного приложения. Используйте установленное приложение (iOS/Android) или веб-версию на компьютере.";
