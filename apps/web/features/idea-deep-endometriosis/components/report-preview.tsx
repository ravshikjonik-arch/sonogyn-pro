"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

import { ruAfsCategory } from "../lib/idea-labels-ru";
import type { GeneratedReport } from "../lib/report-engine";

export type ReportPreviewProps = {
  report: GeneratedReport;
  impressionDisplay: string;
  className?: string;
  testId?: string;
};

export function ReportPreview({ report, impressionDisplay, className, testId }: ReportPreviewProps) {
  return (
    <div className={cn("space-y-4", className)} data-testid={testId}>
      <Card className="border-[var(--clinical-border)]">
        <CardHeader>
          <CardTitle className="text-base">Описание по УЗИ (структурировано)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {report.ultrasoundFindingsSummary.map((block) => (
            <section key={block.stepId}>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Шаг {block.stepId}: {block.title}{" "}
                <span
                  className={cn(
                    "ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase",
                    block.abnormal ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900",
                  )}
                >
                  {block.abnormal ? "Внимание" : "Без красных флагов"}
                </span>
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-[var(--clinical-foreground-muted)]">
                {block.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          ))}
        </CardContent>
      </Card>

      <Card className="border-[var(--clinical-border)]">
        <CardHeader>
          <CardTitle className="text-base">Заключение</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">{impressionDisplay}</p>
        </CardContent>
      </Card>

      <Card className="border-[var(--clinical-border)]">
        <CardHeader>
          <CardTitle className="text-base">Риск (по правилам модуля, не диагноз)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">Условная категория (AFS-подобная шкала модуля):</span>{" "}
            <span className="rounded-full bg-[var(--clinical-primary-muted)] px-2 py-0.5 font-bold text-[var(--clinical-primary-deep)]">
              {ruAfsCategory(report.riskSummary.afsCategory)}
            </span>{" "}
            <span className="text-[var(--clinical-foreground-muted)]" title={report.riskSummary.rationale.join(" ")}>
              (баллы {report.riskSummary.afsPoints})
            </span>
          </p>
          <p className="text-[var(--clinical-foreground-muted)]">{report.riskSummary.enzianPreliminary}</p>
          <ul className="list-disc pl-5 text-[var(--clinical-foreground-muted)]">
            {report.riskSummary.rationale.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-[var(--clinical-border)]">
        <CardHeader>
          <CardTitle className="text-base">Заметки для планирования вмешательства</CardTitle>
        </CardHeader>
        <CardContent>
          {report.surgicalPlanningNotes.length === 0 ? (
            <p className="text-sm text-[var(--clinical-foreground-muted)]">Автоматических примечаний нет.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--clinical-foreground-muted)]">
              {report.surgicalPlanningNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
