"use client";

import { Loader2, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  loading: boolean;
  suggestion: string | null;
  disclaimer: string | null;
  error: string | null;
  onDismiss: () => void;
  onInsert: (text: string) => void;
};

export function MessengerAiSuggestPanel({
  loading,
  suggestion,
  disclaimer,
  error,
  onDismiss,
  onInsert,
}: Props) {
  if (!loading && !suggestion && !error) return null;

  return (
    <div
      className="mb-2 rounded-xl border border-violet-300/60 bg-violet-50/80 p-3 dark:border-violet-700/50 dark:bg-violet-950/30"
      role="region"
      aria-label="Подсказка ИИ"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1 text-xs font-bold text-violet-900 dark:text-violet-200">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          @AI · учебная подсказка
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-1 hover:bg-violet-200/50 dark:hover:bg-violet-900/50"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {loading ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-[var(--clinical-foreground-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ИИ готовит ответ…
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p> : null}
      {suggestion ? (
        <>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--clinical-foreground)]">{suggestion}</p>
          {disclaimer ? (
            <p className="mt-2 text-[10px] text-[var(--clinical-foreground-muted)]">{disclaimer}</p>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => onInsert(suggestion)}
          >
            Вставить в поле сообщения
          </Button>
        </>
      ) : null}
    </div>
  );
}
