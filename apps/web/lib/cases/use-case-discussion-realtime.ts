"use client";

import type { RealtimeChannel, RealtimePostgresChangesPayload, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";

type CaseDiscussionRealtimeHandlers = {
  onCommentInsert?: (row: unknown) => void;
  onCommentUpdate?: (row: unknown) => void;
  onReactionChange?: (row: unknown) => void;
  onLifecycleEvent?: (row: unknown) => void;
  onPresenceChange?: (row: unknown) => void;
  onNotification?: (row: unknown) => void;
  onSubscribed?: () => void;
};

/**
 * Single scoped Realtime channel per case discussion room.
 * Cleans up on unmount — no global table subscriptions.
 */
export function useCaseDiscussionRealtime(
  supabase: SupabaseClient,
  caseId: string | null,
  enabled: boolean,
  handlers: CaseDiscussionRealtimeHandlers,
) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled || !caseId) return;

    let channel: RealtimeChannel | null = null;

    channel = supabase
      .channel(`case_discussion:${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "teaching_case_comments",
          filter: `case_id=eq.${caseId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          handlersRef.current.onCommentInsert?.(payload.new);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "teaching_case_comments",
          filter: `case_id=eq.${caseId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          handlersRef.current.onCommentUpdate?.(payload.new);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teaching_case_comment_reactions",
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          handlersRef.current.onReactionChange?.(payload.new ?? payload.old);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "case_lifecycle_events",
          filter: `case_id=eq.${caseId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          handlersRef.current.onLifecycleEvent?.(payload.new);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_discussion_presence",
          filter: `case_id=eq.${caseId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          handlersRef.current.onPresenceChange?.(payload.new ?? payload.old);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") handlersRef.current.onSubscribed?.();
      });

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [caseId, enabled, supabase]);
}
