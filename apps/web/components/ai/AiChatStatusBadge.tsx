"use client";

import { cn } from "@/lib/utils/cn";

export type AiChatStatus = "idle" | "connecting" | "streaming" | "error" | "fallback" | "stopped";

const LABELS: Record<AiChatStatus, string> = {
  idle: "",
  connecting: "Подключение…",
  streaming: "Генерация ответа…",
  error: "Ошибка модели",
  fallback: "Резервная модель",
  stopped: "Остановлено",
};

export function AiChatStatusBadge({ status }: { status: AiChatStatus }) {
  if (status === "idle") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
        status === "error"
          ? "bg-red-500/15 text-red-700 dark:text-red-300"
          : status === "fallback"
            ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
            : "bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]",
      )}
      role="status"
      aria-live="polite"
    >
      {LABELS[status]}
    </span>
  );
}
