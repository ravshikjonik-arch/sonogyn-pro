"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth, useSupabase } from "@/app/providers";
import {
  splitPresenceRows,
  type DoctorPresenceMember,
  type DoctorPresenceRow,
} from "@/lib/chat/presence";

const HEARTBEAT_MS = 45_000;

export function useDoctorPresence() {
  const supabase = useSupabase();
  const { user, ready } = useAuth();
  const [rows, setRows] = useState<DoctorPresenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/doctor-presence", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as
      | { rows?: DoctorPresenceRow[]; error?: string }
      | null;

    if (!response.ok || !payload?.rows) {
      const message = payload?.error ?? "Не удалось загрузить presence";
      if (message.includes("doctor_presence")) {
        setError("Примените миграцию doctor_presence в Supabase.");
      } else {
        setError(message);
      }
      setRows([]);
      setLoading(false);
      return;
    }

    setError(null);
    setRows(payload.rows);
    setLoading(false);
  }, []);

  const pulse = useCallback(async () => {
    if (!user) return;
    await fetch("/api/doctor-presence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "online" }),
    });
  }, [user]);

  const goOffline = useCallback(async () => {
    if (!user) return;
    await fetch("/api/doctor-presence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "offline" }),
    });
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("doctor_presence_roster")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "doctor_presence" },
        () => void load(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  useEffect(() => {
    if (!user || !ready) return;

    void pulse();
    const timer = window.setInterval(() => void pulse(), HEARTBEAT_MS);

    const onHide = () => {
      if (document.visibilityState === "hidden") void goOffline();
      else void pulse();
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      void goOffline();
    };
  }, [user, ready, pulse, goOffline]);

  const { online, offline } = useMemo(() => splitPresenceRows(rows), [rows]);

  return {
    loading,
    error,
    online,
    offline,
    onlineCount: online.length,
    offlineCount: offline.length,
    totalCount: rows.length,
    currentUserId: user?.id ?? null,
  };
}

export type { DoctorPresenceMember };
