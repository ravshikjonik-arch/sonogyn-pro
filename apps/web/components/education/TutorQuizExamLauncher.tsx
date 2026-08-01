"use client";

import type { TutorQuizExamResponse } from "@repo/ai-tutor";
import type { ExamBlueprint } from "@repo/examination-engine";
import type { QuizBank, QuizLevel } from "@repo/education-quiz";
import { Loader2, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { ExamEngineWidget } from "@/components/education/ExamEngineWidget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type Props = {
  bank: QuizBank;
  className?: string;
};

function toBlueprint(session: TutorQuizExamResponse, sourceBank: QuizBank): ExamBlueprint {
  const byId = new Map(sourceBank.questions.map((q) => [q.id, q]));
  const questions = session.questions.map((q) => {
    const original = byId.get(q.id);
    return (
      original ?? {
        id: q.id,
        category: "tutor",
        level: "student" as QuizLevel,
        question: q.stem,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        sourceId: sourceBank.sources[0]?.id ?? "tutor",
      }
    );
  });

  return {
    id: `tutor-${session.mode}-${sourceBank.topic}`,
    title: `AI Tutor · ${session.mode === "exam" ? "Exam" : "Quiz"} · ${session.topic ?? sourceBank.topic}`,
    bank: {
      ...sourceBank,
      questions,
    },
    quickCount: questions.length,
    passingScore: session.passingScore,
    timeLimitMin: session.timeLimitMin ?? undefined,
    preferImageQuestions: true,
  };
}

export function TutorQuizExamLauncher({ bank, className }: Props) {
  const [mode, setMode] = useState<"quiz" | "exam">("quiz");
  const [level, setLevel] = useState<"student" | "resident" | "doctor">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<ExamBlueprint | null>(null);

  const payloadQuestions = useMemo(
    () =>
      bank.questions.map((q) => ({
        id: q.id,
        stem: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        sourceTitle: bank.sources.find((s) => s.id === q.sourceId)?.title,
        sourceYear: bank.sources.find((s) => s.id === q.sourceId)?.year,
        level: q.level,
        mediaCaption: q.media?.caption ?? q.media?.alt,
      })),
    [bank],
  );

  const launch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          level,
          topic: bank.topic,
          count: mode === "quiz" ? 8 : 15,
          questions: payloadQuestions,
        }),
      });
      const json = (await res.json().catch(() => null)) as TutorQuizExamResponse | { error?: string } | null;
      if (!res.ok) {
        setError(
          typeof json === "object" && json && "error" in json && typeof json.error === "string"
            ? json.error
            : "Не удалось собрать сессию Tutor.",
        );
        return;
      }
      setBlueprint(toBlueprint(json as TutorQuizExamResponse, bank));
    } catch {
      setError("Сеть недоступна.");
    } finally {
      setLoading(false);
    }
  }, [bank, level, mode, payloadQuestions]);

  if (blueprint) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={() => setBlueprint(null)}>
            Новая сессия Tutor
          </Button>
        </div>
        <ExamEngineWidget blueprint={blueprint} />
      </div>
    );
  }

  return (
    <Card className={cn("border-[var(--clinical-border)] bg-[var(--clinical-card)]", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-4 w-4 text-[var(--clinical-primary)]" />
          AI Tutor · Quiz / Exam
        </CardTitle>
        <CardDescription>
          Собирает учебную сессию из банка модуля (rule-first). Для exam включается таймер ExamEngine.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={mode === "quiz" ? "default" : "outline"} onClick={() => setMode("quiz")}>
            Quiz
          </Button>
          <Button type="button" size="sm" variant={mode === "exam" ? "default" : "outline"} onClick={() => setMode("exam")}>
            Exam
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "student" as const, label: "Студент" },
              { id: "resident" as const, label: "Ординатор" },
              { id: "doctor" as const, label: "Врач" },
            ] as const
          ).map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={level === item.id ? "secondary" : "ghost"}
              onClick={() => setLevel(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        <Button type="button" onClick={() => void launch()} disabled={loading} className="gap-2 font-semibold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Собрать сессию
        </Button>
      </CardContent>
    </Card>
  );
}
