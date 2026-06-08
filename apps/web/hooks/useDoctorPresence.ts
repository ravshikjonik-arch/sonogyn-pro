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
    const { data, error: qErr } = await supabase
      .from("doctor_presence")
      .select("user_id,display_name,status,last_seen_at,updated_at")
      .order("last_seen_at", { ascending: false });

    if (qErr) {
      if (qErr.message.includes("doctor_presence") || qErr.code === "42P01") {
        setError("Примените миграцию doctor_presence в Supabase.");
      } else {
        setError(qErr.message);
      }
      setRows([]);
      setLoading(false);
      return;
    }

    setError(null);
    setRows((data ?? []) as DoctorPresenceRow[]);
    setLoading(false);
  }, [supabase]);

  const pulse = useCallback(async () => {
    if (!user) return;

    let displayName =
      typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
    if (!displayName) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "Врач";
    }

    await supabase.from("doctor_presence").upsert(
      {
        user_id: user.id,
        display_name: displayName,
        status: "online",
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  }, [supabase, user]);

  const goOffline = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("doctor_presence")
      .update({
        status: "offline",
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }, [supabase, user]);

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
