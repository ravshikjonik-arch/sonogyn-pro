"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, ClipboardCheck, ExternalLink, RotateCcw } from "lucide-react";

import { SelfAssessmentWidget } from "@/components/education/SelfAssessmentWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EXAM_CHECKLIST_CATEGORY_LABELS,
  EXAM_CHECKLISTS_DISCLAIMER,
  EXAM_CHECKLISTS_LINKS,
  EXAM_CHECKLISTS_QUIZ_BANK,
  EXAM_PROTOCOLS,
  getExamPearls,
  imageLibrariesForProtocol,
  itemsByCategory,
  loadProtocolProgress,
  protocolCompleteness,
  resetProtocolProgress,
  setItemDone,
  type ExamProtocolId,
} from "@/lib/education/exam-checklists";

export function ExamChecklistsClient() {
  const [activeProtocolId, setActiveProtocolId] = useState<ExamProtocolId>("gynecologic-pelvic");
  const [progressTick, setProgressTick] = useState(0);

  const activeProtocol = EXAM_PROTOCOLS.find((p) => p.id === activeProtocolId)!;
  const progress = useMemo(() => loadProtocolProgress(activeProtocolId), [activeProtocolId, progressTick]);
  const completeness = useMemo(
    () => protocolCompleteness(activeProtocol, progress),
    [activeProtocol, progress],
  );
  const grouped = useMemo(() => itemsByCategory(activeProtocol), [activeProtocol]);
  const pearls = getExamPearls(activeProtocolId);
  const imageLibs = useMemo(() => imageLibrariesForProtocol(activeProtocolId), [activeProtocolId]);

  const toggleItem = useCallback(
    (itemId: string) => {
      setItemDone(activeProtocolId, itemId, !progress[itemId]);
      setProgressTick((n) => n + 1);
    },
    [activeProtocolId, progress],
  );

  const handleReset = useCallback(() => {
    resetProtocolProgress(activeProtocolId);
    setProgressTick((n) => n + 1);
  }, [activeProtocolId]);

  useEffect(() => {
    const refresh = () => setProgressTick((n) => n + 1);
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("sonogyn:exam-checklists:")) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("sonogyn:exam-checklists-progress", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("sonogyn:exam-checklists-progress", refresh);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {EXAM_PROTOCOLS.map((protocol) => (
          <Button
            key={protocol.id}
            variant={protocol.id === activeProtocolId ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveProtocolId(protocol.id)}
          >
            {protocol.titleRu.split("(")[0]?.trim()}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-[var(--clinical-muted)] p-1">
          <TabsTrigger value="checklist">Чек-лист</TabsTrigger>
          <TabsTrigger value="pearls">Exam tips</TabsTrigger>
          <TabsTrigger value="quiz">Самопроверка · {EXAM_CHECKLISTS_QUIZ_BANK.questions.length} Q</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ClipboardCheck className="h-5 w-5 text-[var(--clinical-primary)]" />
                    {activeProtocol.titleRu}
                  </CardTitle>
                  <CardDescription>{activeProtocol.subtitle}</CardDescription>
                  <p className="text-xs text-[var(--clinical-foreground-muted)]">{EXAM_CHECKLISTS_DISCLAIMER}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeProtocol.relatedHref && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={activeProtocol.relatedHref}>{activeProtocol.relatedLabel}</Link>
                    </Button>
                  )}
                  {activeProtocol.sourceUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={activeProtocol.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {activeProtocol.source}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Сброс
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Общий прогресс</span>
                    <span className="font-medium">{completeness.percent}%</span>
                  </div>
                  <Progress value={completeness.percent} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Обязательные пункты</span>
                    <span className="font-medium">
                      {completeness.requiredDone}/{completeness.requiredTotal}
                    </span>
                  </div>
                  <Progress
                    value={
                      completeness.requiredTotal
                        ? Math.round((completeness.requiredDone / completeness.requiredTotal) * 100)
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </div>

              {completeness.requiredDone === completeness.requiredTotal && completeness.requiredTotal > 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                  Все обязательные пункты отмечены. Можно перейти к{" "}
                  <Link href={EXAM_CHECKLISTS_LINKS.reports.href} className="font-medium underline">
                    Structured Reporting
                  </Link>{" "}
                  или{" "}
                  <Link href="/tools/refs/patient-information" className="font-medium underline">
                    листовке для пациентки
                  </Link>
                  .
                </div>
              )}

              {imageLibs.length > 0 && (
                <div className="rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide">Image library (эталонные срезы)</p>
                  <div className="flex flex-wrap gap-2">
                    {imageLibs.map((lib) => (
                      <Link
                        key={lib.href}
                        href={lib.href}
                        className="rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-2 py-1 text-xs hover:underline"
                        title={lib.description}
                      >
                        {lib.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {grouped.map((group) => (
                <div key={group.id} className="space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--clinical-foreground)]">
                    {EXAM_CHECKLIST_CATEGORY_LABELS[group.id]}
                  </h3>
                  <p className="text-xs text-[var(--clinical-foreground-muted)]">{group.description}</p>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const done = Boolean(progress[item.id]);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-[var(--clinical-muted)]"
                          >
                            {done ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--clinical-foreground-muted)]" />
                            )}
                            <span className={done ? "text-[var(--clinical-foreground-muted)] line-through" : ""}>
                              {item.label}
                              {!item.required && (
                                <Badge variant="outline" className="ml-2 text-[10px]">
                                  опц.
                                </Badge>
                              )}
                            </span>
                          </button>
                          {item.hint && (
                            <p className="ml-6 text-xs text-[var(--clinical-foreground-muted)]">{item.hint}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pearls">
          {pearls ? (
            <Card>
              <CardHeader>
                <CardTitle>{pearls.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Клинические pearls</h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {pearls.pearls.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Exam tips (🎓 ординатор / экзамен)</h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {pearls.examTips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="quiz">
          <SelfAssessmentWidget
            bank={EXAM_CHECKLISTS_QUIZ_BANK}
            storageKey="sonogyn:exam-checklists:quiz-progress"
            title="Самопроверка · чек-листы AIUM / ISUOG"
            disclaimer={EXAM_CHECKLISTS_DISCLAIMER}
            relatedLinks={[
              EXAM_CHECKLISTS_LINKS.fmf,
              EXAM_CHECKLISTS_LINKS.fetalAnatomy,
              EXAM_CHECKLISTS_LINKS.norms,
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
