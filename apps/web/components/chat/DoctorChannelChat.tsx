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
import { prepareOutgoingImage } from "@/lib/chat/prepare-outgoing-image";
import { encodeReplyQuote, parseReplyQuote } from "@/lib/chat/reply-quote";
import { uploadChatMedia } from "@/lib/chat/upload-chat-media";
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
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState<{ excerpt: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [galleryUrl, setGalleryUrl] = useState<string | null>(null);
  const [ownIds, setOwnIds] = useState<string[]>([]);
  const searchRef = useRef("");
  const uploadAbortRef = useRef<AbortController | null>(null);

  const enrich = useCallback(
    (rows: RawMessage[]) => {
      const enriched: ChatBubbleMessage[] = rows.map((row) => ({
          id: row.id,
          body: row.body,
          author_id: row.author_id,
          created_at: row.created_at,
          media_type: row.media_type,
          media_url: row.media_url ?? null,
          voice: (row.media_storage_path ?? "").includes("/voice-"),
          send_status: "delivered",
        }));
      return enriched;
    },
    [],
  );

  const load = useCallback(async (silent = false, before?: string) => {
    if (!ready) {
      if (!silent) setLoading(true);
      return;
    }

    if (before) setLoadingOlder(true);
    else if (!silent) {
      setLoading(true);
      markDoctorChatOpenStart();
    }
    setUserId(user?.id ?? null);

    const params = new URLSearchParams({ channelId });
    if (before) params.set("before", before);
    const q = searchRef.current.trim();
    if (q) params.set("q", q);
    const response = await fetch(`/api/doctor-chat/messages?${params.toString()}`);
    const payload = (await response.json().catch(() => null)) as
      | { messages?: RawMessage[]; authorNames?: Record<string, string>; hasMore?: boolean; error?: unknown }
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
        setLoadingOlder(false);
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
      setLoadingOlder(false);
      return;
    }
    setLoadState(null);
    setHasMore(Boolean(payload.hasMore));

    const rows = payload.messages;
    const server = enrich(rows);
    setMessages((prev) => {
      if (before) {
        const known = new Set(prev.map((item) => item.id));
        return [...server.filter((item) => !known.has(item.id)), ...prev];
      }
      const pending = prev.filter(
        (item) => item.id.startsWith("local-") && !server.some((row) => row.id === item.id),
      );
      return [...server, ...pending];
    });
    if (!silent && !before) measureDoctorChatOpenEnd(rows.length);
    if (payload.authorNames) {
      setAuthorNames((prev) => ({ ...prev, ...payload.authorNames }));
    }
    const ids = rows.map((r) => r.author_id);
    if (user) {
      const trust = await resolveAuthorTrust(supabase, ids);
      setAuthorTrust(trust);
    } else {
      setAuthorTrust({});
    }
    if (!silent) setLoading(false);
    setLoadingOlder(false);
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
  const ownIdSet = useMemo(() => new Set(ownIds), [ownIds]);

  function rememberOwn(id: string) {
    setOwnIds((prev) => (prev.includes(id) ? prev : [...prev, id].slice(-200)));
    try {
      const key = `sonogyn-chat-own:${channelId}`;
      const stored = JSON.parse(sessionStorage.getItem(key) || "[]") as string[];
      sessionStorage.setItem(key, JSON.stringify([...stored, id].slice(-200)));
    } catch {
      /* private mode */
    }
  }

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(`sonogyn-chat-own:${channelId}`) || "[]") as string[];
      setOwnIds(stored);
    } catch {
      setOwnIds([]);
    }
  }, [channelId]);

  async function postMessage(body: string, mediaPath: string | null, mediaType: "image" | "video" | null, localId: string) {
    const response = await fetch("/api/doctor-chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId,
        body: body || null,
        media_storage_path: mediaPath,
        media_type: mediaType,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { message?: RawMessage; autoSubscribed?: boolean; error?: unknown }
      | null;
    if (!response.ok || !payload?.message) {
      throw new Error(typeof payload?.error === "string" ? payload.error : "Не удалось отправить сообщение");
    }
    const [bubble] = enrich([payload.message]);
    setMessages((prev) => prev.filter((item) => item.id !== localId).concat(bubble));
    rememberOwn(bubble.id);
    setAuthorNames((prev) => ({
      ...prev,
      [payload.message!.author_id]: prev[payload.message!.author_id] ?? "Гость",
    }));
    if (payload.autoSubscribed) setPushSubscribed(true);
  }

  async function handleSend({ text, file }: { text: string; file: File | null }) {
    const body = reply ? encodeReplyQuote(reply.excerpt, text) : text;
    if (!body.trim() && !file) return false;
    const localId = `local-${crypto.randomUUID()}`;
    const previewUrl = file ? URL.createObjectURL(file) : null;
    setMessages((prev) => [
      ...prev,
      {
        id: localId,
        body: body || null,
        author_id: userId ?? "local",
        created_at: new Date().toISOString(),
        media_type: file?.type.startsWith("image/") ? "image" : file ? "video" : null,
        media_url: previewUrl,
        voice: file?.name.startsWith("voice-") ?? false,
        send_status: navigator.onLine ? "sending" : "pending",
      },
    ]);
    rememberOwn(localId);

    if (!navigator.onLine) {
      if (file) {
        toast.error("Фото и видео уйдут, когда появится сеть");
        setMessages((prev) => prev.map((item) => (item.id === localId ? { ...item, send_status: "failed" } : item)));
        return false;
      }
      const queued = JSON.parse(localStorage.getItem("sonogyn-doctor-chat-outbox") || "[]") as Array<{
        id: string;
        channelId: string;
        body: string;
      }>;
      localStorage.setItem(
        "sonogyn-doctor-chat-outbox",
        JSON.stringify([...queued, { id: localId, channelId, body }]),
      );
      setReply(null);
      return true;
    }

    const offline = requireOnlineForNetworkAction();
    if (offline) {
      toast.error(offline);
      return false;
    }

    setSending(true);
    try {
      let mediaPath: string | null = null;
      let mediaType: "image" | "video" | null = null;
      if (file) {
        const prepared = file.type.startsWith("image/") ? await prepareOutgoingImage(file) : file;
        const controller = new AbortController();
        uploadAbortRef.current = controller;
        setUploadProgress(0);
        const uploaded = await uploadChatMedia(prepared, channelId, setUploadProgress, controller.signal);
        mediaPath = uploaded.storagePath;
        mediaType = uploaded.mediaType;
      }
      await postMessage(body, mediaPath, mediaType, localId);
      setReply(null);
      return true;
    } catch (error) {
      setMessages((prev) => prev.map((item) => (item.id === localId ? { ...item, send_status: "failed" } : item)));
      toast.error(error instanceof Error ? error.message : "Не удалось отправить сообщение");
      return false;
    } finally {
      setSending(false);
      setUploadProgress(null);
      uploadAbortRef.current = null;
    }
  }

  const postMessageRef = useRef(postMessage);
  useEffect(() => {
    postMessageRef.current = postMessage;
  });

  useEffect(() => {
    function flush() {
      const queued = JSON.parse(localStorage.getItem("sonogyn-doctor-chat-outbox") || "[]") as Array<{
        id: string;
        channelId: string;
        body: string;
      }>;
      const mineQueued = queued.filter((item) => item.channelId === channelId);
      const rest = queued.filter((item) => item.channelId !== channelId);
      if (mineQueued.length === 0) return;
      localStorage.setItem("sonogyn-doctor-chat-outbox", JSON.stringify(rest));
      for (const item of mineQueued) {
        void postMessageRef.current(item.body, null, null, item.id).catch(() => {
          setMessages((prev) => prev.map((row) => (row.id === item.id ? { ...row, send_status: "failed" } : row)));
        });
      }
    }
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [channelId]);

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
              Текст, фото, видео и голос. Снимок сжимается, полоса с именем пациента размывается.
            </p>
            <input
              value={search}
              onChange={(event) => {
                const next = event.target.value;
                setSearch(next);
                searchRef.current = next;
                window.setTimeout(() => {
                  if (searchRef.current === next) void load(true);
                }, 300);
              }}
              placeholder="Поиск по чату"
              className="mt-3 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2 text-sm"
            />
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
        {hasMore ? (
          <button
            type="button"
            className="text-xs font-semibold text-[var(--clinical-primary-deep)]"
            disabled={loadingOlder}
            onClick={() => {
              const oldest = messages.find((item) => !item.id.startsWith("local-"));
              if (oldest) void load(true, oldest.created_at);
            }}
          >
            {loadingOlder ? "Загрузка…" : "Раньше"}
          </button>
        ) : null}
        {loadState ? (
          <DoctorChatLoadPanel state={loadState} />
        ) : loading ? (
          <p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка сообщений…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Напишите первым — фото, видео или голос, без регистрации.
          </p>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              authorName={authorNames[msg.author_id] ?? (msg.author_id === "local" ? "Вы" : "Коллега")}
              authorVerified={authorTrust[msg.author_id]?.isVerified ?? false}
              isMine={mine.has(msg.author_id) || ownIdSet.has(msg.id) || msg.author_id === "local"}
              canReply
              onReply={() => {
                const parsed = parseReplyQuote(msg.body);
                setReply({ excerpt: parsed.text || parsed.excerpt || "сообщение" });
              }}
              onOpenImage={setGalleryUrl}
              fresh={msg.id.startsWith("local-")}
            />
          ))
        )}
      </div>

      {uploadProgress != null ? (
        <div className="flex items-center gap-3 border-t border-[var(--clinical-border)] px-4 py-2 text-xs">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--clinical-muted)]">
            <div className="h-full bg-[var(--clinical-primary)]" style={{ width: `${Math.round(uploadProgress * 100)}%` }} />
          </div>
          <button type="button" onClick={() => uploadAbortRef.current?.abort()}>
            Отмена
          </button>
        </div>
      ) : null}
      {!loadState ? (
        <div className="doctor-chat-composer border-t border-[var(--clinical-border)] p-4">
          <ChatMessageComposer
            busy={sending}
            onSend={handleSend}
            replyLabel={reply?.excerpt ?? null}
            onCancelReply={() => setReply(null)}
          />
        </div>
      ) : null}
      {galleryUrl ? (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setGalleryUrl(null)}
          aria-label="Закрыть снимок"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={galleryUrl} alt="Снимок" className="max-h-full max-w-full object-contain" />
        </button>
      ) : null}
    </div>
  );
}
