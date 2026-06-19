import { Sparkles } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

type AIPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Бейдж справа в шапке (например, PRO или статус). */
  badge?: React.ReactNode;
};

/**
 * Премиум-контейнер для AI-блоков (Notion AI / OpenAI-стиль):
 * стеклянная карточка, градиентный заголовок с иконкой.
 */
export function AIPanel({
  title,
  subtitle,
  icon,
  badge,
  className,
  children,
  ...props
}: AIPanelProps) {
  return (
    <section
      className={cn("ai-gradient-border premium-card overflow-hidden rounded-2xl", className)}
      {...props}
    >
      {(title || badge) && (
        <header className="flex items-center gap-3 border-b border-[var(--clinical-border)] px-5 py-4">
          <span className="ai-orb ai-breathe flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white">
            {icon ?? <Sparkles className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="truncate text-sm font-semibold text-[var(--clinical-foreground)]">{title}</h3>
            )}
            {subtitle && (
              <p className="truncate text-xs text-[var(--clinical-foreground-muted)]">{subtitle}</p>
            )}
          </div>
          {badge}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
