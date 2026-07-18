"use client";

import { AlertTriangle, CheckCircle2, FileText, ListOrdered } from "lucide-react";

import { getTerminologyGuide } from "@repo/musa-framework";

import { MusaCard } from "@/components/musa/MusaCard";
import { Badge } from "@/components/ui/badge";

export function MusaTerminologyGuide() {
  const guide = getTerminologyGuide();

  return (
    <div className="space-y-6">
      <MusaCard title={guide.headline} badge="MUSA · RU">
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{guide.subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {guide.avoidPhrases.map((phrase) => (
            <Badge key={phrase} variant="outline" className="border-amber-400/60 text-amber-900 dark:text-amber-100">
              ✕ {phrase}
            </Badge>
          ))}
        </div>
      </MusaCard>

      <MusaCard title={guide.whyNotWork.title}>
        <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--clinical-foreground-muted)]">
          {guide.whyNotWork.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p className="mt-4 rounded-lg border border-[var(--clinical-primary)]/30 bg-[var(--clinical-primary-muted)]/25 px-3 py-2 text-sm font-semibold">
          {guide.whyNotWork.principle}
        </p>
      </MusaCard>

      <MusaCard title={guide.protocolChecklist.title}>
        <ol className="space-y-3">
          {guide.protocolChecklist.items.map((item) => (
            <li key={item.n} className="flex gap-3 text-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--clinical-primary)] text-xs font-bold text-white">
                {item.n}
              </span>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-0.5 text-[var(--clinical-foreground-muted)]">{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-50">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {guide.protocolChecklist.fibroidNote}
        </p>
      </MusaCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <MusaCard title={guide.directSigns.title}>
          <p className="mb-3 text-sm text-[var(--clinical-foreground-muted)]">{guide.directSigns.intro}</p>
          <ul className="space-y-3">
            {guide.directSigns.items.map((item) => (
              <li key={item.musaTerm} className="rounded-lg border border-[var(--clinical-border)] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                  {item.musaTerm}
                </p>
                <p className="mt-1 font-semibold">{item.labelRu}</p>
                <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">{item.description}</p>
              </li>
            ))}
          </ul>
        </MusaCard>

        <MusaCard title={guide.indirectSigns.title}>
          <p className="mb-3 text-sm text-[var(--clinical-foreground-muted)]">{guide.indirectSigns.intro}</p>
          <ul className="space-y-2">
            {guide.indirectSigns.items.map((item) => (
              <li key={item.musaTerm} className="flex items-start gap-2 text-sm">
                <ListOrdered className="mt-0.5 h-4 w-4 shrink-0 text-[var(--clinical-primary)]" />
                <span>
                  <span className="font-semibold">{item.labelRu}</span>
                  <span className="text-[var(--clinical-foreground-muted)]"> · {item.musaTerm}</span>
                </span>
              </li>
            ))}
          </ul>
        </MusaCard>
      </div>

      <MusaCard title={guide.junctionalZoneGuide.title}>
        <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--clinical-foreground-muted)]">
          {guide.junctionalZoneGuide.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-2 sm:grid-cols-3">
          {guide.junctionalZoneGuide.classification.map((row) => (
            <div key={row.label} className="rounded-lg bg-[var(--clinical-muted)] p-3 text-sm">
              <dt className="font-semibold">{row.label}</dt>
              <dd className="mt-1 text-[var(--clinical-foreground-muted)]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </MusaCard>

      <MusaCard title={guide.imaging3d.title}>
        <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--clinical-foreground-muted)]">
          {guide.imaging3d.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </MusaCard>

      <MusaCard title={guide.exampleReport.title}>
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-red-300/50 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-950/30">
            <p className="mb-1 flex items-center gap-1 font-semibold text-red-900 dark:text-red-100">
              <AlertTriangle className="h-4 w-4" /> Неверно
            </p>
            <p className="text-red-950 dark:text-red-50">{guide.exampleReport.bad}</p>
          </div>
          <div className="rounded-lg border border-emerald-300/50 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
            <p className="mb-1 flex items-center gap-1 font-semibold text-emerald-900 dark:text-emerald-100">
              <CheckCircle2 className="h-4 w-4" /> Верно (MUSA)
            </p>
            <p className="leading-relaxed text-emerald-950 dark:text-emerald-50">{guide.exampleReport.good}</p>
          </div>
          <p className="flex items-start gap-2 text-[var(--clinical-foreground-muted)]">
            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
            {guide.exampleReport.closing}
          </p>
        </div>
      </MusaCard>

      <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">{guide.teamNote}</p>
    </div>
  );
}
