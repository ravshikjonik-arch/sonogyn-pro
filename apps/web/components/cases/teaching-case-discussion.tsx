"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/app/providers";
import { ChatMessageBubble, type ChatBubbleMessage } from "@/components/chat/ChatMessageBubble";
import { ChatMessageComposer } from "@/components/chat/ChatMessageComposer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveAuthorNames } from "@/lib/chat/resolve-author-names";
import {
  getChatMediaSignedUrl,
  uploadChatMedia,
} from "@/lib/supabase/chat-media-storage";

type RawComment = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  media_storage_path: string | null;
  media_type: "image" | "video" | null;
};

type Props = { caseId: string; userId: string };

export function TeachingCaseDiscussion({ caseId, userId }: Props) {
  const supabase = useSupabase();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const enrich = useCallback(
    async (rows: RawComment[]) => {
      return Promise.all(
        rows.map(async (row) => ({
          id: row.id,
          body: row.body || null,
          author_id: row.author_id,
          created_at: row.created_at,
          media_type: row.media_type,
          media_url: row.media_storage_path
            ? await getChatMediaSignedUrl(supabase, row.media_storage_path)
            : null,
        })),
      );
    },
    [supabase],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("teaching_case_comments")
      .select("id,body,created_at,author_id,media_storage_path,media_type")
      .eq("case_id", caseId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error(error.message);
      setMessages([]);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as RawComment[];
    setMessages(await enrich(rows));
    setAuthorNames(await resolveAuthorNames(supabase, rows.map((r) => r.author_id)));
    setLoading(false);
  }, [caseId, enrich, supabase]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`teaching_case_comments:${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "teaching_case_comments",
          filter: `case_id=eq.${caseId}`,
        },
        async (payload) => {
          const row = payload.new as RawComment;
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
  }, [caseId, enrich, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const mine = useMemo(() => new Set([userId]), [userId]);

  async function handleSend({ text, file }: { text: string; file: File | null }) {
    setSending(true);
    try {
      let media_storage_path: string | null = null;
      let media_type: "image" | "video" | null = null;

      if (file) {
        const uploaded = await uploadChatMedia(supabase, {
          userId,
          scope: "case-comment",
          scopeId: caseId,
          file,
        });
        if ("error" in uploaded) {
          toast.error(uploaded.error);
          return;
        }
        media_storage_path = uploaded.storagePath;
        media_type = uploaded.mediaType;
      }

      if (!text.trim() && !media_storage_path) return;

      const { error } = await supabase.from("teaching_case_comments").insert({
        case_id: caseId,
        author_id: userId,
        body: text.trim() || (media_type === "video" ? "Видео УЗИ" : "Снимок УЗИ"),
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
    <Card className="border-[var(--clinical-border)]">
      <CardHeader>
        <CardTitle className="text-lg">Обсуждение с коллегами</CardTitle>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Живой тред · фото и видео в сообщениях · Realtime.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={scrollRef}
          className="max-h-[440px] space-y-3 overflow-y-auto rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-3"
        >
          {loading ? (
            <p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка сообщений…</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-[var(--clinical-foreground-muted)]">
              Напишите первым — можно прикрепить снимок или видео УЗИ.
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

        <ChatMessageComposer
          busy={sending}
          placeholder="Вопрос, гипотеза, тактика…"
          onSend={handleSend}
        />
      </CardContent>
    </Card>
  );
}
