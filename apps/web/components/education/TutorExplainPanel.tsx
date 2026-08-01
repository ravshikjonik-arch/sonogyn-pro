"use client";

import type { TutorLevel, TutorResponse } from "@repo/ai-tutor";
import { GraduationCap, Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type TutorExplainQuestionPayload = {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceTitle?: string;
  sourceYear?: number;
  userSelectedIndex?: number | null;
  mediaCaption?: string;
  topic?: string;
};

type Props = {
  question: TutorExplainQuestionPayload;
  level?: TutorLevel;
  className?: string;
};

export function TutorExplainPanel({ question, level = "student", className }: Props) {
  const [loading, setLoading] = useState(false);
  const [deepening, setDeepening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TutorResponse | null>(null);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [question.id]);

  const runExplain = useCallback(
    async (deepen: boolean) => {
      setError(null);
      if (deepen) setDeepening(true);
      else setLoading(true);
      try {
        const res = await fetch("/api/ai/tutor", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "explain",
            level,
            deepen,
            question: {
              id: question.id,
              stem: question.stem,
              options: question.options,
              correctIndex: question.correctIndex,
              explanation: question.explanation,
              sourceTitle: question.sourceTitle,
              sourceYear: question.sourceYear,
              userSelectedIndex: question.userSelectedIndex ?? null,
              mediaCaption: question.mediaCaption,
              topic: question.topic,
            },
          }),
        });
        const json = (await res.json().catch(() => null)) as TutorResponse | { error?: string } | null;
        if (!res.ok) {
          setError(
            typeof json === "object" && json && "error" in json && typeof json.error === "string"
              ? json.error
              : "Не удалось получить объяснение.",
          );
          return;
        }
        setResult(json as TutorResponse);
      } catch {
        setError("Сеть недоступна. Попробуйте ещё раз.");
      } finally {
        setLoading(false);
        setDeepening(false);
      }
    },
    [level, question],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading || deepening}
          onClick={() => void runExplain(false)}
          className="gap-1.5"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GraduationCap className="h-3.5 w-3.5" />}
          AI Tutor · Explain
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading || deepening}
          onClick={() => void runExplain(true)}
          className="gap-1.5"
        >
          {deepening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Углубить (LLM)
        </Button>
      </div>

      {error ? <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p> : null}

      {result ? (
        <div className="space-y-3 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--clinical-foreground-muted)]">
            <span className="font-semibold text-[var(--clinical-foreground)]">AI Tutor</span>
            <span>· {result.meta.pipeline}</span>
            <span>· {result.meta.level}</span>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed">{result.answer}</p>
          {result.keyPoints.length ? (
            <ul className="list-disc space-y-1 pl-5 text-[var(--clinical-foreground-muted)]">
              {result.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : null}
          {result.followUpQuestions.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
                Вопросы для закрепления
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-[var(--clinical-foreground-muted)]">
                {result.followUpQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.citations.length ? (
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              Источники:{" "}
              {result.citations.map((c) => `${c.title}${c.year ? ` (${c.year})` : ""}`).join("; ")}
            </p>
          ) : null}
          <p className="text-[11px] leading-relaxed text-[var(--clinical-foreground-muted)]">{result.disclaimer}</p>
        </div>
      ) : null}
    </div>
  );
}
