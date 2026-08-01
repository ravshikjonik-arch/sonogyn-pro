"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  RotateCcw,
  Stethoscope,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  filterQuizQuestions,
  formatQuizCategory,
  mergeQuizProgress,
  quizProgressStats,
  resolveQuizSource,
  type QuizAnswerRecord,
  type QuizBank,
  type QuizLevel,
  type QuizProgress,
  type QuizReviewMode,
} from "@repo/education-quiz";
import { cn } from "@/lib/utils/cn";

async function fetchCloudProgress(storageKey: string): Promise<QuizProgress | null> {
  try {
    const res = await fetch(
      `/api/education/exam-attempts?blueprintId=${encodeURIComponent(storageKey)}&mode=self_assessment`,
      { credentials: "same-origin" },
    );
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const json = (await res.json()) as { attempts?: Array<{ answers?: QuizProgress }> };
    return json.attempts?.[0]?.answers ?? {};
  } catch {
    return null;
  }
}

function syncCloudProgress(storageKey: string, progress: QuizProgress, level: QuizLevel) {
  const stats = quizProgressStats(progress, Object.keys(progress));
  void fetch("/api/education/exam-attempts", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blueprintId: storageKey,
      mode: "self_assessment",
      level,
      answers: progress,
      correctCount: stats.correct,
      totalQuestions: stats.answered,
      score: stats.percentCorrect,
    }),
  }).catch(() => {
    /* offline / unauth — localStorage remains source of truth */
  });
}

type SelfAssessmentWidgetProps = {
  bank: QuizBank;
  /** localStorage key — уникальный для каждого quiz-bank (как PROGRESS_KEY в BasicCourseWidget). */
  storageKey: string;
  title?: string;
  description?: string;
  disclaimer?: string;
  relatedLinks?: Array<{ href: string; label: string }>;
  className?: string;
};

function loadProgress(storageKey: string): QuizProgress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? "{}") as QuizProgress;
  } catch {
    return {};
  }
}

function saveProgress(storageKey: string, progress: QuizProgress) {
  localStorage.setItem(storageKey, JSON.stringify(progress));
}

