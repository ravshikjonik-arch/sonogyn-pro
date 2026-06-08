"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/app/providers";
import { ChatMessageBubble, type ChatBubbleMessage } from "@/components/chat/ChatMessageBubble";
import { ChatMessageComposer } from "@/components/chat/ChatMessageComposer";
import { resolveAuthorNames } from "@/lib/chat/resolve-author-names";
import {
  getChatMediaSignedUrl,
  uploadChatMedia,
} from "@/lib/supabase/chat-media-storage";

type RawMessage = {
  id: string;
  channel_id: string;
  author_id: string;
  body: string | null;
  media_storage_path: string | null;
  media_type: "image" | "video" | null;
  created_at: string;
};

type Props = {
  channelId: string;
  channelTitle: string;
  channelDescription?: string;
};

export function DoctorChannelChat({ channelId, channelTitle, channelDescription }: Props) {
  const supabase = useSupabase();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const enrich = useCallback(
    async (rows: RawMessage[]) => {
      const enriched: ChatBubbleMessage[] = await Promise.all(
        rows.map(async (row) => ({
          id: row.id,
          body: row.body,
          author_id: row.author_id,
          created_at: row.created_at,
          media_type: row.media_type,
          media_url: row.media_storage_path
            ? await getChatMediaSignedUrl(supabase, row.media_storage_path)
            : null,
        })),
      );
      return enriched;
    },
    [supabase],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    setUserId(sessionData.session?.user.id ?? null);

    const { data, error } = await supabase
      .from("doctor_chat_messages")
      .select("id,channel_id,author_id,body,media_storage_path,media_type,created_at")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      const hint =
        error.message.includes("doctor_chat") ||
        (typeof error === "object" && error !== null && "code" in error && error.code === "42P01")
          ? "Примените BUNDLE_COMMUNITY_CHAT_ONLY.sql в Supabase SQL Editor."
          : error.message;
      setLoadError(hint);
      toast.error("Чат: нужна миграция Supabase");
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoadError(null);

    const rows = (data ?? []) as RawMessage[];
    setMessages(await enrich(rows));
    setAuthorNames(await resolveAuthorNames(supabase, rows.map((r) => r.author_id)));
    setLoading(false);
  }, [channelId, enrich, supabase]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

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
        async (payload) => {
          const row = payload.new as RawMessage;
          const [bubble] = await enrich([row]);
          setMessages((prev) => [...prev.filter((m) => m.id !== bubble.id), bubble]);
          const names = await resolveAuthorNames(supabase, [row.author_id]);
          setAuthorNames((prev) => (prev[row.author_id] ? prev : { ...prev, ...names }));
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
      return;
    }
    setSending(true);
    try {
      let media_storage_path: string | null = null;
      let media_type: "image" | "video" | null = null;

      if (file) {
        const uploaded = await uploadChatMedia(supabase, {
          userId,
          scope: "channel",
          scopeId: channelId,
          file,
        });
        if ("error" in uploaded) {
          toast.error(uploaded.error);
          return;
        }
        media_storage_path = uploaded.storagePath;
        media_type = uploaded.mediaType;
      }

      const { error } = await supabase.from("doctor_chat_messages").insert({
        channel_id: channelId,
        author_id: userId,
        body: text || null,
        media_storage_path,
        media_type,
      });

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Сообщение отправлено");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[520px] flex-col rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] shadow-sm">
      <div className="border-b border-[var(--clinical-border)] px-5 py-4">
        <p className="text-sm font-black text-[var(--clinical-foreground)]">{channelTitle}</p>
        {channelDescription ? (
          <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{channelDescription}</p>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-[var(--clinical-muted)]/30 p-4"
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
        <div className="border-t border-[var(--clinical-border)] p-4">
          <ChatMessageComposer busy={sending} onSend={handleSend} />
        </div>
      ) : null}
    </div>
  );
}
