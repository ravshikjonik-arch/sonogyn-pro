import { Lock } from "lucide-react";
import Link from "next/link";

import { AIInsightCard } from "@/components/ui/ai-insight-card";
import { AIPanel } from "@/components/ui/ai-panel";
import { buildPatientInsights } from "@/lib/patients/insights";

type Props = {
  meta: {
    date_of_birth?: string | null;
    lmp?: string | null;
    notes?: string | null;
  };
  studiesCount?: number;
};

/** AI Summary карточки пациента: возраст, срок, риски, рекомендации (без LLM). */
export function PatientAiSummary({ meta, studiesCount = 0 }: Props) {
  const insights = buildPatientInsights(meta, studiesCount);

  return (
    <AIPanel
      title="AI Summary пациента"
      subtitle="Автоматическая интерпретация по данным карты"
      badge={
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 rounded-full bg-[var(--ai-gradient-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--ai-violet)]"
        >
          <Lock className="h-3 w-3" />
          PRO
        </Link>
      }
    >
      <div className="space-y-2.5">
        {insights.map((ins, i) => (
          <AIInsightCard key={i} tone={ins.tone} title={ins.title}>
            {ins.text}
          </AIInsightCard>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-[var(--clinical-foreground-muted)]">
        Не является диагнозом. Интерпретация и решение — за лечащим специалистом. Полная AI-сводка
        (история, динамика, факторы риска по гайдлайнам) доступна на PRO.
      </p>
    </AIPanel>
  );
}
