"use client";

import {
  BookOpen,
  CheckCircle2,
  Circle,
  ExternalLink,
  GraduationCap,
  Layers,
  PlayCircle,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import {
  BASIC_COURSE_DISCLAIMER,
  courseProgressPercent,
  ISUOG_BASIC_COURSE,
  ISUOG_COURSE_MODULES,
  lectureProgressPercent,
  yandexDiskViewerUrl,
  type BasicCourseLecture,
  type BasicCourseTopic,
} from "@/lib/education/basic-course";

const PROGRESS_KEY = "sonogyn-isuog-topic-progress";

type CourseTab = "program" | "lecture" | "practice";

type BasicCourseWidgetProps = {
  variant?: "compact" | "full";
  className?: string;
  initialLectureId?: string;
};

function loadProgress(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function BasicCourseWidget({ variant = "full", className, initialLectureId }: BasicCourseWidgetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lectureFromUrl = searchParams.get("lecture") ?? initialLectureId;
  const tabFromUrl = (searchParams.get("tab") as CourseTab | null) ?? "program";

  const defaultId =
    ISUOG_BASIC_COURSE.lectures.find((lecture) => lecture.id === lectureFromUrl)?.id ??
    ISUOG_BASIC_COURSE.lectures[0]?.id ??
    "";

  const [activeId, setActiveId] = useState(defaultId);
  const [activeTab, setActiveTab] = useState<CourseTab>(tabFromUrl);
  const [topicDone, setTopicDone] = useState<Record<string, boolean>>({});
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => {
    setTopicDone(loadProgress());
  }, []);

  useEffect(() => {
    if (lectureFromUrl && lectureFromUrl !== activeId) {
      setActiveId(lectureFromUrl);
    }
  }, [lectureFromUrl, activeId]);

  useEffect(() => {
    if (tabFromUrl !== activeTab) setActiveTab(tabFromUrl);
  }, [tabFromUrl, activeTab]);

  const activeLecture = useMemo(
    () => ISUOG_BASIC_COURSE.lectures.find((lecture) => lecture.id === activeId) ?? ISUOG_BASIC_COURSE.lectures[0],
    [activeId],
  );

  const navigate = useCallback(
    (lectureId: string, tab: CourseTab) => {
      setActiveId(lectureId);
      setActiveTab(tab);
      router.replace(
        `/library/basic-course?lecture=${encodeURIComponent(lectureId)}&tab=${tab}`,
        { scroll: false },
      );
    },
    [router],
  );

  const toggleTopic = useCallback((lectureId: string, topicId: string) => {
    const key = `${lectureId}::${topicId}`;
    setTopicDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const lectureProgress = useMemo(
    () => (activeLecture ? lectureProgressPercent(activeLecture, topicDone) : 0),
    [activeLecture, topicDone],
  );
  const courseProgress = useMemo(() => courseProgressPercent(topicDone), [topicDone]);

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
            Лекция {activeLecture?.number}: {activeLecture?.title}. Прогресс курса: {courseProgress}%.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto space-y-2">
          <Button className="w-full" asChild>
            <Link href={`/library/basic-course?lecture=${activeLecture?.id ?? ""}&tab=program`}>Открыть курс</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!activeLecture) return null;

  return (
    <div className={cn("space-y-8", className)}>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Обучение</Badge>
          <Badge className="bg-rose-600 hover:bg-rose-600">{ISUOG_BASIC_COURSE.issuer}</Badge>
          <Badge variant="secondary">Курс: {courseProgress}%</Badge>
          <Badge variant="secondary">Лекция: {lectureProgress}%</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
          {ISUOG_BASIC_COURSE.title}
        </h1>
        <p className="text-sm font-medium text-[var(--clinical-primary-deep)]">{ISUOG_BASIC_COURSE.subtitle}</p>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {ISUOG_BASIC_COURSE.description}
        </p>
        <div className="h-2 max-w-md overflow-hidden rounded-full bg-[var(--clinical-muted)]">
          <div
            className="h-full rounded-full bg-[var(--clinical-primary)] transition-all"
            style={{ width: `${courseProgress}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href="/library" className="font-medium text-[var(--clinical-primary)] underline">
            ← Библиотека
          </Link>
          <Link href="/assistant/fmf" className="font-medium text-[var(--clinical-primary)] underline">
            FMF-ассистент →
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist">
        {(
          [
            { id: "program" as const, label: "Программа", icon: Layers },
            { id: "lecture" as const, label: "Лекция", icon: BookOpen },
            { id: "practice" as const, label: "Практика", icon: Stethoscope },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => navigate(activeId, id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              activeTab === id
                ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:bg-[var(--clinical-muted)]",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "program" ? (
        <ProgramTab
          topicDone={topicDone}
          onOpenLecture={(id) => navigate(id, "lecture")}
        />
      ) : null}

      {activeTab === "lecture" ? (
        <LectureTab
          lecture={activeLecture}
          topicDone={topicDone}
          expandedTopic={expandedTopic}
          onExpand={setExpandedTopic}
          onToggleTopic={toggleTopic}
          onSelectLecture={(id) => navigate(id, "lecture")}
        />
      ) : null}

      {activeTab === "practice" ? (
        <PracticeTab lecture={activeLecture} topicDone={topicDone} onToggleTopic={toggleTopic} />
      ) : null}

      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        {BASIC_COURSE_DISCLAIMER}
      </p>
    </div>
  );
}

function ProgramTab({
  topicDone,
  onOpenLecture,
}: {
  topicDone: Record<string, boolean>;
  onOpenLecture: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--clinical-foreground-muted)]">
        Модули курса — по полкам
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {ISUOG_COURSE_MODULES.map((mod) => (
          <Card key={mod.id} className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{mod.title}</CardTitle>
                {mod.comingSoon ? <Badge variant="outline">скоро</Badge> : null}
              </div>
              <CardDescription>{mod.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mod.lectureIds.length ? (
                mod.lectureIds.map((lid) => {
                  const lecture = ISUOG_BASIC_COURSE.lectures.find((l) => l.id === lid);
                  if (!lecture) return null;
                  const pct = lectureProgressPercent(lecture, topicDone);
                  return (
                    <button
                      key={lid}
                      type="button"
                      onClick={() => onOpenLecture(lid)}
                      className="flex w-full items-center justify-between rounded-xl border border-[var(--clinical-border)] px-3 py-2 text-left text-sm hover:bg-[var(--clinical-muted)]"
                    >
                      <span>
                        Лекция {lecture.number}. {lecture.title}
                      </span>
                      <Badge variant="secondary">{pct}%</Badge>
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-[var(--clinical-foreground-muted)]">Добавьте ссылку с Яндекс.Диска</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LectureTab({
  lecture,
  topicDone,
  expandedTopic,
  onExpand,
  onToggleTopic,
  onSelectLecture,
}: {
  lecture: BasicCourseLecture;
  topicDone: Record<string, boolean>;
  expandedTopic: string | null;
  onExpand: (id: string | null) => void;
  onToggleTopic: (lectureId: string, topicId: string) => void;
  onSelectLecture: (id: string) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
      <aside className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--clinical-foreground-muted)]">Лекции</p>
        {ISUOG_BASIC_COURSE.lectures.map((l) => (
          <LectureCard key={l.id} lecture={l} active={l.id === lecture.id} onSelect={() => onSelectLecture(l.id)} />
        ))}
      </aside>

      <section className="space-y-4">
        <Card className="overflow-hidden border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader className="space-y-3 border-b border-[var(--clinical-border)]">
            <CardTitle className="text-xl">
              Лекция {lecture.number}. {lecture.title}
            </CardTitle>
            <CardDescription>{lecture.subtitle}</CardDescription>
            <ul className="grid gap-1 text-xs text-[var(--clinical-foreground-muted)] sm:grid-cols-2">
              {lecture.objectives.map((o) => (
                <li key={o}>· {o}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <a href={lecture.yandexDiskUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Яндекс.Диск
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {lecture.topics.map((topic) => (
              <TopicAccordion
                key={topic.id}
                lectureId={lecture.id}
                topic={topic}
                done={!!topicDone[`${lecture.id}::${topic.id}`]}
                expanded={expandedTopic === topic.id}
                onExpand={() => onExpand(expandedTopic === topic.id ? null : topic.id)}
                onToggle={() => onToggleTopic(lecture.id, topic.id)}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-[var(--clinical-border)]">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Презентация</CardTitle>
          </CardHeader>
          <iframe
            title={`${lecture.fileName} — ISUOG`}
            src={yandexDiskViewerUrl(lecture.yandexDiskUrl)}
            className="h-[min(65vh,680px)] w-full bg-white"
            loading="lazy"
          />
        </Card>
      </section>
    </div>
  );
}

function PracticeTab({
  lecture,
  topicDone,
  onToggleTopic,
}: {
  lecture: BasicCourseLecture;
  topicDone: Record<string, boolean>;
  onToggleTopic: (lectureId: string, topicId: string) => void;
}) {
  const practiceLinks = useMemo(() => {
    const seen = new Set<string>();
    const links: { label: string; href: string }[] = [
      { label: "FMF · малый срок и скрининги", href: "/assistant/fmf" },
      { label: "Нормы по сроку · Медведев", href: "/reference/norms" },
      { label: "Клин. нормы УЗИ", href: "/reference" },
    ];
    for (const t of lecture.topics) {
      for (const l of t.practiceLinks ?? []) {
        if (!seen.has(l.href)) {
          seen.add(l.href);
          links.push(l);
        }
      }
    }
    return links;
  }, [lecture]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-[var(--clinical-border)]">
        <CardHeader>
          <CardTitle className="text-base">Инструменты по лекции {lecture.number}</CardTitle>
          <CardDescription>Отработка на реальных калькуляторах и ассистентах платформы.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {practiceLinks.map((l) => (
            <Button key={l.href} variant="secondary" className="justify-start" asChild>
              <Link href={l.href}>{l.label}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-[var(--clinical-border)]">
        <CardHeader>
          <CardTitle className="text-base">Чеклист самопроверки</CardTitle>
          <CardDescription>Отметьте темы, которые уже отработали на практике.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {lecture.topics.map((topic) => {
            const done = !!topicDone[`${lecture.id}::${topic.id}`];
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => onToggleTopic(lecture.id, topic.id)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-xs",
                  done
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-[var(--clinical-border)] bg-[var(--clinical-muted)]",
                )}
              >
                {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>
                  <strong>{topic.title}</strong>
                  <span className="mt-0.5 block text-[var(--clinical-foreground-muted)]">{topic.summary}</span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function TopicAccordion({
  lectureId,
  topic,
  done,
  expanded,
  onExpand,
  onToggle,
}: {
  lectureId: string;
  topic: BasicCourseTopic;
  done: boolean;
  expanded: boolean;
  onExpand: () => void;
  onToggle: () => void;
}) {
  return (
    <div className={cn("rounded-xl border", done ? "border-emerald-500/30 bg-emerald-500/5" : "border-[var(--clinical-border)]")}>
      <div className="flex items-start gap-2 p-3">
        <button type="button" onClick={onToggle} className="mt-0.5 shrink-0" aria-label="Отметить тему">
          {done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-[var(--clinical-foreground-muted)]" />}
        </button>
        <button type="button" onClick={onExpand} className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold">{topic.title}</p>
          <p className="text-xs text-[var(--clinical-foreground-muted)]">{topic.summary}</p>
        </button>
      </div>
      {expanded ? (
        <div className="border-t border-[var(--clinical-border)] px-3 py-3 text-xs">
          <p className="font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">Контрольные точки</p>
          <ul className="mt-2 space-y-1">
            {topic.checkpoints.map((c) => (
              <li key={c}>· {c}</li>
            ))}
          </ul>
          {topic.practiceLinks?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {topic.practiceLinks.map((l) => (
                <Link key={l.href} href={l.href} className="font-medium text-[var(--clinical-primary)] underline">
                  {l.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
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
      <p className="mt-1 text-sm font-semibold leading-snug">{lecture.title}</p>
    </button>
  );
}
