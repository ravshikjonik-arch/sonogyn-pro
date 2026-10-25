"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuth, useSupabase } from "@/app/providers";
import { ChatMessageBubble, type ChatBubbleMessage } from "@/components/chat/ChatMessageBubble";
import { ChatMessageComposer } from "@/components/chat/ChatMessageComposer";
import { DoctorChatLoadPanel } from "@/components/chat/DoctorChatLoadPanel";
import { isDoctorChatV2EnabledClient } from "@/lib/chat/flags";
import {
  markDoctorChatOpenStart,
  measureDoctorChatOpenEnd,
} from "@/lib/chat/perf-baseline";
import {
  resolveDoctorChatLoadState,
  type DoctorChatLoadState,
} from "@/lib/chat/resolve-doctor-chat-load-state";
import { resolveAuthorNames } from "@/lib/chat/resolve-author-names";
import { resolveAuthorTrust, type AuthorTrustMap } from "@/lib/trust/resolve-author-trust";
import { fetchDoctorChatMessage } from "@/lib/chat/doctor-chat-client";
import { isRealtimePollingFallbackEnabledClient } from "@/lib/feature-flags/integration-rollout";
import { parseDoctorChatRealtimeRow } from "@/lib/messenger/realtime/parse-message-row";
import { requireOnlineForNetworkAction } from "@/lib/network/require-online-action";

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
  const { ready, user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [authorTrust, setAuthorTrust] = useState<AuthorTrustMap>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadState, setLoadState] = useState<DoctorChatLoadState | null>(null);
  const chatV2Preview = isDoctorChatV2EnabledClient();
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
    if (!ready) {
      if (!silent) setLoading(true);
      return;
    }

    if (!silent) {
      setLoading(true);
      markDoctorChatOpenStart();
    }
    setUserId(user?.id ?? null);

    const response = await fetch(`/api/doctor-chat/messages?channelId=${encodeURIComponent(channelId)}`);
    const payload = (await response.json().catch(() => null)) as
      | { messages?: RawMessage[]; authorNames?: Record<string, string>; error?: unknown }
      | null;

    if (!response.ok || !payload?.messages) {
      const message =
        typeof payload?.error === "string"
          ? payload.error
          : typeof payload?.error === "object" && payload?.error !== null
            ? JSON.stringify(payload.error)
            : "Не удалось загрузить чат";
      if (!user) {
        setLoadState(null);
        if (!silent) toast.error(message);
        if (!silent) setLoading(false);
        return;
      }
      const panel = resolveDoctorChatLoadState({
        hasUser: Boolean(user),
        httpStatus: response.status,
        errorMessage: message,
      });
      setLoadState(panel);
      setMessages([]);
      if (!silent) {
        if (panel?.kind === "migration") toast.error("Чат: примените миграции Supabase");
        else if (panel?.kind === "community_access") toast.message("Нужен статус врача или ординатора");
      }
      if (!silent) setLoading(false);
      return;
    }
    setLoadState(null);

    const rows = payload.messages;
    setMessages(enrich(rows));
    if (!silent) measureDoctorChatOpenEnd(rows.length);
    if (payload.authorNames) setAuthorNames(payload.authorNames);
    const ids = rows.map((r) => r.author_id);
    if (user) {
      const trust = await resolveAuthorTrust(supabase, ids);
      setAuthorTrust(trust);
    } else {
      setAuthorTrust({});
    }
    if (!silent) setLoading(false);
  }, [channelId, enrich, ready, supabase, user]);

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

  const pollingFallback = isRealtimePollingFallbackEnabledClient();

  useEffect(() => {
    if (!pollingFallback && user) return;
    const id = window.setInterval(() => {
      void load(true);
    }, 10000);
    return () => window.clearInterval(id);
  }, [load, pollingFallback, user]);

  const ingestDoctorRow = useCallback(
    async (messageId: string) => {
      const row = await fetchDoctorChatMessage(channelId, messageId);
      if (!row) {
        await load(true);
        return;
      }
      const [bubble] = enrich([row]);
      setMessages((prev) => {
        if (prev.some((m) => m.id === bubble.id)) return prev;
        return [...prev, bubble].sort((a, b) => a.created_at.localeCompare(b.created_at));
      });
      const [names, trust] = await Promise.all([
        resolveAuthorNames(supabase, [row.author_id]),
        resolveAuthorTrust(supabase, [row.author_id]),
      ]);
      setAuthorNames((prev) => ({ ...prev, ...names }));
      setAuthorTrust((prev) => ({ ...prev, ...trust }));
    },
    [channelId, enrich, load, supabase],
  );

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
    if (!ready || !user) return;

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
        async (payload) => {
          const row = parseDoctorChatRealtimeRow(payload.new);
          if (row) await ingestDoctorRow(row.id);
          else if (pollingFallback) await load(true);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelId, ingestDoctorRow, pollingFallback, load, ready, supabase, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const mine = useMemo(() => new Set(userId ? [userId] : []), [userId]);

  async function handleSend({ text, file }: { text: string; file: File | null }) {
    let attachment = file;
    if (!userId && attachment) {
      toast.message("Фото и видео можно прикрепить после входа. Текст отправляется сразу.");
      attachment = null;
      if (!text.trim()) return false;
    }
    const offline = requireOnlineForNetworkAction();
    if (offline) {
      toast.error(offline);
      return false;
    }
    setSending(true);
    try {
      let media_storage_path: string | null = null;
      let media_type: "image" | "video" | null = null;

      if (attachment) {
        const form = new FormData();
        form.append("scope", "channel");
        form.append("scopeId", channelId);
        form.append("file", attachment);
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
      const [names, trust] = await Promise.all([
        resolveAuthorNames(supabase, [payload.message.author_id]),
        resolveAuthorTrust(supabase, [payload.message.author_id]),
      ]);
      setAuthorNames((prev) => ({ ...prev, ...names }));
      setAuthorTrust((prev) => ({ ...prev, ...trust }));
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
            <p className="text-sm font-black text-[var(--clinical-foreground)]">
              {channelTitle}
              {chatV2Preview ? (
                <span className="ml-2 rounded-md bg-[var(--clinical-primary-muted)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                  Chat v2 · preview
                </span>
              ) : null}
            </p>
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
        {loadState ? (
          <DoctorChatLoadPanel state={loadState} />
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
              authorVerified={authorTrust[msg.author_id]?.isVerified ?? false}
              isMine={mine.has(msg.author_id)}
            />
          ))
        )}
      </div>

      {!loadState ? (
        <div className="doctor-chat-composer border-t border-[var(--clinical-border)] p-4">
          <ChatMessageComposer busy={sending} onSend={handleSend} />
        </div>
      ) : null}
    </div>
  );
}
