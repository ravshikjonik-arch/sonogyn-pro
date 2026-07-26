import { isMessageNotificationsEnabled, parseClinicalPreferences } from "@repo/types";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { supabaseMobile } from "../supabase/mobileClient";

/** Foreground notification display. Tap routing: usePushNotificationNavigation. */
export function configurePushNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Remove stored Expo tokens for user (opt-out from message push). */
export async function unregisterPushTokensForUser(userId: string): Promise<void> {
  if (!supabaseMobile) return;
  const { error } = await supabaseMobile.from("user_push_tokens").delete().eq("user_id", userId);
  if (error) console.warn("[push] delete tokens failed", error.message);
}

/**
 * Request Expo push token and upsert into Supabase `user_push_tokens`.
 * No-op on web, simulator without push, or without Supabase session config.
 * Respects profiles.clinical_preferences.notifications.messagesEnabled.
 */
export async function registerPushTokenWithSupabase(userId: string): Promise<boolean> {
  if (!supabaseMobile) {
    if (__DEV__) console.info("[push] skip — Supabase not configured");
    return false;
  }

  if (Platform.OS === "web") {
    if (__DEV__) console.info("[push] skip — web platform");
    return false;
  }

  if (!Device.isDevice) {
    if (__DEV__) console.info("[push] skip — not a physical device");
    return false;
  }

  const { data: profile } = await supabaseMobile
    .from("profiles")
    .select("clinical_preferences")
    .eq("id", userId)
    .maybeSingle();
  if (!isMessageNotificationsEnabled(parseClinicalPreferences(profile?.clinical_preferences))) {
    if (__DEV__) console.info("[push] skip — messagesEnabled=false");
    return false;
  }

  configurePushNotificationHandler();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    if (__DEV__) console.info("[push] skip — notification permission denied");
    return false;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  if (!projectId) {
    console.warn("[push] missing expo.extra.eas.projectId in app.json");
    return false;
  }

  let token: string;
  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    token = tokenResult.data;
  } catch (err) {
    console.warn("[push] getExpoPushTokenAsync failed", err);
    return false;
  }

  const { error } = await supabaseMobile.from("user_push_tokens").upsert(
    {
      user_id: userId,
      expo_push_token: token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,expo_push_token" },
  );

  if (error) {
    console.warn("[push] upsert user_push_tokens failed", error.message);
    return false;
  }

  if (__DEV__) console.info("[push] token registered for user", userId.slice(0, 8));
  return true;
}
