import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type FloatingInsightProps = {
  title: string;
  children: ReactNode;
  tone?: "ai" | "safety" | "neutral";
  className?: string;
};

const toneClass = {
  ai: "border-indigo-200/70 bg-indigo-50/70 text-indigo-950 dark:border-indigo-900/45 dark:bg-indigo-950/25 dark:text-indigo-50",
  safety:
    "border-amber-200/80 bg-amber-50/80 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-50",
  neutral:
    "border-[var(--clinical-border)] bg-[var(--sg-surface-glass)] text-[var(--clinical-foreground)]",
};

export function FloatingInsight({ title, children, tone = "neutral", className }: FloatingInsightProps) {
  return (
    <aside className={cn("rounded-[var(--sg-radius-md)] border p-3 shadow-[var(--sg-depth-1)]", toneClass[tone], className)}>
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide">
        <Sparkles className="h-3.5 w-3.5" />
        {title}
      </p>
      <div className="mt-2 text-sm leading-relaxed">{children}</div>
    </aside>
  );
}
