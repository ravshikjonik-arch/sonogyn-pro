"use client";

import { cn } from "@/lib/utils/cn";

export type ChatBubbleMessage = {
  id: string;
  body: string | null;
  author_id: string;
  created_at: string;
  media_type?: "image" | "video" | null;
  media_url?: string | null;
  is_best_answer?: boolean;
  is_pinned_expert?: boolean;
  parent_comment_id?: string | null;
  reactions?: Record<string, number>;
  is_case_author?: boolean;
};

type Props = {
  message: ChatBubbleMessage;
  authorName: string;
  isMine: boolean;
  /** Case author may mark this reply as best answer. */
  canMarkBest?: boolean;
  onMarkBest?: () => void;
  markingBest?: boolean;
  canReply?: boolean;
  onReply?: () => void;
  canReact?: boolean;
  onReact?: (emoji: string) => void;
  canReport?: boolean;
  onReport?: () => void;
  canPinExpert?: boolean;
  onPinExpert?: () => void;
  nested?: boolean;
};

export function ChatMessageBubble({
  message,
  authorName,
  isMine,
  canMarkBest,
  onMarkBest,
  markingBest,
  canReply,
  onReply,
  canReact,
  onReact,
  canReport,
  onReport,
  canPinExpert,
  onPinExpert,
  nested,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-1", isMine ? "items-end" : "items-start", nested && "ml-6 sm:ml-10")}>
      <div
        className={cn(
          "max-w-[min(92%,520px)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
          message.is_best_answer ? "ring-2 ring-amber-400" : "",
          message.is_pinned_expert ? "ring-2 ring-emerald-500" : "",
          isMine
            ? "bg-[var(--clinical-primary)] text-white"
            : "border border-[var(--clinical-border)] bg-[var(--clinical-card)] text-[var(--clinical-foreground)]",
        )}
      >
      {message.media_url && message.media_type === "image" ? (
        <a href={message.media_url} target="_blank" rel="noreferrer" className="mb-2 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.media_url}
            alt="Снимок в сообщении"
            className="max-h-64 rounded-xl object-contain"
          />
        </a>
      ) : null}
      {message.media_url && message.media_type === "video" ? (
        <video src={message.media_url} controls className="mb-2 max-h-64 w-full rounded-xl" />
      ) : null}
      {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}
      {message.is_best_answer ? (
        <p className={cn("mt-2 text-xs font-bold", isMine ? "text-amber-100" : "text-amber-700")}>
          ★ Лучший ответ
        </p>
      ) : null}
      {message.is_pinned_expert ? (
        <p className={cn("mt-2 text-xs font-bold", isMine ? "text-emerald-100" : "text-emerald-700")}>
          ✓ Экспертный ответ
        </p>
      ) : null}
      {message.is_case_author ? (
        <p className={cn("mt-1 text-[10px] font-semibold uppercase", isMine ? "text-white/80" : "text-violet-700")}>
          Автор кейса
        </p>
      ) : null}
      <p
        className={cn(
          "mt-2 text-[10px] font-medium uppercase tracking-wide",
          isMine ? "text-white/75" : "text-[var(--clinical-foreground-muted)]",
        )}
      >
        {authorName} · {new Date(message.created_at).toLocaleString()}
      </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-1">
        {canMarkBest && !message.is_best_answer && onMarkBest ? (
          <button
            type="button"
            disabled={markingBest}
            onClick={onMarkBest}
            className="text-xs font-medium text-[var(--clinical-primary-deep)] hover:underline disabled:opacity-50"
          >
            {markingBest ? "…" : "Лучший ответ"}
          </button>
        ) : null}
        {canReply && onReply ? (
          <button type="button" onClick={onReply} className="text-xs text-[var(--clinical-foreground-muted)] hover:underline">
            Ответить
          </button>
        ) : null}
        {canReact && onReact
          ? ["👍", "💡", "❓", "✅"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`Реакция ${emoji}`}
                onClick={() => onReact(emoji)}
                className="rounded-md px-1 text-xs hover:bg-[var(--clinical-muted)]"
              >
                {emoji}
                {message.reactions?.[emoji] ? ` ${message.reactions[emoji]}` : ""}
              </button>
            ))
          : null}
        {canPinExpert && onPinExpert ? (
          <button type="button" onClick={onPinExpert} className="text-xs text-emerald-700 hover:underline">
            Закрепить экспертный
          </button>
        ) : null}
        {canReport && onReport ? (
          <button type="button" onClick={onReport} className="text-xs text-amber-800 hover:underline">
            Жалоба
          </button>
        ) : null}
      </div>
    </div>
  );
}
