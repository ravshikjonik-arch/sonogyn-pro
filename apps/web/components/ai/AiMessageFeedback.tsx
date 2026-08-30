"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils/cn";

export function AiMessageFeedback({
  messageId,
  disabled,
}: {
  messageId?: string;
  disabled?: boolean;
}) {
  const [rating, setRating] = useState<-1 | 1 | null>(null);
  const [busy, setBusy] = useState(false);

  if (!messageId) return null;

  async function submit(next: -1 | 1) {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ messageId, rating: next }),
      });
      if (!res.ok) throw new Error("feedback failed");
      setRating(next);
      toast.success("Спасибо за оценку");
    } catch {
      toast.error("Не удалось сохранить оценку");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex items-center gap-1 border-t border-[var(--clinical-border)] pt-2">
      <button
        type="button"
        disabled={busy || disabled}
        onClick={() => void submit(1)}
        className={cn(
          "rounded-lg p-1.5 transition hover:bg-[var(--clinical-muted)]",
          rating === 1 && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        )}
        aria-label="Полезный ответ"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        disabled={busy || disabled}
        onClick={() => void submit(-1)}
        className={cn(
          "rounded-lg p-1.5 transition hover:bg-[var(--clinical-muted)]",
          rating === -1 && "bg-red-500/15 text-red-700 dark:text-red-300",
        )}
        aria-label="Неполезный ответ"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
      <span className="text-[10px] text-[var(--clinical-foreground-muted)]">Оцените ответ</span>
    </div>
  );
}
