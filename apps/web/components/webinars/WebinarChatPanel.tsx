"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pin, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import type { WebinarChatMessageRow } from "@/lib/webinars/types";

type Props = {
  lessonId: string;
  sessionId: string | null;
  isHost: boolean;
  disabled?: boolean;
};

export function WebinarChatPanel({ lessonId, sessionId, isHost, disabled }: Props) {
  const [messages, setMessages] = useState<WebinarChatMessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/lessons/${lessonId}/webinar/chat`, { credentials: "same-origin" });
    const body = (await res.json()) as { ok?: boolean; messages?: WebinarChatMessageRow[]; error?: string };
    if (!res.ok || !body.ok) {
      setError(body.error ?? "Чат недоступен");
      setLoading(false);
      return;
    }
    setMessages(body.messages ?? []);
    setLoading(false);
  }, [lessonId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!sessionId) return;
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`webinar-chat-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "webinar_chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as WebinarChatMessageRow;
          if (row.is_hidden) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "webinar_chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as WebinarChatMessageRow;
          setMessages((prev) => {
            if (row.is_hidden) return prev.filter((m) => m.id !== row.id);
            return prev.map((m) => (m.id === row.id ? { ...m, ...row } : m));
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = draft.trim();
    if (!text || sending || disabled) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/lessons/${lessonId}/webinar/chat`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setError(body.error ?? "Не отправлено");
        return;
      }
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  async function moderate(messageId: string, patch: { isHidden?: boolean; isPinned?: boolean }) {
    await fetch(`/api/lessons/${lessonId}/webinar/chat`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId,
        isHidden: patch.isHidden,
        isPinned: patch.isPinned,
      }),
    });
  }

  return (
    <div className="flex h-full min-h-[320px] flex-col rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]">
      <div className="border-b border-[var(--clinical-border)] px-4 py-3">
        <p className="text-sm font-semibold">Чат эфира</p>
        <p className="text-[11px] text-[var(--clinical-foreground-muted)]">Без PHI · только учебные вопросы</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
          </p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[var(--clinical-foreground-muted)]">Задайте вопрос лектору.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl px-3 py-2 text-sm ${m.is_pinned ? "bg-amber-50 dark:bg-amber-950/30" : "bg-[var(--clinical-muted)]/60"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold text-[var(--clinical-primary-deep)]">
                  {m.author_display_name ?? "Врач"}
                  {m.is_pinned ? " · закреплено" : ""}
                </p>
                {isHost ? (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className="rounded p-1 text-slate-500 hover:bg-white/50"
                      title="Закрепить"
                      onClick={() => void moderate(m.id, { isPinned: !m.is_pinned })}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 text-slate-500 hover:bg-white/50"
                      title="Скрыть"
                      onClick={() => void moderate(m.id, { isHidden: true })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{m.body}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--clinical-border)] p-3">
        {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] px-3 py-2 text-sm"
            placeholder={disabled ? "Чат недоступен" : "Сообщение…"}
            value={draft}
            disabled={disabled || sending}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
          />
          <Button type="button" size="icon" disabled={disabled || sending || !draft.trim()} onClick={() => void sendMessage()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
