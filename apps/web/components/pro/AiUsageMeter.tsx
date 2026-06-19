"use client";

import { Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { useProStatus } from "@/components/pro/use-pro-status";
import { FREE_AI_LIMIT, aiUsagePercent, getAiUsage } from "@/lib/pro/ai-usage";
import { openUpgrade } from "@/lib/pro/upgrade-bus";

/** Блок «AI использован на X%» с кнопкой Upgrade (только для free). */
export function AiUsageMeter() {
  const { isPro, loading } = useProStatus();
  const [used, setUsed] = useState(() => getAiUsage());

  useEffect(() => {
    const handler = (e: Event) => setUsed((e as CustomEvent<number>).detail ?? getAiUsage());
    window.addEventListener("sonogyn:ai-usage", handler);
    return () => window.removeEventListener("sonogyn:ai-usage", handler);
  }, []);

  if (loading || isPro) return null;

  const percent = aiUsagePercent(used);

  return (
    <section className="premium-card flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center">
      <span className="ai-orb flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white">
        <Zap className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--clinical-foreground)]">
            AI использован на {percent}%
          </p>
          <span className="text-xs text-[var(--clinical-foreground-muted)]">
            {used} / {FREE_AI_LIMIT}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--clinical-muted)]">
          <div
            className="ai-gradient-bg h-full rounded-full transition-[width] duration-500"
            style={{ width: `${Math.max(6, percent)}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-[var(--clinical-foreground-muted)]">
          Обновитесь до PRO для безлимитного доступа.
        </p>
      </div>
      <button
        type="button"
        onClick={() => openUpgrade({ feature: "Безлимитные AI-запросы" })}
        className="ai-gradient-bg inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-95"
      >
        <Sparkles className="h-4 w-4" />
        Upgrade to PRO
      </button>
    </section>
  );
}
