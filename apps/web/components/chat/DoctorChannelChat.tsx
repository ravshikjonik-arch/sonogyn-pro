"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuth, useSupabase } from "@/app/providers";
import { ChatMessageBubble, type ChatBubbleMessage } from "@/components/chat/ChatMessageBubble";
import { ChatMessageComposer } from "@/components/chat/ChatMessageComposer";
import { resolveAuthorNames } from "@/lib/chat/resolve-author-names";

type RawMessage = {
  id: string;
  channel_id: string;
  author_id: string;
  body: string | null;
  media_storage_path: string | null;
  media_type: "image" | "video" | null;
  media_url?: string | null;
  created_at: string;
};

type Props = {
  channelId: string;
  channelTitle: string;
  channelDescription?: string;
};

export function DoctorChannelChat({ channelId, channelTitle, channelDescription }: Props) {
  const supabase = useSupabase();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  const enrich = useCallback(
    (rows: RawMessage[]) => {
      const enriched: ChatBubbleMessage[] = rows.map((row) => ({
          id: row.id,
          body: row.body,
          author_id: row.author_id,
          created_at: row.created_at,
          media_type: row.media_type,
          media_url: row.media_url ?? null,
        }));
      return enriched;
    },
    [],
  );

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setUserId(user?.id ?? null);

    const response = await fetch(`/api/doctor-chat/messages?channelId=${encodeURIComponent(channelId)}`);
    const payload = (await response.json().catch(() => null)) as
      | { messages?: RawMessage[]; error?: unknown }
      | null;

    if (!response.ok || !payload?.messages) {
      const message = typeof payload?.error === "string" ? payload.error : "Не удалось загрузить чат";
      const hint =
        message.includes("doctor_chat")
          ? "Примените BUNDLE_COMMUNITY_CHAT_ONLY.sql в Supabase SQL Editor."
          : message;
      setLoadError(hint);
      toast.error("Чат: нужна миграция Supabase");
      setMessages([]);
      if (!silent) setLoading(false);
      return;
    }
    setLoadError(null);

    const rows = payload.messages;
    setMessages(enrich(rows));
    setAuthorNames(await resolveAuthorNames(supabase, rows.map((r) => r.author_id)));
    if (!silent) setLoading(false);
  }, [channelId, enrich, supabase, user?.id]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    if (!user?.id) {
      setPushSubscribed(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("channel_subscriptions")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("channel_id", channelId)
        .maybeSingle();
      if (!cancelled) setPushSubscribed(Boolean(data));
    })();
    return () => {
      cancelled = true;
    };
  }, [channelId, supabase, user?.id]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void load(true);
    }, 10000);
    return () => window.clearInterval(id);
  }, [load]);

  async function togglePushSubscription() {
    if (!userId) {
      toast.message("Нужна авторизация");
      return;
    }
    setPushBusy(true);
    try {
      const response = await fetch("/api/doctor-chat/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { subscribed?: boolean; error?: string }
        | null;
      if (!response.ok) {
        toast.error(payload?.error ?? "Не удалось изменить подписку");
        return;
      }
      const next = Boolean(payload?.subscribed);
      setPushSubscribed(next);
      toast.success(
        next
          ? "Push на сообщения канала включён (на телефон с приложением)"
          : "Push на этот канал отключён",
      );
    } finally {
      setPushBusy(false);
    }
  }

  useEffect(() => {
    const channel = supabase
      .channel(`doctor_chat:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "doctor_chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async () => {
          await load(true);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelId, enrich, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const mine = useMemo(() => new Set(userId ? [userId] : []), [userId]);

  async function handleSend({ text, file }: { text: string; file: File | null }) {
    if (!userId) {
      toast.message("Нужна авторизация");
      return false;
    }
    setSending(true);
    try {
      let media_storage_path: string | null = null;
      let media_type: "image" | "video" | null = null;

      if (file) {
        const form = new FormData();
        form.append("scope", "channel");
        form.append("scopeId", channelId);
        form.append("file", file);
        const uploadResponse = await fetch("/api/doctor-chat/media", {
          method: "POST",
          body: form,
        });
        const uploaded = (await uploadResponse.json().catch(() => null)) as
          | { storagePath?: string; mediaType?: "image" | "video"; error?: string }
          | null;
        if (!uploadResponse.ok || !uploaded?.storagePath || !uploaded.mediaType) {
          toast.error(uploaded?.error ?? "Не удалось загрузить файл");
          return false;
        }
        media_storage_path = uploaded.storagePath;
        media_type = uploaded.mediaType;
      }

      const response = await fetch("/api/doctor-chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          body: text || null,
          media_storage_path,
          media_type,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: RawMessage; autoSubscribed?: boolean; error?: unknown }
        | null;

      if (!response.ok || !payload?.message) {
        toast.error(typeof payload?.error === "string" ? payload.error : "Не удалось отправить сообщение");
        return false;
      }
      const [bubble] = enrich([payload.message]);
      setMessages((prev) => [...prev.filter((m) => m.id !== bubble.id), bubble]);
      const names = await resolveAuthorNames(supabase, [payload.message.author_id]);
      setAuthorNames((prev) => ({ ...prev, ...names }));
      if (payload.autoSubscribed) {
        setPushSubscribed(true);
        toast.success("Отправлено · push на ответы канала включён");
      } else {
        toast.success("Сообщение отправлено");
      }
      return true;
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="doctor-chat-panel flex min-h-[520px] flex-col rounded-2xl border border-[var(--clinical-border)] shadow-sm">
      <div className="border-b border-[var(--clinical-border)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-[var(--clinical-foreground)]">{channelTitle}</p>
            {channelDescription ? (
              <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{channelDescription}</p>
            ) : null}
            <p className="mt-1 text-[11px] text-[var(--clinical-foreground-muted)]">
              Push приходит на телефон (Expo), если подписаны. В браузере — только открытый чат.
            </p>
          </div>
          {userId ? (
            <button
              type="button"
              disabled={pushBusy}
              onClick={() => void togglePushSubscription()}
              className="shrink-0 rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-1.5 text-xs font-semibold text-[var(--clinical-foreground)] hover:bg-[var(--clinical-muted)] disabled:opacity-60"
            >
              {pushSubscribed ? "Push · вкл" : "Подписаться на push"}
            </button>
          ) : null}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="doctor-chat-messages flex-1 space-y-3 overflow-y-auto p-4"
      >
        {loadError ? (
          <div className="rounded-xl border border-amber-300/70 bg-amber-50/90 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-bold">Чат пока не подключён к базе</p>
            <p className="mt-2 text-xs leading-relaxed">{loadError}</p>
            <p className="mt-2 text-xs">
              Файл: <code className="rounded bg-black/10 px-1">apps/web/supabase/BUNDLE_COMMUNITY_CHAT_ONLY.sql</code>
            </p>
          </div>
        ) : loading ? (
          <p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка сообщений…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Напишите первым — можно прикрепить фото или видео УЗИ (без PHI).
          </p>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              authorName={authorNames[msg.author_id] ?? "Коллега"}
              isMine={mine.has(msg.author_id)}
            />
          ))
        )}
      </div>

      {!loadError && userId ? (
        <div className="doctor-chat-composer border-t border-[var(--clinical-border)] p-4">
          <ChatMessageComposer busy={sending} onSend={handleSend} />
        </div>
      ) : null}
    </div>
  );
}
