import { AlertTriangle, Info, Lightbulb, TrendingUp } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

type InsightTone = "info" | "risk" | "success" | "recommendation";

const TONE: Record<
  InsightTone,
  { icon: React.ComponentType<{ className?: string }>; color: string; ring: string }
> = {
  info: { icon: Info, color: "var(--ai-blue)", ring: "rgba(59,130,246,0.16)" },
  risk: { icon: AlertTriangle, color: "var(--ai-danger)", ring: "rgba(239,68,68,0.16)" },
  success: { icon: TrendingUp, color: "var(--ai-success)", ring: "rgba(16,185,129,0.16)" },
  recommendation: { icon: Lightbulb, color: "var(--ai-violet)", ring: "rgba(139,92,246,0.16)" },
};

type AIInsightCardProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: InsightTone;
  title: string;
};

/** Карточка AI-инсайта с тональностью (риск / рекомендация / факт). */
export function AIInsightCard({
  tone = "info",
  title,
  className,
  children,
  ...props
}: AIInsightCardProps) {
  const { icon: Icon, color, ring } = TONE[tone];
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4",
        className,
      )}
      {...props}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: ring, color }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-[var(--clinical-foreground)]">{title}</p>
        {children && (
          <div className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{children}</div>
        )}
      </div>
    </div>
  );
}
