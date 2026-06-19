"use client";

import { Sparkles, Star } from "lucide-react";

import { openUpgrade } from "@/lib/pro/upgrade-bus";
import { cn } from "@/lib/utils/cn";
import { useProStatus } from "@/components/pro/use-pro-status";

/**
 * Бейдж статуса возле имени:
 *  - PRO → анимированный «⭐ Sonogyn PRO»
 *  - free → кликабельный «✨ PRO» (открывает апгрейд)
 */
export function ProBadge({ className }: { className?: string }) {
  const { isPro, loading } = useProStatus();
  if (loading) return null;

  if (isPro) {
    return (
      <span
        className={cn(
          "ai-gradient-bg inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-sm",
          className,
        )}
        title="Sonogyn PRO"
      >
        <Star className="ai-breathe h-3 w-3 fill-current" />
        PRO
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openUpgrade({ feature: "Sonogyn PRO" })}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[var(--ai-violet)]/40 bg-[var(--ai-gradient-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--ai-violet)] transition hover:opacity-90",
        className,
      )}
      title="Перейти на PRO"
    >
      <Sparkles className="h-3 w-3" />
      PRO
    </button>
  );
}
