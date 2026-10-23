"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type Props = {
  visible: boolean;
  unreadCount: number;
  onClick: () => void;
  className?: string;
};

export function MessengerScrollToBottom({ visible, unreadCount, onClick, className }: Props) {
  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label={
        unreadCount > 0 ? `Вниз, непрочитанных: ${unreadCount}` : "Прокрутить к последним сообщениям"
      }
      onClick={onClick}
      className={cn(
        "absolute bottom-4 right-4 z-10 flex h-11 min-w-11 items-center justify-center gap-1 rounded-full border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 text-sm font-semibold text-[var(--clinical-foreground)] shadow-md transition hover:bg-[var(--clinical-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        className,
      )}
    >
      <ChevronDown className="h-5 w-5" aria-hidden />
      {unreadCount > 0 ? (
        <span className="rounded-full bg-[var(--clinical-primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}
