"use client";

import type { MusaAdenomyosisReport } from "@repo/musa-framework";
import { scoreBadgeClassName } from "@repo/musa-framework";

import { Badge } from "@/components/ui/badge";
import { MusaCard } from "@/components/musa/MusaCard";

type AutoReportPreviewProps = {
  report: MusaAdenomyosisReport | null;
};

export function AutoReportPreview({ report }: AutoReportPreviewProps) {
  if (!report) {
    return (
      <MusaCard title="Структурированное заключение">
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Отметьте признаки и нажмите «Сформировать протокол».
        </p>
      </MusaCard>
    );
  }

  return (
    <MusaCard title="Auto Report · MUSA Adenomyosis">
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge className={`border ${scoreBadgeClassName(report.badgeColor)}`}>
          {report.probabilityLabelRu}
        </Badge>
        <Badge variant="outline">
          Score {report.sonogynScore}/{report.maxScore}
        </Badge>
      </div>
      <p className="text-sm font-medium">{report.suggestedDiagnosis}</p>
      <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-black/5 p-4 text-xs leading-relaxed dark:bg-white/5">
        {report.structuredReport}
      </pre>
      <p className="mt-3 text-xs text-[var(--clinical-foreground-muted)]">{report.disclaimer}</p>
    </MusaCard>
  );
}
