"use client";

import type { RealtimeChannel, RealtimePostgresChangesPayload, SupabaseClient } from "@supabase/supabase-js";
import type { MutableRefObject } from "react";
import { useEffect, useRef } from "react";

import { parseMessengerRealtimeRow } from "@/lib/messenger/realtime/parse-message-row";

export const MESSENGER_TYPING_EVENT = "messenger:typing";

export type MessengerTypingPayload = {
  userId: string;
  chatId: string;
  at: number;
};

type Handlers = {
  onMessageInsert?: (row: ReturnType<typeof parseMessengerRealtimeRow>) => void;
  onMessageUpdate?: (row: ReturnType<typeof parseMessengerRealtimeRow>) => void;
  onTyping?: (payload: MessengerTypingPayload) => void;
  onSubscribed?: () => void;
  onDisconnected?: () => void;
};

/**
 * One Realtime channel per messenger chat: postgres_changes + typing broadcast.
 */
export function useMessengerRealtime(
  supabase: SupabaseClient,
  chatId: string | null,
  enabled: boolean,
  handlers: Handlers,
  channelRef?: MutableRefObject<RealtimeChannel | null>,
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled || !chatId) return;

    let channel: RealtimeChannel | null = null;

    channel = supabase.channel(`messenger_room:${chatId}`, {
      config: { broadcast: { self: false } },
    });
    if (channelRef) channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messenger_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = parseMessengerRealtimeRow(payload.new);
          if (row) handlersRef.current.onMessageInsert?.(row);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messenger_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = parseMessengerRealtimeRow(payload.new);
          if (row) handlersRef.current.onMessageUpdate?.(row);
        },
      )
      .on("broadcast", { event: MESSENGER_TYPING_EVENT }, ({ payload }) => {
        const p = payload as MessengerTypingPayload | undefined;
        if (p?.userId && p.chatId === chatId) handlersRef.current.onTyping?.(p);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") handlersRef.current.onSubscribed?.();
        if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          handlersRef.current.onDisconnected?.();
        }
      });

    return () => {
      if (channelRef) channelRef.current = null;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [channelRef, chatId, enabled, supabase]);
}

export function sendMessengerTypingBroadcast(
  channel: RealtimeChannel | null,
  chatId: string,
  userId: string,
): void {
  if (!channel) return;
  void channel.send({
    type: "broadcast",
    event: MESSENGER_TYPING_EVENT,
    payload: { userId, chatId, at: Date.now() } satisfies MessengerTypingPayload,
  });
}
