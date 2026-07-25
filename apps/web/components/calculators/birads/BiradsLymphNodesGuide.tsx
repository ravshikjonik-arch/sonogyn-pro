"use client";

import { AlertTriangle, CheckCircle2, Info, Stethoscope } from "lucide-react";

import { BIRADS_LYMPH_NODES_KNOWLEDGE } from "@repo/birads-us";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

function SectionCard({
  title,
  badge,
  children,
  className,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 shadow-sm md:p-5",
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-base font-black text-[var(--clinical-foreground)]">{title}</h2>
        {badge ? <Badge variant="outline">{badge}</Badge> : null}
      </div>
      {children}
    </section>
  );
}

export function BiradsLymphNodesGuide() {
  const k = BIRADS_LYMPH_NODES_KNOWLEDGE;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:px-10">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{k.titleRu}</h1>
          <Badge>BI-RADS US</Badge>
        </div>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">{k.disclaimer}</p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          {k.source.standard} · {k.source.reference}
        </p>
      </header>

      <SectionCard title={k.anatomy.title}>
        <p className="mb-3 text-sm text-[var(--clinical-foreground-muted)]">{k.anatomy.intro}</p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          {k.anatomy.morphology.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title={k.assessmentParameters.title} badge="9 параметров">
        <div className="space-y-5">
          {k.assessmentParameters.items.map((param) => (
            <article key={param.id} className="border-t border-[var(--clinical-border)] pt-4 first:border-0 first:pt-0">
              <h3 className="flex items-start gap-2 text-sm font-bold">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#881337] text-xs text-white">
                  {param.n}
                </span>
                {param.titleRu}
              </h3>
              {"detail" in param && param.detail ? (
                <p className="mt-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{param.detail}</p>
              ) : null}
              {"options" in param && param.options ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--clinical-foreground-muted)]">
                  {param.options.map((opt) => (
                    <li key={opt}>{opt}</li>
                  ))}
                </ul>
              ) : null}
              {"subtypes" in param && param.subtypes ? (
                <div className="mt-2 space-y-2">
                  {param.subtypes.map((sub) => (
                    <div key={sub.label} className="rounded-lg bg-[var(--clinical-muted)] p-3 text-sm">
                      <p className="font-semibold">{sub.label}</p>
                      <p className="mt-1 text-[var(--clinical-foreground-muted)]">{sub.detail}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {"points" in param && param.points ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--clinical-foreground-muted)]">
                  {param.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              ) : null}
              {"spectrum" in param && param.spectrum ? (
                <div className="mt-3 space-y-2">
                  {param.spectrum.map((s) => (
                    <p key={s} className="rounded-lg border border-[var(--clinical-border)] px-3 py-2 text-sm">
                      {s}
                    </p>
                  ))}
                </div>
              ) : null}
              {"note" in param && param.note ? (
                <p className="mt-2 flex items-start gap-2 text-xs text-[var(--clinical-foreground-muted)]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {param.note}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={k.intramammary.title} badge="ИМЛУ">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-[var(--clinical-foreground-muted)]">
          {k.intramammary.localization.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          <span className="font-semibold">Техника: </span>
          <span className="text-[var(--clinical-foreground-muted)]">{k.intramammary.technique}</span>
        </p>
        <p className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-300/50 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-800 dark:bg-emerald-950/30">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
          {k.intramammary.benign}
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--clinical-foreground-muted)]">
          {k.intramammary.malignancy.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <h3 className="mb-2 mt-5 text-sm font-bold">{k.intramammary.architectureBreakdown.title}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {k.intramammary.architectureBreakdown.items.map((block) => (
            <div key={block.title} className="rounded-xl border border-[var(--clinical-border)] p-3">
              <p className="text-sm font-semibold">{block.title}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[var(--clinical-foreground-muted)]">
                {block.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-300/40 bg-emerald-50/80 p-3 text-sm dark:bg-emerald-950/20">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">Доброкачественный паттерн</p>
            <p className="mt-1 text-emerald-950/90 dark:text-emerald-50/90">{k.intramammary.differential.benign}</p>
          </div>
          <div className="rounded-lg border border-red-300/40 bg-red-50/80 p-3 text-sm dark:bg-red-950/20">
            <p className="flex items-center gap-1 font-semibold text-red-900 dark:text-red-100">
              <AlertTriangle className="h-4 w-4" /> Красные флаги
            </p>
            <p className="mt-1 text-red-950/90 dark:text-red-50/90">{k.intramammary.differential.malignant}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={k.axillary.title} badge="аксилла">
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{k.axillary.intro}</p>
        <p className="mt-3 text-sm text-[var(--clinical-foreground-muted)]">{k.axillary.sizeNote}</p>
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm dark:border-amber-800 dark:bg-amber-950/30">
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0" />
          {k.axillary.limitation}
        </p>

        <h3 className="mb-2 mt-5 text-sm font-bold">{k.axillary.surgicalLevels.title}</h3>
        <p className="mb-3 text-xs text-[var(--clinical-foreground-muted)]">{k.axillary.surgicalLevels.landmark}</p>
        <div className="space-y-2">
          {k.axillary.surgicalLevels.levels.map((level) => (
            <div key={level.code} className="flex gap-3 rounded-lg bg-[var(--clinical-muted)] p-3 text-sm">
              <span className="font-black text-[#881337]">{level.code}</span>
              <div>
                <p className="font-semibold">{level.label}</p>
                <p className="mt-0.5 text-[var(--clinical-foreground-muted)]">{level.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={k.reportingExample.title}>
        <div className="space-y-3 text-sm">
          <div>
            <p className="mb-1 font-semibold text-emerald-800 dark:text-emerald-200">Норма / реактивный узел</p>
            <p className="rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-3 leading-relaxed">
              {k.reportingExample.template}
            </p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-red-800 dark:text-red-200">Подозрительный узел</p>
            <p className="rounded-lg border border-red-200/60 bg-red-50/50 p-3 leading-relaxed dark:border-red-900 dark:bg-red-950/20">
              {k.reportingExample.suspiciousTemplate}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
