"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Circle, Mic, Search } from "lucide-react";

import { FetalAnatomyAnomalyCard } from "@/components/education/fetal-anatomy/FetalAnatomyAnomalyCard";
import { FetalAnatomyAtlasImage } from "@/components/education/fetal-anatomy/FetalAnatomyAtlasImage";
import { SelfAssessmentWidget } from "@/components/education/SelfAssessmentWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FETAL_ANATOMY_ANOMALIES,
  FETAL_ANATOMY_ANOMALY_COUNT,
  FETAL_ANATOMY_ATLAS,
  FETAL_ANATOMY_CASES,
  FETAL_ANATOMY_INTRODUCTION,
  FETAL_ANATOMY_ISUOG_LECTURE_ID,
  FETAL_ANATOMY_LEMON_SIGN_ALGORITHM,
  FETAL_ANATOMY_LINKS,
  FETAL_ANATOMY_ORAL_QUESTIONS,
  FETAL_ANATOMY_QUIZ_BANK,
  FETAL_ANATOMY_REGION_LABELS,
  FETAL_ANATOMY_SOURCE,
  FETAL_ANATOMY_SURVEY_ALGORITHM,
  FETAL_ANATOMY_VIEWS,
  FETAL_ANATOMY_VIEW_COUNT,
  ISUOG_TOPIC_TO_VIEW_IDS,
  anomaliesForView,
  casesByLevel,
  fetalAnatomyCoreProgressPercent,
  fetalAnatomyProgressSummary,
  getAnomaly,
  getEducationalCard,
  loadIsuogTopicProgress,
  loadViewProgress,
  searchAnomalies,
  searchGlossary,
  setViewDone,
  topicProgressForView,
  viewProgressPercent,
  type FetalAnatomyRegion,
  type FetalAnatomyViewId,
} from "@/lib/education/fetal-anatomy-22-views";

const REGIONS: FetalAnatomyRegion[] = [
  "overview",
  "spine",
  "head-brain",
  "heart",
  "abdomen",
  "pelvis",
  "limbs",
  "face",
  "whole-body",
];

