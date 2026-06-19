"use client";

import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { CAREER_STAGES, type CareerProgress } from "@/lib/career/ladder";

type CareerPathWidgetProps = {
  progress: CareerProgress;
  variant?: "full" | "compact";
};

export function CareerPathWidget({ progress, variant = "full" }: CareerPathWidgetProps) {
  const isCompact = variant === "compact";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-[var(--clinical-border)] bg-gradient-to-br from-white via-[var(--clinical-primary-muted)]/30 to-violet-50/50 dark:from-[var(--clinical-card)] dark:to-slate-900/40",
        isCompact ? "p-5" : "p-6 sm:p-8",
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
            Путь врача
          </p>
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            {progress.headline}
          </h2>
          <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{progress.subline}</p>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--clinical-foreground-muted)]">
              <span>Прогресс</span>
              <span>{progress.progressPercent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/80 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--clinical-primary)] to-violet-600 transition-all duration-700"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>

          {progress.nextStage && progress.lockedPreview.length > 0 ? (
            <ul className="space-y-1.5 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--clinical-primary-deep)]">
                Откроется дальше
              </p>
              {progress.lockedPreview.slice(0, 3).map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-[var(--clinical-foreground-muted)]">
                  <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}

          <Button className="sonogyn-cta-glow mt-2 gap-2" asChild>
            <Link href={progress.ctaHref}>
              {progress.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {!isCompact ? (
          <ol className="grid w-full max-w-lg gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {CAREER_STAGES.map((stage) => {
              const Icon = stage.icon;
              const isCurrent = progress.currentStage === stage.id;
              const isDone = progress.completedStageIds.includes(stage.id);
              const isLocked = !isDone && !isCurrent;

              return (
                <li
                  key={stage.id}
                  className={cn(
                    "relative rounded-2xl border p-4 transition",
                    isCurrent
                      ? "border-[var(--clinical-primary)] bg-white shadow-lg shadow-blue-900/5 dark:bg-slate-950"
                      : isDone
                        ? "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                        : "border-slate-200/80 bg-white/60 opacity-80 dark:border-slate-700 dark:bg-slate-900/30",
                  )}
                >
                  {isCurrent ? (
                    <span className="absolute -top-2 right-3 rounded-full bg-[var(--clinical-primary)] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      Вы здесь
                    </span>
                  ) : null}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        isDone
                          ? "bg-emerald-100 text-emerald-700"
                          : isCurrent
                            ? "bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                            : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {stage.title}
                        <span className="ml-2 text-xs font-normal text-[var(--clinical-foreground-muted)]">
                          {stage.priceLabel}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--clinical-foreground-muted)]">{stage.tagline}</p>
                      {isLocked ? (
                        <p className="mt-1 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                          {stage.badge} · после предыдущего шага
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
