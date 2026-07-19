"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/app/providers";
import { ChatMessageBubble, type ChatBubbleMessage } from "@/components/chat/ChatMessageBubble";
import { ChatMessageComposer } from "@/components/chat/ChatMessageComposer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveAuthorNames } from "@/lib/chat/resolve-author-names";

type RawComment = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  media_storage_path: string | null;
  media_type: "image" | "video" | null;
  media_url?: string | null;
  is_best_answer: boolean;
};

type Props = {
  caseId: string;
  userId: string;
  caseAuthorId: string;
};

export function TeachingCaseDiscussion({ caseId, userId, caseAuthorId }: Props) {
  const supabase = useSupabase();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const isCaseAuthor = userId === caseAuthorId;

  const enrich = useCallback(
    (rows: RawComment[]) => {
      return rows.map((row) => ({
          id: row.id,
          body: row.body || null,
          author_id: row.author_id,
          created_at: row.created_at,
          media_type: row.media_type,
          media_url: row.media_url ?? null,
          is_best_answer: row.is_best_answer,
        }));
    },
    [],
  );

  const applyRow = useCallback(
    async (row: RawComment) => {
      const [bubble] = enrich([row]);
      setMessages((prev) => {
        const without = prev.filter((m) => m.id !== bubble.id);
        if (row.is_best_answer) {
          return [...without.map((m) => ({ ...m, is_best_answer: m.id === bubble.id })), bubble].sort(
            (a, b) => a.created_at.localeCompare(b.created_at),
          );
        }
        const merged = [...without, bubble].sort((a, b) => a.created_at.localeCompare(b.created_at));
        return merged;
      });
      const names = await resolveAuthorNames(supabase, [row.author_id]);
      setAuthorNames((prev) => ({ ...prev, ...names }));
    },
    [enrich, supabase],
  );

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const response = await fetch(`/api/cases/${caseId}/comments`);
    const payload = (await response.json().catch(() => null)) as
      | { comments?: RawComment[]; error?: unknown }
      | null;

    if (!response.ok || !payload?.comments) {
      toast.error(typeof payload?.error === "string" ? payload.error : "Не удалось загрузить обсуждение");
      setMessages([]);
      if (!silent) setLoading(false);
      return;
    }

    const rows = payload.comments;
    setMessages(enrich(rows));
    setAuthorNames(await resolveAuthorNames(supabase, rows.map((r) => r.author_id)));
    if (!silent) setLoading(false);
  }, [caseId, enrich, supabase]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void load(true);
    }, 10000);
    return () => window.clearInterval(id);
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
        async () => {
          await load(true);
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
        async () => {
          await load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [applyRow, caseId, load, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const mine = useMemo(() => new Set([userId]), [userId]);

  async function handleMarkBest(commentId: string) {
    if (!isCaseAuthor) return;
    setMarkingId(commentId);
    try {
      const response = await fetch(`/api/cases/${caseId}/comments/${commentId}/best`, {
        method: "POST",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(payload?.error ?? "Не удалось отметить лучший ответ");
        return;
      }
      toast.success("Лучший ответ отмечен");
      await load();
    } finally {
      setMarkingId(null);
    }
  }

  async function handleSend({ text, file }: { text: string; file: File | null }) {
    setSending(true);
    try {
      let media_storage_path: string | null = null;
      let media_type: "image" | "video" | null = null;

      if (file) {
        const form = new FormData();
        form.append("scope", "case-comment");
        form.append("scopeId", caseId);
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

      if (!text.trim() && !media_storage_path) return false;

      const response = await fetch(`/api/cases/${caseId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: text.trim() || (media_type === "video" ? "Видео УЗИ" : "Снимок УЗИ"),
          media_storage_path,
          media_type,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { comment?: RawComment; error?: unknown }
        | null;

      if (!response.ok || !payload?.comment) {
        toast.error(typeof payload?.error === "string" ? payload.error : "Не удалось отправить сообщение");
        return false;
      }
      await applyRow(payload.comment);
      toast.success("Сообщение отправлено");
      return true;
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="border-[var(--clinical-border)]">
      <CardHeader>
        <CardTitle className="text-lg">Обсуждение с коллегами</CardTitle>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Живой тред · фото и видео · Realtime · автор кейса может отметить лучший ответ.
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
                canMarkBest={isCaseAuthor && !mine.has(msg.author_id)}
                markingBest={markingId === msg.id}
                onMarkBest={() => void handleMarkBest(msg.id)}
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