export function FetalAnatomy22ViewsClient() {
  const [activeViewId, setActiveViewId] = useState<FetalAnatomyViewId>(FETAL_ANATOMY_VIEWS[0]!.id);
  const [regionFilter, setRegionFilter] = useState<FetalAnatomyRegion | "all">("all");
  const [anomalyQuery, setAnomalyQuery] = useState("");
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [glossaryQuery, setGlossaryQuery] = useState("");
  const [progressTick, setProgressTick] = useState(0);

  const progress = useMemo(() => loadViewProgress(), [progressTick]);
  const isuogProgress = useMemo(() => loadIsuogTopicProgress(), [progressTick]);
  const percent = useMemo(() => viewProgressPercent(FETAL_ANATOMY_VIEW_COUNT, progress), [progress, progressTick]);
  const corePercent = useMemo(() => fetalAnatomyCoreProgressPercent(isuogProgress), [isuogProgress]);
  const progressSummary = useMemo(() => fetalAnatomyProgressSummary(isuogProgress), [isuogProgress]);

  const activeView = FETAL_ANATOMY_VIEWS.find((v) => v.id === activeViewId);
  const viewDone = Boolean(progress[activeViewId]);
  const topicSync = activeView ? topicProgressForView(activeView.id, isuogProgress) : null;

  const displayedAnomalies = useMemo(() => {
    if (anomalyQuery.trim()) return searchAnomalies(anomalyQuery);
    if (activeView) return anomaliesForView(activeView.id);
    return FETAL_ANATOMY_ANOMALIES;
  }, [activeView, anomalyQuery]);

  const glossaryEntries = useMemo(() => searchGlossary(glossaryQuery), [glossaryQuery]);

  const eduCard = useMemo(
    () => getEducationalCard(activeViewId) ?? getEducationalCard("introduction"),
    [activeViewId],
  );

  const filteredViews = useMemo(
    () =>
      regionFilter === "all"
        ? FETAL_ANATOMY_VIEWS
        : FETAL_ANATOMY_VIEWS.filter((v) => v.region === regionFilter),
    [regionFilter],
  );

  const viewExcludedAnomalies = useMemo(() => {
    if (!activeView) return [];
    return activeView.excludesAnomalyIds
      .map((id) => getAnomaly(id))
      .filter(Boolean) as NonNullable<ReturnType<typeof getAnomaly>>[];
  }, [activeView]);

  const selectedAnomaly = useMemo(
    () => (selectedAnomalyId ? getAnomaly(selectedAnomalyId) : null),
    [selectedAnomalyId],
  );

  const toggleView = useCallback((viewId: FetalAnatomyViewId) => {
    setViewDone(viewId, !progress[viewId]);
    setProgressTick((n) => n + 1);
  }, [progress]);

  useEffect(() => {
    const refresh = () => setProgressTick((n) => n + 1);
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "sonogyn:fetal-anatomy-22-views:progress" ||
        e.key === "sonogyn-isuog-topic-progress"
      ) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("sonogyn:fetal-anatomy-progress", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("sonogyn:fetal-anatomy-progress", refresh);
    };
  }, []);

  return (
    <Tabs defaultValue="views" className="space-y-6">
      <TabsList className="flex h-auto flex-wrap gap-1 bg-[var(--clinical-muted)] p-1">
        <TabsTrigger value="views">22 среза</TabsTrigger>
        <TabsTrigger value="education">Обучение</TabsTrigger>
        <TabsTrigger value="anomalies">База ВПР · {FETAL_ANATOMY_ANOMALY_COUNT}</TabsTrigger>
        <TabsTrigger value="glossary">Глоссарий</TabsTrigger>
        <TabsTrigger value="cases">Случаи · {FETAL_ANATOMY_CASES.length}</TabsTrigger>
        <TabsTrigger value="quiz">Самопроверка · {FETAL_ANATOMY_QUIZ_BANK.questions.length} Q</TabsTrigger>
        <TabsTrigger value="atlas">Атлас</TabsTrigger>
        <TabsTrigger value="algorithm">Алгоритм</TabsTrigger>
      </TabsList>

      <div className="grid gap-4 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Прогресс · 22 среза</span>
            <span>
              {Object.keys(progress).filter((k) => progress[k]).length}/{FETAL_ANATOMY_VIEW_COUNT} · {percent}%
            </span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span>ISUOG · лекция 8 · 5 тем</span>
            <Link
              href={progressSummary.isuogHref}
              className="text-[var(--clinical-primary)] hover:underline"
            >
              {progressSummary.coreDone}/{progressSummary.coreTotal} · {corePercent}%
            </Link>
          </div>
          <Progress value={corePercent} className="h-2" />
          <p className="text-[10px] text-[var(--clinical-foreground-muted)]">
            Тема ISUOG отмечается автоматически, когда все срезы блока выполнены.
          </p>
        </div>
      </div>

      <TabsContent value="views" className="mt-0 space-y-4">
        <Card className="border-[var(--clinical-border)]">
          <CardHeader>
            <CardTitle className="text-base">Introduction</CardTitle>
            <CardDescription>{FETAL_ANATOMY_SOURCE.trimester}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--clinical-foreground-muted)]">
            <SectionBullets title="Why systematic scan" items={FETAL_ANATOMY_INTRODUCTION.whySystematicScan} />
            <SectionBullets title="Screening vs diagnostic" items={FETAL_ANATOMY_INTRODUCTION.screeningVsDiagnostic} />
            <SectionBullets title="II trimester role" items={FETAL_ANATOMY_INTRODUCTION.secondTrimesterRole} />
            <SectionBullets title="Common pitfalls" items={FETAL_ANATOMY_INTRODUCTION.commonPitfalls} />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRegionFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              regionFilter === "all" ? "bg-[var(--clinical-primary)] text-white" : "bg-[var(--clinical-muted)]"
            }`}
          >
            Все
          </button>
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegionFilter(r)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                regionFilter === r ? "bg-[var(--clinical-primary)] text-white" : "bg-[var(--clinical-muted)]"
              }`}
            >
              {FETAL_ANATOMY_REGION_LABELS[r]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {filteredViews.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveViewId(v.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeViewId === v.id
                  ? "bg-[var(--clinical-primary)] text-white"
                  : progress[v.id]
                    ? "border border-emerald-500/40 bg-emerald-500/10"
                    : "bg-[var(--clinical-muted)]"
              }`}
            >
              {v.number}. {v.titleRu}
            </button>
          ))}
        </div>

        {activeView ? (
          <Card className="border-[var(--clinical-border)]">
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{FETAL_ANATOMY_REGION_LABELS[activeView.region]}</Badge>
                <Badge variant="secondary">View {activeView.number}</Badge>
                {topicSync ? (
                  <Badge variant={topicSync.done ? "default" : "outline"}>
                    ISUOG · {topicSync.done ? "тема ✓" : "тема …"}
                  </Badge>
                ) : null}
              </div>
              <CardTitle>{activeView.titleRu}</CardTitle>
              <CardDescription>{activeView.title} · {activeView.plane}</CardDescription>
              <Button size="sm" variant={viewDone ? "secondary" : "default"} onClick={() => toggleView(activeView.id)}>
                {viewDone ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Circle className="mr-2 h-4 w-4" />}
                {viewDone ? "Снять отметку" : "Отметить срез выполненным"}
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
              <SectionBullets title="How to obtain" items={activeView.howToObtain} />
              <SectionBullets title="Normal anatomy" items={activeView.normalAnatomy} />
              <SectionBullets title="Key landmarks" items={activeView.keyLandmarks} />
              <SectionBullets title="Common mistakes" items={activeView.commonMistakes} />
              <div className="md:col-span-2">
                <p className="text-xs font-bold uppercase text-[var(--clinical-foreground-muted)]">Clinical significance</p>
                <p className="mt-1">{activeView.clinicalSignificance}</p>
              </div>
              <div className="md:col-span-2 grid gap-3 sm:grid-cols-2">
                <figure className="overflow-hidden rounded-xl border border-[var(--clinical-border)]">
                  <FetalAnatomyAtlasImage
                    viewId={activeView.id}
                    kind="normal"
                    alt={`${activeView.titleRu} — normal`}
                    className="h-40 w-full object-cover bg-sky-950/20"
                  />
                  <figcaption className="px-2 py-1 text-center text-[10px] text-[var(--clinical-foreground-muted)]">
                    Normal
                  </figcaption>
                </figure>
                <figure className="overflow-hidden rounded-xl border border-[var(--clinical-border)]">
                  <FetalAnatomyAtlasImage
                    viewId={activeView.id}
                    kind="pathology"
                    alt={`${activeView.titleRu} — pathology`}
                    className="h-40 w-full object-cover bg-red-950/20"
                  />
                  <figcaption className="px-2 py-1 text-center text-[10px] text-[var(--clinical-foreground-muted)]">
                    Pathology
                  </figcaption>
                </figure>
              </div>
              {eduCard && eduCard.viewId === activeView.id ? (
                <div className="md:col-span-2 space-y-2 rounded-xl border border-violet-200/60 bg-violet-50/30 p-3 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <p className="text-xs font-bold uppercase text-violet-800 dark:text-violet-200">Educational mode</p>
                  <SectionBullets title="Key points" items={eduCard.keyPoints.slice(0, 4)} />
                  <SectionBullets title="Clinical pearls" items={eduCard.clinicalPearls} />
                  <SectionBullets title="Resident tips" items={eduCard.residentTips.slice(0, 2)} />
                </div>
              ) : null}
              {viewExcludedAnomalies.length ? (
                <div className="md:col-span-2 space-y-2">
                  <p className="text-xs font-bold uppercase text-[var(--clinical-foreground-muted)]">
                    Исключаемые ВПР на этом срезе ({viewExcludedAnomalies.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {viewExcludedAnomalies.slice(0, 12).map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className="rounded-full bg-[var(--clinical-muted)] px-2 py-0.5 text-[10px] hover:bg-[var(--clinical-primary)]/10"
                        onClick={() => {
                          setSelectedAnomalyId(a.id);
                          setAnomalyQuery("");
                        }}
                      >
                        {a.nameRu}
                      </button>
                    ))}
                    {viewExcludedAnomalies.length > 12 ? (
                      <span className="text-[10px] text-[var(--clinical-foreground-muted)]">
                        +{viewExcludedAnomalies.length - 12}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">ISUOG · блоки лекции 8</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(ISUOG_TOPIC_TO_VIEW_IDS).map(([topicId, viewIds]) => {
              const done = viewIds.every((id) => progress[id]);
              return (
                <div
                  key={topicId}
                  className={`rounded-lg border px-3 py-2 text-xs ${done ? "border-emerald-500/40 bg-emerald-500/10" : "border-[var(--clinical-border)]"}`}
                >
                  <p className="font-semibold">{topicId.replace(/-/g, " ")}</p>
                  <p className="text-[var(--clinical-foreground-muted)]">
                    {viewIds.filter((id) => progress[id]).length}/{viewIds.length} срезов
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="education" className="mt-0 space-y-4">
        {eduCard ? (
          <Card className="border-[var(--clinical-border)]">
            <CardHeader>
              <CardTitle className="text-base">
                {eduCard.viewId === "introduction" ? "Introduction" : `View · ${activeView?.titleRu ?? eduCard.viewId}`}
              </CardTitle>
              <CardDescription>Learning objectives · pearls · exam tips</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
              <SectionBullets title="Learning objectives" items={eduCard.learningObjectives} />
              <SectionBullets title="Key points" items={eduCard.keyPoints} />
              <SectionBullets title="Clinical pearls" items={eduCard.clinicalPearls} />
              <SectionBullets title="Resident tips" items={eduCard.residentTips} />
              <SectionBullets title="Examination tips" items={eduCard.examinationTips} />
              <SectionBullets title="Common mistakes" items={eduCard.commonMistakes} />
            </CardContent>
          </Card>
        ) : null}
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Выберите срез на вкладке «22 среза» — карточка обновится для выбранного view.
        </p>
      </TabsContent>

      <TabsContent value="anomalies" className="mt-0 space-y-4">
        <Input placeholder="Поиск по базе ВПР…" value={anomalyQuery} onChange={(e) => setAnomalyQuery(e.target.value)} />
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          {displayedAnomalies.length} из {FETAL_ANATOMY_ANOMALY_COUNT} записей
          {activeView && !anomalyQuery.trim() ? ` · срез ${activeView.number}` : ""}
        </p>
        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,340px)]">
          <div className="grid gap-3 md:grid-cols-2">
            {displayedAnomalies.map((a) => (
              <FetalAnatomyAnomalyCard
                key={a.id}
                anomaly={a}
                compact={!selectedAnomalyId}
                selected={selectedAnomalyId === a.id}
                onSelect={setSelectedAnomalyId}
              />
            ))}
          </div>
          {selectedAnomaly ? (
            <div className="lg:sticky lg:top-4 lg:self-start">
              <FetalAnatomyAnomalyCard anomaly={selectedAnomaly} />
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setSelectedAnomalyId(null)}
              >
                Закрыть детали
              </Button>
            </div>
          ) : null}
        </div>
      </TabsContent>

      <TabsContent value="glossary" className="mt-0 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--clinical-foreground-muted)]" />
          <Input
            className="pl-9"
            placeholder="Поиск по глоссарию…"
            value={glossaryQuery}
            onChange={(e) => setGlossaryQuery(e.target.value)}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {glossaryEntries.map((e) => (
            <Card key={e.term} className="border-[var(--clinical-border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{e.term}</CardTitle>
                {e.aliases?.length ? (
                  <CardDescription>{e.aliases.join(" · ")}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="text-sm text-[var(--clinical-foreground-muted)]">{e.definition}</CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="cases" className="mt-0 space-y-6">
        {(["beginner", "intermediate", "advanced"] as const).map((level) => (
          <div key={level} className="space-y-3">
            <h3 className="text-sm font-bold uppercase">{level}</h3>
            {casesByLevel(level).map((c) => (
              <Card key={c.id} className="border-[var(--clinical-border)]">
                <CardHeader>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <CardDescription>{c.history}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <SectionBullets title="Findings" items={c.ultrasoundFindings} />
                  <p><strong>Diagnosis:</strong> {c.diagnosis}</p>
                  <SectionBullets title="Teaching" items={c.teachingPoints} />
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </TabsContent>

      <TabsContent value="quiz" className="mt-0 space-y-6">
        <SelfAssessmentWidget
          bank={FETAL_ANATOMY_QUIZ_BANK}
          storageKey="sonogyn:fetal-anatomy-22-views:quiz"
          title="Самопроверка · 22 среза"
          description="Протокол II триместра · Емельяненко · 20 вопросов"
          relatedLinks={[
            FETAL_ANATOMY_LINKS.fmf,
            FETAL_ANATOMY_LINKS.fetalSpine,
            {
              href: `/library/basic-course?lecture=${FETAL_ANATOMY_ISUOG_LECTURE_ID}&tab=practice`,
              label: "ISUOG · лекция 8",
            },
          ]}
        />
        <Card className="border-[var(--clinical-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mic className="h-4 w-4" />
              Oral / board-style questions
            </CardTitle>
            <CardDescription>Для устного экзамена и разбора с наставником</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-3 pl-5 text-sm">
              {FETAL_ANATOMY_ORAL_QUESTIONS.map((q) => (
                <li key={q} className="leading-relaxed">
                  {q}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="atlas" className="mt-0 space-y-4">
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          48 PNG-слотов (normal + pathology). Замените клиническими эхограммами в{" "}
          <code className="text-xs">apps/web/public/images/fetal-anatomy/</code>.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FETAL_ANATOMY_ATLAS.map((entry) => (
            <Card key={entry.viewId} className="border-[var(--clinical-border)] overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{entry.number}. {entry.titleRu}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 p-2 pt-0">
                <FetalAnatomyAtlasImage
                  viewId={entry.viewId}
                  kind="normal"
                  alt=""
                  className="h-24 w-full rounded-lg object-cover bg-sky-950/20"
                />
                <FetalAnatomyAtlasImage
                  viewId={entry.viewId}
                  kind="pathology"
                  alt=""
                  className="h-24 w-full rounded-lg object-cover bg-red-950/20"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="algorithm" className="mt-0 space-y-4">
        <Card className="border-[var(--clinical-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {FETAL_ANATOMY_SURVEY_ALGORITHM.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              {FETAL_ANATOMY_SURVEY_ALGORITHM.steps.map((step) => (
                <li key={step.order} className="rounded-xl border border-[var(--clinical-border)] p-3">
                  <p className="font-semibold">{step.order}. {step.phase}</p>
                  <p className="text-[var(--clinical-foreground-muted)]">{step.action}</p>
                  <p className="mt-1 font-mono text-xs">{step.views.join(" → ")}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <Card className="border-[var(--clinical-border)]">
          <CardHeader>
            <CardTitle className="text-base">{FETAL_ANATOMY_LEMON_SIGN_ALGORITHM.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              {FETAL_ANATOMY_LEMON_SIGN_ALGORITHM.steps.map((s) => (
                <li key={s.step}>{s.action}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function SectionBullets({ title, items }: { title: string; items: readonly string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase text-[var(--clinical-foreground-muted)]">{title}</p>
      <ul className="list-disc space-y-0.5 pl-4">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
