"use client";

import {
  answerExamQuestion,
  finishExam,
  getCurrentQuestion,
  goToExamQuestion,
  isExamTimedOut,
  startExam,
  type ExamBlueprint,
  type ExamMode,
  type ExamScore,
  type ExamSession,
} from "@repo/examination-engine";
import type { QuizLevel } from "@repo/education-quiz";
import { CheckCircle2, Clock3, ImageIcon, RotateCcw, Trophy, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";

type Props = {
  blueprint: ExamBlueprint;
  className?: string;
};

function persistExamAttempt(
  blueprint: ExamBlueprint,
  session: ExamSession,
  score: ExamScore,
) {
  void fetch("/api/education/exam-attempts", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blueprintId: blueprint.id,
      mode: session.mode,
      level: session.level === "all" ? undefined : session.level,
      answers: score.progress,
      score: score.percentCorrect,
      totalQuestions: score.total,
      correctCount: score.correct,
      finished: true,
    }),
  }).catch(() => undefined);
}

function formatRemaining(endsAt: string | null, nowMs: number): string | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - nowMs;
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ExamEngineWidget({ blueprint, className }: Props) {
  const [mode, setMode] = useState<ExamMode>("quick");
  const [level, setLevel] = useState<QuizLevel | "all">("all");
  const [session, setSession] = useState<ExamSession | null>(null);
  const [score, setScore] = useState<ExamScore | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!session?.endsAt || session.status !== "in_progress") return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [session?.endsAt, session?.status]);

  useEffect(() => {
    if (!session || session.status !== "in_progress") return;
    if (!isExamTimedOut(session, new Date(nowMs))) return;
    const finished = finishExam(blueprint, session, new Date(nowMs));
    setSession(finished.session);
    setScore(finished.score);
    persistExamAttempt(blueprint, finished.session, finished.score);
  }, [blueprint, nowMs, session]);

  const current = useMemo(
    () => (session ? getCurrentQuestion(blueprint, session) : null),
    [blueprint, session],
  );

  const answeredCount = session ? Object.keys(session.selections).length : 0;
  const remaining = formatRemaining(session?.endsAt ?? null, nowMs);

  const handleStart = useCallback(() => {
    const next = startExam({ blueprint, mode, level });
    setSession(next);
    setScore(null);
    setNowMs(Date.now());
  }, [blueprint, level, mode]);

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (!session || !current) return;
      setSession(answerExamQuestion(blueprint, session, optionIndex));
    },
    [blueprint, current, session],
  );

  const handleFinish = useCallback(() => {
    if (!session) return;
    const finished = finishExam(blueprint, session);
    setSession(finished.session);
    setScore(finished.score);
    persistExamAttempt(blueprint, finished.session, finished.score);
  }, [blueprint, session]);

  const handleReset = useCallback(() => {
    setSession(null);
    setScore(null);
  }, []);

  if (!session) {
    return (
      <Card className={cn("border-[var(--clinical-border)] bg-[var(--clinical-card)]", className)}>
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{blueprint.title}</CardTitle>
              <CardDescription className="mt-1 max-w-2xl leading-relaxed">
                Режим экзамена: без подсказок до финиша. Image-MCQ используют учебные схемы атласа (не снимки пациентов).
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <ImageIcon className="h-3.5 w-3.5" />
              image Q
            </Badge>
          </div>
          <p className="text-xs text-[var(--clinical-foreground-muted)]">
            Проходной балл {blueprint.passingScore}% · quick: {blueprint.quickCount} вопросов
            {blueprint.timeLimitMin ? ` · certification: до ${blueprint.timeLimitMin} мин` : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "quick" as const, label: "Quick test" },
                { id: "certification" as const, label: "Certification" },
                { id: "mock" as const, label: "Mock exam" },
              ] as const
            ).map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={mode === item.id ? "default" : "outline"}
                onClick={() => setMode(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "all" as const, label: "Все уровни" },
                { id: "student" as const, label: "Студент" },
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
          <Button type="button" onClick={handleStart} className="font-semibold">
            Начать экзамен
          </Button>
          <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
            Не диагноз и не сертификат госрегулятора — учебный тренажёр SonoGyn Pro. Интерпретация остаётся за специалистом.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (session.status === "finished" && score) {
    return (
      <Card className={cn("border-[var(--clinical-border)] bg-[var(--clinical-card)]", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5 text-[var(--clinical-primary)]" />
            Результат · {session.mode}
          </CardTitle>
          <CardDescription>
            {score.passed ? "Проходной балл набран." : "Проходной балл не набран — разберите ошибки в самопроверке."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Верно" value={`${score.correct}/${score.total}`} />
            <Stat label="Процент" value={`${score.percentCorrect}%`} />
            <Stat label="Без ответа" value={String(score.unanswered)} />
          </div>
          <Progress value={score.percentCorrect} className="h-2" />
          <ul className="space-y-2 text-sm">
            {session.questionIds.map((id) => {
              const q = blueprint.bank.questions.find((item) => item.id === id);
              const sel = session.selections[id];
              if (!q) return null;
              return (
                <li
                  key={id}
                  className="flex items-start gap-2 rounded-lg border border-[var(--clinical-border)] px-3 py-2"
                >
                  {sel?.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  )}
                  <div>
                    <p className="font-medium">{q.question}</p>
                    <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{q.explanation}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <Button type="button" variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Новая попытка
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!current) {
    return null;
  }

  const selected = session.selections[current.id]?.selectedIndex ?? null;
  const progressPct = session.questionIds.length
    ? Math.round((answeredCount / session.questionIds.length) * 100)
    : 0;

  return (
    <Card className={cn("border-[var(--clinical-border)] bg-[var(--clinical-card)]", className)}>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">
            Вопрос {session.currentIndex + 1} / {session.questionIds.length}
          </CardTitle>
          <div className="flex items-center gap-2">
            {remaining ? (
              <Badge variant="outline" className="gap-1 font-mono">
                <Clock3 className="h-3.5 w-3.5" />
                {remaining}
              </Badge>
            ) : null}
            <Badge variant="secondary">{session.mode}</Badge>
          </div>
        </div>
        <Progress value={progressPct} className="h-1.5" />
      </CardHeader>
      <CardContent className="space-y-5">
        {current.media?.type === "image" ? (
          <figure className="overflow-hidden rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.media.src}
              alt={current.media.alt}
              className="mx-auto max-h-72 w-full object-contain p-3"
            />
            {current.media.caption ? (
              <figcaption className="border-t border-[var(--clinical-border)] px-3 py-2 text-xs text-[var(--clinical-foreground-muted)]">
                {current.media.caption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <p className="text-base font-medium leading-relaxed">{current.question}</p>

        <ul className="space-y-2">
          {current.options.map((option, optionIndex) => {
            const isSelected = selected === optionIndex;
            return (
              <li key={option}>
                <button
                  type="button"
                  disabled={selected !== null}
                  onClick={() => handleSelect(optionIndex)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left text-sm transition",
                    isSelected
                      ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)]/10"
                      : "border-[var(--clinical-border)] hover:bg-[var(--clinical-muted)]",
                    selected !== null && !isSelected ? "opacity-60" : "",
                  )}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={session.currentIndex === 0}
              onClick={() => setSession(goToExamQuestion(session, session.currentIndex - 1))}
            >
              Назад
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={session.currentIndex >= session.questionIds.length - 1}
              onClick={() => setSession(goToExamQuestion(session, session.currentIndex + 1))}
            >
              Далее
            </Button>
          </div>
          <Button type="button" onClick={handleFinish} className="font-semibold">
            Завершить ({answeredCount}/{session.questionIds.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--clinical-border)] px-3 py-2">
      <p className="text-xs text-[var(--clinical-foreground-muted)]">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
