"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { renderSimpleMarkdown } from "@/lib/education/simple-markdown";
import { cn } from "@/lib/utils/cn";
import type { HoferCurriculum, HoferQuiz, ProbeGuideStep } from "@repo/hofer-basic-course";

const PROGRESS_KEY = "sonogyn:hofer-course:modules";

export type HoferModulePayload = {
  id: string;
  title: string;
  markdown: string;
  outlineOnly: boolean;
};

type Props = {
  curriculum: HoferCurriculum;
  quiz: HoferQuiz;
  probeGuides: ProbeGuideStep[];
  modules: HoferModulePayload[];
  disclaimer: string;
  initialTab?: "probe" | "program" | "module" | "quiz";
  initialModuleId?: string;
};

function loadModuleProgress(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function HoferBasicCourseClient({
  curriculum,
  quiz,
  probeGuides,
  modules,
  disclaimer,
  initialTab = "probe",
  initialModuleId,
}: Props) {
  const [tab, setTab] = useState(initialTab);
  const [activeModuleId, setActiveModuleId] = useState(
    initialModuleId ?? modules.find((m) => !m.outlineOnly)?.id ?? modules[0]?.id ?? "",
  );
  const [moduleDone, setModuleDone] = useState<Record<string, boolean>>({});
  const [expandedProbe, setExpandedProbe] = useState<string | null>(probeGuides[0]?.id ?? null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number | undefined>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    setModuleDone(loadModuleProgress());
  }, []);

  const activeModule = modules.find((m) => m.id === activeModuleId) ?? modules[0];

  const toggleModuleDone = useCallback(
    (id: string) => {
      setModuleDone((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const quizScore = useMemo(() => {
    if (!quizSubmitted) return null;
    let ok = 0;
    for (const q of quiz.questions) {
      if (quizAnswers[q.id] === q.answer) ok += 1;
    }
    return { ok, total: quiz.questions.length };
  }, [quizSubmitted, quizAnswers, quiz.questions]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-muted-foreground text-sm">Обучение · начинающие врачи УЗД</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{curriculum.meta.title}</h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          {curriculum.meta.based_on}. {curriculum.meta.audience}.
        </p>
        <p className="text-muted-foreground text-xs">{disclaimer}</p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="probe">Датчик: куда и как</TabsTrigger>
          <TabsTrigger value="program">Программа</TabsTrigger>
          <TabsTrigger value="module">Модуль</TabsTrigger>
          <TabsTrigger value="quiz">Тест</TabsTrigger>
        </TabsList>

        <TabsContent value="probe" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Пример для ординаторов</CardTitle>
              <CardDescription>
                Пошагово: какой датчик, куда приложить, давление, дыхание, типичные ошибки. По конспектам глав 0–1
                (Хофер).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {probeGuides.map((g) => {
                const open = expandedProbe === g.id;
                return (
                  <div
                    key={g.id}
                    className={cn(
                      "rounded-xl border border-[var(--clinical-border)] transition-colors",
                      open && "border-[var(--clinical-primary)]/40 bg-[var(--clinical-muted)]/30",
                    )}
                  >
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                      onClick={() => setExpandedProbe(open ? null : g.id)}
                      aria-expanded={open}
                    >
                      <span className="font-semibold text-[var(--clinical-foreground)]">{g.title}</span>
                      <Badge variant="outline" className="shrink-0">
                        {g.bookPages ?? g.moduleId}
                      </Badge>
                    </button>
                    {open ? (
                      <div className="space-y-3 border-t border-[var(--clinical-border)] px-4 pb-4 pt-3 text-sm">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                            Куда ставить
                          </p>
                          <p className="mt-1 leading-relaxed">{g.placement}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                            Датчик
                          </p>
                          <p className="mt-1 leading-relaxed">{g.probe}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                            Техника
                          </p>
                          <p className="mt-1 leading-relaxed">{g.technique}</p>
                        </div>
                        {g.pitfalls.length ? (
                          <ul className="list-disc space-y-1 pl-5 text-[var(--clinical-foreground)]">
                            {g.pitfalls.map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        ) : null}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button type="button" size="sm" variant="outline" asChild>
                            <Link
                              href={`/tools/refs/hofer-basic-course?tab=module&module=${encodeURIComponent(g.moduleId)}`}
                            >
                              Полный модуль
                            </Link>
                          </Button>
                          {g.practiceHref ? (
                            <Button type="button" size="sm" variant="secondary" asChild>
                              <Link href={g.practiceHref}>Практика на платформе</Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="program" className="mt-4 space-y-3">
          {curriculum.chapters.map((ch) => (
            <Card key={ch.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{ch.title}</CardTitle>
                  <Badge variant={ch.status === "complete" ? "secondary" : "outline"}>
                    {ch.status === "complete" ? "готово" : "каркас"}
                  </Badge>
                  {ch.book_pages ? <Badge variant="outline">стр. {ch.book_pages}</Badge> : null}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-wrap gap-2">
                  {ch.modules.map((mid) => {
                    const mod = modules.find((m) => m.id === mid);
                    return (
                      <li key={mid}>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveModuleId(mid);
                            setTab("module");
                          }}
                        >
                          {mod?.title ?? mid}
                          {moduleDone[mid] ? " ✓" : ""}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="module" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {modules.map((m) => (
              <Button
                key={m.id}
                type="button"
                size="sm"
                variant={m.id === activeModuleId ? "default" : "outline"}
                onClick={() => setActiveModuleId(m.id)}
              >
                {m.outlineOnly ? "⏳ " : ""}
                {m.title.slice(0, 42)}
                {m.title.length > 42 ? "…" : ""}
              </Button>
            ))}
          </div>
          {activeModule ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{activeModule.title}</CardTitle>
                <CardDescription>
                  {activeModule.outlineOnly
                    ? "Каркас — наполнение после оцифровки PDF"
                    : "Отметьте, когда прочитали модуль"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleModuleDone(activeModule.id)}
                >
                  {moduleDone[activeModule.id] ? "✓ Прочитано" : "Отметить прочитанным"}
                </Button>
                <article
                  className="clinical-prose max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(activeModule.markdown) }}
                />
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="quiz" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{quiz.meta.title ?? "Самопроверка"}</CardTitle>
              <CardDescription>{quiz.questions.length} вопросов по оцифрованным модулям</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {quiz.questions.map((q) => (
                <fieldset key={q.id} className="space-y-2">
                  <legend className="text-sm font-semibold">
                    {q.id}. {q.q}
                  </legend>
                  <div className="space-y-1">
                    {q.options.map((opt, idx) => (
                      <label key={idx} className="flex cursor-pointer items-start gap-2 text-sm">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={quizAnswers[q.id] === idx}
                          onChange={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  {quizSubmitted ? (
                    <p
                      className={cn(
                        "text-xs",
                        quizAnswers[q.id] === q.answer ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800",
                      )}
                    >
                      {quizAnswers[q.id] === q.answer ? "Верно." : "Неверно."} {q.explain}
                    </p>
                  ) : null}
                </fieldset>
              ))}
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={() => setQuizSubmitted(true)}>
                  Проверить ответы
                </Button>
                {quizScore ? (
                  <p className="text-sm font-medium">
                    Результат: {quizScore.ok} / {quizScore.total}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
