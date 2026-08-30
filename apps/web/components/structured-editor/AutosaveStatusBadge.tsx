"use client";

import type { AutosaveStatus } from "@/lib/structured-editor/use-structured-autosave";
import { cn } from "@/lib/utils/cn";

const LABELS: Record<AutosaveStatus, string> = {
  idle: "",
  pending: "Изменения…",
  saving: "Сохранение…",
  saved: "Сохранено",
  error: "Ошибка сохранения",
  conflict: "Конфликт версий",
};

type Props = {
  status: AutosaveStatus;
  lastSavedAt?: string | null;
  error?: string | null;
  className?: string;
};

export function AutosaveStatusBadge({ status, lastSavedAt, error, className }: Props) {
  if (status === "idle") return null;

  const tone =
    status === "error" || status === "conflict"
      ? "text-amber-700 dark:text-amber-300"
      : "text-[var(--clinical-foreground-muted)]";

  return (
    <p className={cn("text-xs", tone, className)} role="status" aria-live="polite">
      {error ?? LABELS[status]}
      {status === "saved" && lastSavedAt
        ? ` · ${new Date(lastSavedAt).toLocaleTimeString()}`
        : null}
    </p>
  );
}