export function SelfAssessmentWidget({
  bank,
  storageKey,
  title = "Самопроверка",
  description,
  disclaimer,
  relatedLinks,
  className,
}: SelfAssessmentWidgetProps) {
  const [level, setLevel] = useState<QuizLevel>("student");
  const [reviewMode, setReviewMode] = useState<QuizReviewMode>("all");
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState<QuizProgress>({});

  useEffect(() => {
    let cancelled = false;
    const local = loadProgress(storageKey);
    setProgress(local);

    void (async () => {
      const cloud = await fetchCloudProgress(storageKey);
      if (cancelled || cloud == null) return;
      const merged = mergeQuizProgress(local, cloud);
      setProgress(merged);
      saveProgress(storageKey, merged);
      if (Object.keys(merged).length > Object.keys(cloud).length) {
        syncCloudProgress(storageKey, merged, level);
      }
    })();

    return () => {
      cancelled = true;
    };
    // level intentionally omitted — initial sync uses current level for optional metadata only
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount on storageKey change
  }, [storageKey]);

  const levelQuestions = useMemo(
    () => bank.questions.filter((q) => q.level === level),
    [bank.questions, level],
  );

  const questions = useMemo(
    () => filterQuizQuestions(levelQuestions, progress, reviewMode),
    [levelQuestions, progress, reviewMode],
  );

  const questionIds = useMemo(() => levelQuestions.map((q) => q.id), [levelQuestions]);
  const stats = useMemo(() => quizProgressStats(progress, questionIds), [progress, questionIds]);

  const current = questions[index];
  const answered = selectedIndex !== null;
  const isCorrect = answered && selectedIndex === current?.correctIndex;
  const source = current ? resolveQuizSource(bank, current.sourceId) : undefined;

  const resetQuestionState = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  useEffect(() => {
    setIndex(0);
    resetQuestionState();
  }, [level, reviewMode, resetQuestionState]);

  useEffect(() => {
    if (index >= questions.length && questions.length > 0) {
      setIndex(questions.length - 1);
      resetQuestionState();
    }
  }, [index, questions.length, resetQuestionState]);

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (!current || selectedIndex !== null) return;
      setSelectedIndex(optionIndex);
      const record: QuizAnswerRecord = optionIndex === current.correctIndex ? "correct" : "incorrect";
      setProgress((prev) => {
        const next = { ...prev, [current.id]: record };
        saveProgress(storageKey, next);
        syncCloudProgress(storageKey, next, level);
        return next;
      });
    },
    [current, selectedIndex, storageKey, level],
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= questions.length) return;
      setIndex(nextIndex);
      resetQuestionState();
    },
    [questions.length, resetQuestionState],
  );

  const handleResetProgress = useCallback(() => {
    if (!window.confirm("Сбросить прогресс по всем вопросам этого банка на этом устройстве и в облаке?")) return;
    setProgress({});
    localStorage.removeItem(storageKey);
    setIndex(0);
    setReviewMode("all");
    resetQuestionState();
    void fetch(
      `/api/education/exam-attempts?blueprintId=${encodeURIComponent(storageKey)}&mode=self_assessment`,
      { method: "DELETE", credentials: "same-origin" },
    ).catch(() => undefined);
  }, [storageKey, resetQuestionState]);

  const reviewModes: Array<{ id: QuizReviewMode; label: string; count: number }> = useMemo(
    () => [
      { id: "all", label: "Все", count: levelQuestions.length },
      {
        id: "new",
        label: "Новые",
        count: filterQuizQuestions(levelQuestions, progress, "new").length,
      },
      {
        id: "mistakes",
        label: "Ошибки",
        count: filterQuizQuestions(levelQuestions, progress, "mistakes").length,
      },
    ],
    [levelQuestions, progress],
  );

  if (!levelQuestions.length) {
    return (
      <Card className={cn("border-[var(--clinical-border)] bg-[var(--clinical-card)]", className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Нет вопросов для выбранного уровня.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!questions.length) {
    return (
      <Card className={cn("border-[var(--clinical-border)] bg-[var(--clinical-card)]", className)}>
        <CardHeader className="space-y-4">
          <CardTitle>{title}</CardTitle>
          <LevelToggles level={level} onLevelChange={setLevel} />
          <ReviewModeToggles modes={reviewModes} active={reviewMode} onChange={setReviewMode} />
          <CardDescription>
            {reviewMode === "mistakes"
              ? "Нет вопросов с ошибками — отлично!"
              : "Все вопросы этого уровня уже пройдены. Переключитесь на «Ошибки» или «Все»."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" size="sm" onClick={() => setReviewMode("all")}>
            Показать все вопросы
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-[var(--clinical-border)] bg-[var(--clinical-card)]", className)}>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            {description ? (
              <CardDescription className="max-w-2xl leading-relaxed">{description}</CardDescription>
            ) : null}
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              v{bank.version} · обновлено {bank.lastReviewed} · {levelQuestions.length} вопросов на уровень
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <Badge variant="outline">{stats.percentAnswered}% пройдено</Badge>
            {stats.answered > 0 ? (
              <span className="text-xs text-[var(--clinical-foreground-muted)]">
                {stats.correct}/{stats.answered} верных ({stats.percentCorrect}%)
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={stats.percentAnswered} className="h-1.5" />
          <p className="text-xs text-[var(--clinical-foreground-muted)]">
            Отвечено {stats.answered} из {stats.total} на текущем уровне
          </p>
        </div>

        <LevelToggles level={level} onLevelChange={setLevel} />
        <ReviewModeToggles modes={reviewModes} active={reviewMode} onChange={setReviewMode} />

        {relatedLinks?.length ? (
          <div className="flex flex-wrap gap-2 text-xs">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-[var(--clinical-border)] px-3 py-1 font-medium text-[var(--clinical-primary)] hover:bg-[var(--clinical-muted)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-2 text-xs text-[var(--clinical-foreground-muted)]">
          <span>
            Вопрос {index + 1} из {questions.length}
            {reviewMode !== "all" ? ` · режим «${reviewModes.find((m) => m.id === reviewMode)?.label}»` : ""}
          </span>
          <span className="rounded-full bg-[var(--clinical-muted)] px-2 py-0.5">
            {formatQuizCategory(current.category)}
          </span>
        </div>

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

        <p className="text-base font-medium leading-relaxed text-[var(--clinical-foreground)]">{current.question}</p>

        <ul className="space-y-2">
          {current.options.map((option, optionIndex) => {
            const isSelected = selectedIndex === optionIndex;
            const isAnswer = optionIndex === current.correctIndex;
            let variant: "default" | "success" | "error" | "muted" = "default";
            if (answered) {
              if (isAnswer) variant = "success";
              else if (isSelected) variant = "error";
              else variant = "muted";
            }

            return (
              <li key={`${current.id}-${optionIndex}`}>
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => handleSelect(optionIndex)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3 text-left text-sm transition-colors",
                    variant === "default" &&
                      "border-[var(--clinical-border)] bg-[var(--clinical-surface)] hover:border-[var(--clinical-primary)]",
                    variant === "success" &&
                      "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
                    variant === "error" &&
                      "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100",
                    variant === "muted" && "border-[var(--clinical-border)] opacity-60",
                  )}
                >
                  <span className="mr-2 font-semibold">{String.fromCharCode(65 + optionIndex)}.</span>
                  {option}
                </button>
              </li>
            );
          })}
        </ul>

        {answered ? (
          <div
            className={cn(
              "space-y-3 rounded-2xl border p-4 text-sm",
              isCorrect
                ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30"
                : "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30",
            )}
          >
            <div className="flex items-center gap-2 font-semibold">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Верно
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-amber-600" />
                  Неверно — правильный ответ: {String.fromCharCode(65 + current.correctIndex)}
                </>
              )}
            </div>
            <p className="leading-relaxed text-[var(--clinical-foreground-muted)]">{current.explanation}</p>
            {source ? (
              <p className="text-xs text-[var(--clinical-foreground-muted)]">
                <span className="font-semibold text-[var(--clinical-foreground)]">Источник: </span>
                {source.title}
                {source.year ? ` (${source.year})` : ""}
                {source.status ? ` — ${source.status}` : ""}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={index === 0} onClick={() => goTo(index - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {answered && index < questions.length - 1 ? (
            <Button type="button" onClick={() => goTo(index + 1)}>
              Следующий
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : null}
          {!answered && index < questions.length - 1 ? (
            <Button type="button" variant="secondary" onClick={() => goTo(index + 1)}>
              Пропустить
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : null}
          {answered && index === questions.length - 1 ? (
            <p className="text-sm text-[var(--clinical-foreground-muted)]">Конец списка в текущем режиме.</p>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={handleResetProgress} className="ml-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            Сбросить прогресс
          </Button>
        </div>

        {disclaimer ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            {disclaimer}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LevelToggles({ level, onLevelChange }: { level: QuizLevel; onLevelChange: (level: QuizLevel) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <LevelToggle
        active={level === "student"}
        onClick={() => onLevelChange("student")}
        icon={<GraduationCap className="h-4 w-4" />}
        label="Для студента"
      />
      <LevelToggle
        active={level === "doctor"}
        onClick={() => onLevelChange("doctor")}
        icon={<Stethoscope className="h-4 w-4" />}
        label="Для врача"
      />
    </div>
  );
}

function ReviewModeToggles({
  modes,
  active,
  onChange,
}: {
  modes: Array<{ id: QuizReviewMode; label: string; count: number }>;
  active: QuizReviewMode;
  onChange: (mode: QuizReviewMode) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          disabled={mode.id !== "all" && mode.count === 0}
          onClick={() => onChange(mode.id)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            active === mode.id
              ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
              : "border-[var(--clinical-border)] hover:bg-[var(--clinical-muted)]",
            mode.id !== "all" && mode.count === 0 && "cursor-not-allowed opacity-40",
          )}
        >
          {mode.label} ({mode.count})
        </button>
      ))}
    </div>
  );
}

function LevelToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
          : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:bg-[var(--clinical-muted)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
