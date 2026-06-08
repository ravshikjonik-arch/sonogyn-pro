import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { Platform } from "react-native";

/** Metro resolves `@firebase/auth` to RN build; web typings omit this export. */
function getReactNativePersistenceCompat() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@firebase/auth") as {
    getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
  };
  return mod.getReactNativePersistence(AsyncStorage);
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function createAuthInstance(app: FirebaseApp): Auth {
  if (Platform.OS === "web") {
    return getAuth(app);
  }
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistenceCompat() as never,
    });
  } catch {
    return getAuth(app);
  }
}

let bootAttempted = false;
let firebaseApp: FirebaseApp | null = null;
let authCache: Auth | null = null;
let firestoreCache: Firestore | null = null;
let storageCache: FirebaseStorage | null = null;

function ensureFirebaseBootstrapped(): void {
  if (bootAttempted) return;
  bootAttempted = true;

  const apiKey = firebaseConfig.apiKey;
  const projectId = firebaseConfig.projectId;
  const hasRequired =
    typeof apiKey === "string" &&
    apiKey.trim().length > 0 &&
    typeof projectId === "string" &&
    projectId.trim().length > 0;

  if (!hasRequired) {
    const missing = Object.entries(firebaseConfig)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    console.warn(
      `[Firebase] Инициализация пропущена (нет apiKey/projectId). Поля без значения: ${missing.join(", ") || "проверьте .env"}`,
    );
    return;
  }

  try {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    authCache = createAuthInstance(firebaseApp);
    firestoreCache = getFirestore(firebaseApp);
    storageCache = getStorage(firebaseApp);
  } catch (e) {
    console.error("[Firebase] Ошибка при initializeApp / подключении сервисов:", e);
    firebaseApp = null;
    authCache = null;
    firestoreCache = null;
    storageCache = null;
  }
}

const FB_HINT =
  "Проверьте .env в корне проекта (EXPO_PUBLIC_FIREBASE_API_KEY, EXPO_PUBLIC_FIREBASE_PROJECT_ID, …) и перезапустите Expo.";

export function requireAuth(): Auth {
  ensureFirebaseBootstrapped();
  if (!authCache) {
    throw new Error(`Firebase Auth недоступен. ${FB_HINT}`);
  }
  return authCache;
}

export function requireFirestore(): Firestore {
  ensureFirebaseBootstrapped();
  if (!firestoreCache) {
    throw new Error(`Firestore недоступен. ${FB_HINT}`);
  }
  return firestoreCache;
}

export function requireStorage(): FirebaseStorage {
  ensureFirebaseBootstrapped();
  if (!storageCache) {
    throw new Error(`Firebase Storage недоступен. ${FB_HINT}`);
  }
  return storageCache;
}
