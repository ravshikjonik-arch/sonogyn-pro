"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/app/providers";
import { ChatMessageBubble, type ChatBubbleMessage } from "@/components/chat/ChatMessageBubble";
import { ChatMessageComposer } from "@/components/chat/ChatMessageComposer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  enrichTeachingCaseComment,
  isTeachingCaseCommentRow,
  type TeachingCaseCommentRow,
} from "@/lib/chat/enrich-teaching-comment";
import { resolveAuthorNames } from "@/lib/chat/resolve-author-names";
import { useCaseDiscussionRealtime } from "@/lib/cases/use-case-discussion-realtime";
import { isRealtimePollingFallbackEnabledClient } from "@/lib/feature-flags/integration-rollout";

type Props = {
  caseId: string;
  userId: string;
  caseAuthorId: string;
  isExpert?: boolean;
  isModerator?: boolean;
};

export function TeachingCaseDiscussion({
  caseId,
  userId,
  caseAuthorId,
  isExpert = false,
  isModerator = false,
}: Props) {
  const supabase = useSupabase();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [presenceCount, setPresenceCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeReady, setRealtimeReady] = useState(false);
  const pollingFallback = isRealtimePollingFallbackEnabledClient();

  const isCaseAuthor = userId === caseAuthorId;

  const enrich = useCallback(
    (rows: (TeachingCaseCommentRow & { media_url?: string | null; reactions?: Record<string, number> })[]) => {
      return rows.map(
        (row): ChatBubbleMessage => ({
          id: row.id,
          body: row.body || null,
          author_id: row.author_id,
          created_at: row.created_at,
          media_type: row.media_type,
          media_url: row.media_url ?? null,
          is_best_answer: row.is_best_answer,
          is_pinned_expert: row.is_pinned_expert,
          parent_comment_id: row.parent_comment_id ?? null,
          reactions: row.reactions ?? {},
          is_case_author: row.author_id === caseAuthorId,
        }),
      );
    },
    [caseAuthorId],
  );

  const applyRow = useCallback(
    async (row: TeachingCaseCommentRow & { media_url?: string | null; reactions?: Record<string, number> }) => {
      const [bubble] = enrich([row]);
      setMessages((prev) => {
        const without = prev.filter((m) => m.id !== bubble.id);
        const next = [...without, bubble].sort((a, b) => a.created_at.localeCompare(b.created_at));
        if (row.is_best_answer) {
          return next.map((m) => ({ ...m, is_best_answer: m.id === bubble.id }));
        }
        if (row.is_pinned_expert) {
          return next.map((m) => ({ ...m, is_pinned_expert: m.id === bubble.id }));
        }
        return next;
      });
      const names = await resolveAuthorNames(supabase, [row.author_id]);
      setAuthorNames((prev) => ({ ...prev, ...names }));
    },
    [enrich, supabase],
  );

  const ingestRealtimeRow = useCallback(
    async (row: unknown) => {
      if (!isTeachingCaseCommentRow(row)) return;
      const enriched = await enrichTeachingCaseComment(supabase, row);
      await applyRow(enriched);
    },
    [applyRow, supabase],
  );

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const response = await fetch(`/api/cases/${caseId}/comments`);
    const payload = (await response.json().catch(() => null)) as
      | {
          comments?: (TeachingCaseCommentRow & {
            media_url?: string | null;
            reactions?: Record<string, number>;
          })[];
          error?: unknown;
        }
      | null;

    if (!response.ok || !payload?.comments) {
      if (!silent) toast.error(typeof payload?.error === "string" ? payload.error : "Не удалось загрузить обсуждение");
      setMessages([]);
      if (!silent) setLoading(false);
      return;
    }

    setMessages(enrich(payload.comments));
    setAuthorNames(await resolveAuthorNames(supabase, payload.comments.map((r) => r.author_id)));
    if (!silent) setLoading(false);
  }, [caseId, enrich, supabase]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    void fetch(`/api/cases/${caseId}/subscribe`)
      .then((r) => r.json())
      .then((json: { subscribed?: boolean }) => setSubscribed(Boolean(json.subscribed)))
      .catch(() => undefined);
    void fetch(`/api/cases/${caseId}/read-cursor`)
      .then((r) => r.json())
      .then((json: { unreadCount?: number }) => setUnreadCount(json.unreadCount ?? 0))
      .catch(() => undefined);
  }, [caseId]);

  useEffect(() => {
    const ping = () => void fetch(`/api/cases/${caseId}/presence`, { method: "POST" });
    ping();
    const id = window.setInterval(ping, 25_000);
    return () => window.clearInterval(id);
  }, [caseId]);

  useEffect(() => {
    const loadPresence = () => {
      void fetch(`/api/cases/${caseId}/presence`)
        .then((r) => r.json())
        .then((json: { participants?: unknown[] }) => setPresenceCount(json.participants?.length ?? 0))
        .catch(() => undefined);
    };
    loadPresence();
    const id = window.setInterval(loadPresence, 20_000);
    return () => window.clearInterval(id);
  }, [caseId]);

  useCaseDiscussionRealtime(supabase, caseId, !pollingFallback, {
    onCommentInsert: (row) => void ingestRealtimeRow(row),
    onCommentUpdate: (row) => void ingestRealtimeRow(row),
    onSubscribed: () => setRealtimeReady(true),
  });

  useEffect(() => {
    if (!pollingFallback) return;
    const id = window.setInterval(() => void load(true), 10000);
    return () => window.clearInterval(id);
  }, [load, pollingFallback]);

  useEffect(() => {
    if (!messages.length) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    void fetch(`/api/cases/${caseId}/read-cursor`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastReadCommentId: messages.at(-1)?.id }),
    });
    setUnreadCount(0);
  }, [caseId, messages]);

  const threaded = useMemo(() => {
    const roots = messages.filter((m) => !m.parent_comment_id);
    const repliesByParent = messages.reduce<Record<string, ChatBubbleMessage[]>>((acc, m) => {
      if (!m.parent_comment_id) return acc;
      acc[m.parent_comment_id] ??= [];
      acc[m.parent_comment_id]!.push(m);
      return acc;
    }, {});
    return roots.flatMap((root) => [root, ...(repliesByParent[root.id] ?? [])]);
  }, [messages]);

  async function toggleSubscribe() {
    const method = subscribed ? "DELETE" : "POST";
    const res = await fetch(`/api/cases/${caseId}/subscribe`, { method });
    if (!res.ok) {
      toast.error("Не удалось изменить подписку");
      return;
    }
    setSubscribed(!subscribed);
    toast.success(subscribed ? "Подписка отменена" : "Вы подписаны на обновления кейса");
  }

  async function handleMarkBest(commentId: string) {
    if (!isCaseAuthor) return;
    setMarkingId(commentId);
    try {
      const response = await fetch(`/api/cases/${caseId}/comments/${commentId}/best`, { method: "POST" });
      if (!response.ok) {
        toast.error("Не удалось отметить лучший ответ");
        return;
      }
      toast.success("Лучший ответ отмечен");
      await load(true);
    } finally {
      setMarkingId(null);
    }
  }

  async function handleReact(commentId: string, emoji: string) {
    const res = await fetch(`/api/cases/${caseId}/comments/${commentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji, active: true }),
    });
    if (!res.ok) toast.error("Не удалось добавить реакцию");
    else await load(true);
  }

  async function handleReport(commentId: string) {
    const reason = window.prompt("Причина жалобы (без персональных данных):");
    if (!reason?.trim()) return;
    const res = await fetch(`/api/cases/${caseId}/comments/${commentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    if (!res.ok) toast.error("Не удалось отправить жалобу");
    else toast.success("Жалоба отправлена модератору");
  }

  async function handlePinExpert(commentId: string) {
    const res = await fetch(`/api/cases/${caseId}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pin_expert" }),
    });
    if (!res.ok) toast.error("Недостаточно прав");
    else {
      toast.success("Экспертный ответ закреплён");
      await load(true);
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
        const uploadResponse = await fetch("/api/doctor-chat/media", { method: "POST", body: form });
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
          parentCommentId: replyToId,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { comment?: TeachingCaseCommentRow & { media_url?: string | null }; error?: unknown }
        | null;

      if (!response.ok || !payload?.comment) {
        toast.error(typeof payload?.error === "string" ? payload.error : "Не удалось отправить сообщение");
        return false;
      }
      await applyRow(payload.comment);
      setReplyToId(null);
      toast.success("Сообщение отправлено");
      return true;
    } finally {
      setSending(false);
    }
  }

  const mine = useMemo(() => new Set([userId]), [userId]);

  return (
    <Card className="border-[var(--clinical-border)]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Комната обсуждения кейса</CardTitle>
            <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
              {pollingFallback
                ? "Polling fallback · "
                : `Realtime${realtimeReady ? "" : " (подключение…)"} · `}
              один уровень ответов · реакции · упоминания
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 ? (
              <Badge variant="outline" className="border-violet-500 text-violet-800">
                {unreadCount} новых
              </Badge>
            ) : null}
            {presenceCount > 0 ? (
              <Badge variant="outline">{presenceCount} онлайн</Badge>
            ) : null}
            <Button type="button" size="sm" variant="secondary" onClick={() => void toggleSubscribe()}>
              {subscribed ? "Отписаться" : "Подписаться"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={scrollRef}
          className="max-h-[440px] space-y-3 overflow-y-auto rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-3"
        >
          {loading ? (
            <p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка сообщений…</p>
          ) : threaded.length === 0 ? (
            <p className="text-sm text-[var(--clinical-foreground-muted)]">
              Напишите первым — можно прикрепить обезличенный снимок или видео УЗИ.
            </p>
          ) : (
            threaded.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                authorName={authorNames[msg.author_id] ?? "Коллега"}
                isMine={mine.has(msg.author_id)}
                nested={Boolean(msg.parent_comment_id)}
                canMarkBest={isCaseAuthor && !mine.has(msg.author_id) && !msg.parent_comment_id}
                markingBest={markingId === msg.id}
                onMarkBest={() => void handleMarkBest(msg.id)}
                canReply={!msg.parent_comment_id}
                onReply={() => setReplyToId(msg.id)}
                canReact
                onReact={(emoji) => void handleReact(msg.id, emoji)}
                canReport={!mine.has(msg.author_id)}
                onReport={() => void handleReport(msg.id)}
                canPinExpert={(isExpert || isModerator) && !msg.is_pinned_expert}
                onPinExpert={() => void handlePinExpert(msg.id)}
              />
            ))
          )}
        </div>

        {replyToId ? (
          <p className="text-xs text-[var(--clinical-foreground-muted)]">
            Ответ на сообщение ·{" "}
            <button type="button" className="underline" onClick={() => setReplyToId(null)}>
              отмена
            </button>
          </p>
        ) : null}

        <ChatMessageComposer
          busy={sending}
          placeholder="Вопрос, гипотеза, тактика… (@uuid для упоминания)"
          onSend={handleSend}
        />

        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Не публикуйте персональные данные. Сообщения доступны только участникам с доступом врача.
          Чтение — через API; прямой client SELECT ограничен RLS.
        </p>
      </CardContent>
    </Card>
  );
}
