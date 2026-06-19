import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { supabaseMobile } from "../lib/supabase/mobileClient";
import { markSessionAnchorNow, readSessionAnchor } from "../lib/security/sessionAnchor";
import { wipeMobileClinicalLocalData } from "../lib/security/wipeClinicalLocal";

const STORAGE_KEY = "sonogyn_last_online_verify_v1";
const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000;

async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return true;
  }
}

async function forceSignOut(): Promise<void> {
  await wipeMobileClinicalLocalData();
  await supabaseMobile?.auth.signOut();
}

/** 24h offline policy для клинических данных (mobile). */
export function useSessionRevalidation(enabled: boolean): void {
  const checking = useRef(false);

  useEffect(() => {
    if (!enabled || !supabaseMobile) return;

    async function revalidate() {
      if (checking.current) return;
      checking.current = true;
      try {
        const online = await isOnline();
        const lastRaw = await AsyncStorage.getItem(STORAGE_KEY);
        const last = lastRaw ? Number.parseInt(lastRaw, 10) : 0;
        const now = Date.now();

        if (!online) {
          const anchor = last > 0 ? last : await readSessionAnchor();
          if (anchor > 0 && now - anchor > MAX_OFFLINE_MS) {
            await forceSignOut();
            return;
          }
          if (anchor === 0 && supabaseMobile) {
            const { data } = await supabaseMobile.auth.getSession();
            const iso = data.session?.user?.last_sign_in_at ?? data.session?.user?.created_at;
            const sessionAnchor = iso ? new Date(iso).getTime() : 0;
            if (sessionAnchor > 0 && now - sessionAnchor > MAX_OFFLINE_MS) {
              await forceSignOut();
            }
          }
          return;
        }

        const { data, error } = await supabaseMobile.auth.getUser();
        if (error || !data.user) {
          await forceSignOut();
          return;
        }

        await AsyncStorage.setItem(STORAGE_KEY, String(now));
        await markSessionAnchorNow();
      } finally {
        checking.current = false;
      }
    }

    void revalidate();
    const appSub = AppState.addEventListener("change", (state) => {
      if (state === "active") void revalidate();
    });
    const timer = setInterval(() => void revalidate(), 5 * 60_000);

    return () => {
      appSub.remove();
      clearInterval(timer);
    };
  }, [enabled]);
}
