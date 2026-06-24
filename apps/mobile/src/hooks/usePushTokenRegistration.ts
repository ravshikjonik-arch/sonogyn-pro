import { useEffect, useRef } from "react";

import { registerPushTokenWithSupabase } from "../lib/push/registerPushToken";

/**
 * Registers Expo push token in Supabase after Supabase login.
 * Safe to call on every session change — upserts idempotently.
 */
export function usePushTokenRegistration(userId: string | null | undefined): void {
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      lastUserId.current = null;
      return;
    }
    if (lastUserId.current === userId) return;
    lastUserId.current = userId;
    void registerPushTokenWithSupabase(userId);
  }, [userId]);
}
