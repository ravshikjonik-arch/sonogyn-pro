"use client";

import { BookOpen, ExternalLink, GraduationCap, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import {
  BASIC_COURSE_DISCLAIMER,
  ISUOG_BASIC_COURSE,
  yandexDiskViewerUrl,
  type BasicCourseLecture,
} from "@/lib/education/basic-course";

type BasicCourseWidgetProps = {
  variant?: "compact" | "full";
  className?: string;
  initialLectureId?: string;
};

export function BasicCourseWidget({ variant = "full", className, initialLectureId }: BasicCourseWidgetProps) {
  const defaultId =
    ISUOG_BASIC_COURSE.lectures.find((lecture) => lecture.id === initialLectureId)?.id ??
    ISUOG_BASIC_COURSE.lectures[0]?.id ??
    "";
  const [activeId, setActiveId] = useState(defaultId);
  const activeLecture = useMemo(
    () => ISUOG_BASIC_COURSE.lectures.find((lecture) => lecture.id === activeId) ?? ISUOG_BASIC_COURSE.lectures[0],
    [activeId],
  );

  if (variant === "compact") {
    return (
      <Card className={cn("flex flex-col border-[var(--clinical-border)] bg-[var(--clinical-card)]", className)}>
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-orange-50 text-rose-700 dark:from-rose-950/40 dark:to-orange-950/20 dark:text-rose-300">
              <GraduationCap className="h-5 w-5" />
            </div>
            <Badge variant="outline">{ISUOG_BASIC_COURSE.issuer}</Badge>
          </div>
          <CardTitle className="text-base">{ISUOG_BASIC_COURSE.title}</CardTitle>
          <CardDescription className="leading-relaxed">
            Лекция {activeLecture?.number}: {activeLecture?.title}. Презентации ISUOG Basic Training.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto space-y-2">
          <Button className="w-full" asChild>
            <Link href="/library/basic-course">Открыть курс</Link>
          </Button>
          {activeLecture ? (
            <Button variant="secondary" className="w-full" asChild>
              <a href={activeLecture.yandexDiskUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Презентация на Диске
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (!activeLecture) {
    return null;
  }

  return (
    <div className={cn("space-y-8", className)}>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Обучение</Badge>
          <Badge className="bg-rose-600 hover:bg-rose-600">{ISUOG_BASIC_COURSE.issuer}</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
          {ISUOG_BASIC_COURSE.title}
        </h1>
        <p className="text-sm font-medium text-[var(--clinical-primary-deep)]">{ISUOG_BASIC_COURSE.subtitle}</p>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {ISUOG_BASIC_COURSE.description}
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href="/library" className="font-medium text-[var(--clinical-primary)] underline">
            ← Библиотека
          </Link>
          <span className="text-[var(--clinical-foreground-muted)]">·</span>
          <Link href="/reference" className="font-medium text-[var(--clinical-primary)] underline">
            Клин. нормы УЗИ →
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <aside className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--clinical-foreground-muted)]">
            Лекции курса
          </p>
          {ISUOG_BASIC_COURSE.lectures.map((lecture) => (
            <LectureCard
              key={lecture.id}
              lecture={lecture}
              active={lecture.id === activeLecture.id}
              onSelect={() => setActiveId(lecture.id)}
            />
          ))}
          <p className="rounded-2xl border border-dashed border-[var(--clinical-border)] px-4 py-3 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
            Другие лекции ISUOG Basic Training можно добавить по ссылкам с Яндекс.Диска.
          </p>
        </aside>

        <section className="space-y-4">
          <Card className="overflow-hidden border-[var(--clinical-border)] bg-[var(--clinical-card)]">
            <CardHeader className="space-y-3 border-b border-[var(--clinical-border)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-xl">
                    Лекция {activeLecture.number}. {activeLecture.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{activeLecture.subtitle}</CardDescription>
                </div>
                <Badge variant="secondary">{activeLecture.fileName}</Badge>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {activeLecture.topics.map((topic) => (
                  <li
                    key={topic}
                    className="flex items-start gap-2 rounded-xl bg-[var(--clinical-muted)] px-3 py-2 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]"
                  >
                    <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--clinical-primary)]" />
                    {topic}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href={activeLecture.yandexDiskUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Открыть на Яндекс.Диске
                  </a>
                </Button>
                <Button variant="secondary" asChild>
                  <a href={activeLecture.yandexDiskUrl} target="_blank" rel="noopener noreferrer">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Просмотр презентации
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-b border-[var(--clinical-border)] bg-[var(--clinical-muted)] px-4 py-2 text-xs text-[var(--clinical-foreground-muted)]">
                Встроенный просмотр — если Яндекс блокирует iframe, используйте кнопку «Открыть на Яндекс.Диске».
              </div>
              <iframe
                title={`${activeLecture.fileName} — ISUOG Basic Training`}
                src={yandexDiskViewerUrl(activeLecture.yandexDiskUrl)}
                className="h-[min(72vh,760px)] w-full bg-white"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </CardContent>
          </Card>

          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            {BASIC_COURSE_DISCLAIMER}
          </p>
        </section>
      </div>
    </div>
  );
}

function LectureCard({
  lecture,
  active,
  onSelect,
}: {
  lecture: BasicCourseLecture;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition-colors",
        active
          ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)]"
          : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:bg-[var(--clinical-muted)]",
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
        Лекция {lecture.number}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug text-[var(--clinical-foreground)]">{lecture.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">{lecture.subtitle}</p>
    </button>
  );
}
