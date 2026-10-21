import { Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";

import type { RootStackParamList } from "../../navigation/paramLists";
import { hasAuthenticatedDoctor, postOnboardingRouteCore } from "./mobileAuthGateCore";

export { hasAuthenticatedDoctor } from "./mobileAuthGateCore";

/** iOS / Android store builds — not Expo web landing. */
export function isNativeStoreApp(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

/**
 * Pilot: после установки врач регистрируется / входит, затем Main.
 * Web-сборка приложения (Expo web) — без обязательного входа.
 */
export function isMobileRegistrationRequired(): boolean {
  if (!isNativeStoreApp()) return false;
  const raw = (process.env.EXPO_PUBLIC_MOBILE_REQUIRE_REGISTRATION ?? "true").trim().toLowerCase();
  return !["false", "0", "no"].includes(raw);
}

/** Упрощённый UX: только email + пароль (без SMS/Telegram на первом экране). */
export function isMobileSimpleEmailAuth(): boolean {
  if (!isNativeStoreApp()) return false;
  const raw = (process.env.EXPO_PUBLIC_MOBILE_SIMPLE_EMAIL_AUTH ?? "true").trim().toLowerCase();
  return !["false", "0", "no"].includes(raw);
}

export function postOnboardingRoute(session: Session | null): keyof RootStackParamList {
  return postOnboardingRouteCore(session, isMobileRegistrationRequired());
}
