"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/app/providers";
import { isFullOpenAccessEnabledClient } from "@/lib/auth/guest-demo-account";

const STORAGE_KEY = "sonogyn-guest-demo-attempted";

/** Ensures invisible Supabase session for open-access mode (AI, chat, cases). */
export function GuestDemoBootstrap() {
  const { user, ready, refresh } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (!ready || user || started.current) return;
    if (!isFullOpenAccessEnabledClient()) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1") return;

    started.current = true;

    void fetch("/api/auth/guest-session", { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return;
        if (typeof window !== "undefined") sessionStorage.setItem(STORAGE_KEY, "1");
        await refresh();
      })
      .catch(() => {
        /* soft fail — calculators still work */
      });
  }, [ready, user, refresh]);

  return null;
}
