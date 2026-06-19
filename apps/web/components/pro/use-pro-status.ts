"use client";

import { useEffect, useState } from "react";

import { hasProEntitlement } from "@/lib/subscription/access";

type ProStatus = { isPro: boolean; loading: boolean };

let cache: boolean | null = null;

/** Клиентский PRO-статус из /api/profile (с лёгким кэшем на сессию). */
export function useProStatus(): ProStatus {
  const [isPro, setIsPro] = useState<boolean>(cache ?? false);
  const [loading, setLoading] = useState<boolean>(cache === null);

  useEffect(() => {
    if (cache !== null) return;
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          profile?: { subscription_tier?: string; trial_ends_at?: string | null };
        };
        const pro = json.profile
          ? hasProEntitlement({
              subscription_tier: json.profile.subscription_tier ?? "free",
              trial_ends_at: json.profile.trial_ends_at ?? null,
            })
          : false;
        cache = pro;
        if (active) setIsPro(pro);
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { isPro, loading };
}
