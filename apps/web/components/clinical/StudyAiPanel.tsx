"use client";

import { Lock, Wand2 } from "lucide-react";
import Link from "next/link";

import { AIInsightCard } from "@/components/ui/ai-insight-card";
import { AIPanel } from "@/components/ui/ai-panel";
import { openCopilot } from "@/lib/ai/copilot-bus";

type Props = {
  studyTitle: string;
  studyType: string;
  imagesCount: number;
};

/** Правая AI-панель исследования: находки, рекомендации, варианты заключения. */
export function StudyAiPanel({ studyTitle, studyType, imagesCount }: Props) {
  function analyze() {
    openCopilot({
      prompt: `Проанализируй исследование «${studyTitle}» (${studyType}). Предложи ключевые находки, на что обратить внимание и варианты заключения по гайдлайнам.`,
      command: "analyze",
    });
  }

  return (
    <AIPanel
      title="AI-анализ исследования"
      subtitle={studyType}
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
        <AIInsightCard tone="info" title={`Готов проанализировать ${imagesCount} снимк(ов)`}>
          Загрузите медиа в серию — AI подскажет ключевые находки.
        </AIInsightCard>
        <AIInsightCard tone="recommendation" title="Варианты заключения">
          Структура: находки → интерпретация → рекомендации. Классификации только по гайдлайнам (O‑RADS/BI‑RADS/IOTA).
        </AIInsightCard>
      </div>
      <button
        type="button"
        onClick={analyze}
        className="ai-gradient-bg mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
      >
        <Wand2 className="h-4 w-4" />
        Анализировать с Sonogyn AI
      </button>
      <p className="mt-3 text-[11px] leading-relaxed text-[var(--clinical-foreground-muted)]">
        Ассистивно, не диагноз. Полный AI-анализ снимков и авто-заключение — на PRO.
      </p>
    </AIPanel>
  );
}
