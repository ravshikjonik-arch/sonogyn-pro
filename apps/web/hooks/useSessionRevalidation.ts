"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useSupabase } from "@/app/providers";
import { markSessionAnchorNow, readSessionAnchor } from "@/lib/security/session-anchor";
import { wipeWebClinicalLocalData } from "@/lib/security/wipe-clinical-local";

const STORAGE_KEY = "sonogyn_last_online_verify_v1";
/** Мед. данные: принудительная онлайн-проверка раз в 24 ч */
export const MAX_OFFLINE_SESSION_MS = 24 * 60 * 60 * 1000;

function readLastVerified(): number {
  if (typeof window === "undefined") return Date.now();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function writeLastVerified(ts: number): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(ts));
  } catch {
    /* private mode */
  }
}

async function forceClinicalSignOut(
  supabase: ReturnType<typeof useSupabase>,
  router: ReturnType<typeof useRouter>,
  reason: string,
) {
  wipeWebClinicalLocalData();
  try {
    await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin" });
  } catch {
    /* offline */
  }
  await supabase.auth.signOut();
  router.replace(`/login?reason=${encodeURIComponent(reason)}`);
  router.refresh();
}

/**
 * Клиническая зона: при долгом офлайне или невалидной сессии — выход.
 * При появлении сети — getUser() (server-validated JWT).
 */
export function useSessionRevalidation(enabled: boolean): void {
  const supabase = useSupabase();
  const router = useRouter();
  const checking = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    async function revalidate() {
      if (checking.current) return;
      checking.current = true;
      try {
        const now = Date.now();
        const last = readLastVerified();

        if (!navigator.onLine) {
          const anchor = last > 0 ? last : readSessionAnchor();
          if (anchor > 0 && now - anchor > MAX_OFFLINE_SESSION_MS) {
            await forceClinicalSignOut(supabase, router, "offline-expired");
          } else if (anchor === 0) {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            const iso = session?.user?.last_sign_in_at ?? session?.user?.created_at;
            const sessionAnchor = iso ? new Date(iso).getTime() : 0;
            if (sessionAnchor > 0 && now - sessionAnchor > MAX_OFFLINE_SESSION_MS) {
              await forceClinicalSignOut(supabase, router, "offline-expired");
            }
          }
          return;
        }

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          await forceClinicalSignOut(supabase, router, "session-expired");
          return;
        }

        writeLastVerified(now);
        markSessionAnchorNow();
      } finally {
        checking.current = false;
      }
    }

    void revalidate();
    const onOnline = () => void revalidate();
    window.addEventListener("online", onOnline);
    const timer = window.setInterval(() => void revalidate(), 5 * 60_000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.clearInterval(timer);
    };
  }, [enabled, router, supabase]);
}
