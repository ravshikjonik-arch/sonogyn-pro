"use client";

import { BarChart3, FileCheck2, Infinity as InfinityIcon, Lock, Mic, Stethoscope } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useProStatus } from "@/components/pro/use-pro-status";
import { FadeIn } from "@/components/ui/motion";
import { openUpgrade } from "@/lib/pro/upgrade-bus";

const FEATURES: { label: string; icon: LucideIcon }[] = [
  { label: "AI Полное заключение", icon: FileCheck2 },
  { label: "AI Диагностические рекомендации", icon: Stethoscope },
  { label: "Расширенная аналитика", icon: BarChart3 },
  { label: "Голосовой помощник", icon: Mic },
  { label: "Безлимитные AI-запросы", icon: InfinityIcon },
];

/** Заблокированные premium-возможности (только для free). Клик → апгрейд. */
export function PremiumFeaturesTeaser() {
  const { isPro, loading } = useProStatus();
  if (loading || isPro) return null;

  return (
    <FadeIn>
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-[var(--ai-violet)]" />
          <h2 className="text-sm font-bold text-[var(--clinical-foreground)]">Возможности PRO</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.label}
                type="button"
                onClick={() => openUpgrade({ feature: f.label })}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ai-gradient-soft)] text-[var(--ai-violet)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1 text-sm font-medium text-[var(--clinical-foreground)]">{f.label}</span>
                <Lock className="h-4 w-4 text-[var(--clinical-foreground-muted)] transition group-hover:text-[var(--ai-violet)]" />
              </button>
            );
          })}
        </div>
      </section>
    </FadeIn>
  );
}
