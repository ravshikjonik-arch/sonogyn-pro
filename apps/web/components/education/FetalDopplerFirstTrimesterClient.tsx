"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Circle, ClipboardCheck, Layers, Search, Shield } from "lucide-react";

import { SelfAssessmentWidget } from "@/components/education/SelfAssessmentWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FETAL_DOPPLER_ALGORITHMS,
  FETAL_DOPPLER_ATLAS_FILES,
  FETAL_DOPPLER_CASES,
  FETAL_DOPPLER_DISCLAIMER,
  FETAL_DOPPLER_EDUCATIONAL_CARDS,
  FETAL_DOPPLER_GLOSSARY,
  FETAL_DOPPLER_LINKS,
  FETAL_DOPPLER_QUIZ_BANK,
  FETAL_DOPPLER_SECTIONS,
  FETAL_DOPPLER_SOURCE,
  fetalDopplerAtlasSrc,
  fetalDopplerCoreProgressPercent,
  fetalDopplerFullModuleProgressPercent,
  isFetalDopplerSectionDone,
  loadIsuogTopicProgress,
  loadModuleExtraProgress,
  SECTION_TO_ISUOG_TOPIC,
  toggleFetalDopplerSectionDone,
  type FetalDopplerSectionId,
} from "@/lib/education/fetal-doppler-first-trimester";

const LEVEL_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
} as const;

export function FetalDopplerFirstTrimesterClient() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<FetalDopplerSectionId>(
    FETAL_DOPPLER_SECTIONS[0]?.id ?? "introduction",
  );
  const [progressTick, setProgressTick] = useState(0);

  const isuogProgress = useMemo(() => loadIsuogTopicProgress(), [progressTick]);
  const extraProgress = useMemo(() => loadModuleExtraProgress(), [progressTick]);

  const corePercent = useMemo(() => fetalDopplerCoreProgressPercent(isuogProgress), [isuogProgress]);
  const fullPercent = useMemo(
    () => fetalDopplerFullModuleProgressPercent(isuogProgress, extraProgress),
    [isuogProgress, extraProgress],
  );

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === "sonogyn-isuog-topic-progress" ||
        event.key === "sonogyn:fetal-doppler:extra-sections"
      ) {
        setProgressTick((n) => n + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleSection = useCallback((sectionId: FetalDopplerSectionId) => {
    toggleFetalDopplerSectionDone(sectionId);
    setProgressTick((n) => n + 1);
  }, []);

  const filteredGlossary = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FETAL_DOPPLER_GLOSSARY;
    return FETAL_DOPPLER_GLOSSARY.filter((e) => {
      const hay = [e.term, ...(e.aliases ?? []), e.definition].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [search]);

  const section = FETAL_DOPPLER_SECTIONS.find((s) => s.id === activeSection);
  const sectionDone = section ? isFetalDopplerSectionDone(section.id, isuogProgress, extraProgress) : false;
  const isCoreSynced = section ? Boolean(SECTION_TO_ISUOG_TOPIC[section.id]) : false;

  return (
    <Tabs defaultValue="course" className="space-y-6">
      <TabsList className="flex h-auto flex-wrap gap-1 bg-[var(--clinical-muted)] p-1">
        <TabsTrigger value="course">Курс · 13 секций</TabsTrigger>
        <TabsTrigger value="cards">Образовательные карточки</TabsTrigger>
        <TabsTrigger value="cases">Случаи · 9</TabsTrigger>
        <TabsTrigger value="quiz">Самопроверка · 16 Q</TabsTrigger>
        <TabsTrigger value="algorithms">Алгоритмы</TabsTrigger>
        <TabsTrigger value="glossary">Глоссарий</TabsTrigger>
        <TabsTrigger value="atlas">Атлас</TabsTrigger>
      </TabsList>

      <TabsContent value="course" className="mt-0 space-y-4">
        <Card className="border-[var(--clinical-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-[var(--clinical-primary)]" />
              Doppler Ultrasound in the First Trimester (11–14 Weeks)
            </CardTitle>
            <CardDescription>
              Источник: {FETAL_DOPPLER_SOURCE.author} · {FETAL_DOPPLER_SOURCE.organization} ·{" "}
              {FETAL_DOPPLER_SOURCE.gestationalWindow}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--clinical-foreground-muted)]">{FETAL_DOPPLER_DISCLAIMER}</p>

            <div className="grid gap-4 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>ISUOG · 7 ключевых тем</span>
                  <span>{corePercent}%</span>
                </div>
                <Progress value={corePercent} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>Модуль целиком · 13 секций</span>
                  <span>{fullPercent}%</span>
                </div>
                <Progress value={fullPercent} className="h-2" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {FETAL_DOPPLER_SECTIONS.map((s) => {
                const done = isFetalDopplerSectionDone(s.id, isuogProgress, extraProgress);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSection(s.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                      activeSection === s.id
                        ? "bg-[var(--clinical-primary)] text-white"
                        : done
                          ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                          : "bg-[var(--clinical-muted)] text-[var(--clinical-foreground-muted)] hover:bg-[var(--clinical-primary-muted)]"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : null}
                    {String(s.number).padStart(2, "0")}. {s.title}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {section ? (
          <Card className="border-[var(--clinical-border)]">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Секция {section.number}</Badge>
                {isCoreSynced ? <Badge variant="secondary">ISUOG sync</Badge> : null}
                {sectionDone ? <Badge className="bg-emerald-600 hover:bg-emerald-600">Пройдено</Badge> : null}
              </div>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.subtitle}</CardDescription>
              <Button
                type="button"
                size="sm"
                variant={sectionDone ? "secondary" : "default"}
                className="w-fit"
                onClick={() => toggleSection(section.id)}
              >
                {sectionDone ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Снять отметку
                  </>
                ) : (
                  <>
                    <Circle className="mr-2 h-4 w-4" />
                    Отметить пройденным
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.blocks.map((block) => (
                <div key={block.heading}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                    {block.heading}
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {section.checklist?.length ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    <ClipboardCheck className="h-4 w-4" />
                    Чек-лист
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-emerald-900 dark:text-emerald-100">
                    {section.checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {section.pitfalls?.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                  <h3 className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-100">Pitfalls</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900 dark:text-amber-100">
                    {section.pitfalls.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </TabsContent>

      <TabsContent value="cards" className="mt-0 space-y-4">
        {FETAL_DOPPLER_EDUCATIONAL_CARDS.filter((c) => c.learningObjectives.length > 0).map((c) => (
          <Card key={c.id} className="border-[var(--clinical-border)]">
            <CardHeader>
              <CardTitle className="text-base">
                {FETAL_DOPPLER_SECTIONS.find((s) => s.id === c.id)?.title ?? c.id}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <SectionList title="Learning objectives" items={c.learningObjectives} />
              <SectionList title="Key points" items={c.keyPoints} />
              <SectionList title="Clinical pearls" items={c.clinicalPearls} />
              <SectionList title="Resident tips" items={c.residentTips} />
              <SectionList title="Exam pearls" items={c.examPearls} />
              {c.faq.length ? (
                <div className="md:col-span-2">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
                    FAQ
                  </h4>
                  <dl className="space-y-2 text-sm">
                    {c.faq.map((f) => (
                      <div key={f.q}>
                        <dt className="font-medium">{f.q}</dt>
                        <dd className="text-[var(--clinical-foreground-muted)]">{f.a}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="cases" className="mt-0 space-y-4">
        {(["beginner", "intermediate", "advanced"] as const).map((level) => (
          <div key={level} className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
              {LEVEL_LABELS[level]}
            </h3>
            {FETAL_DOPPLER_CASES.filter((c) => c.level === level).map((c) => (
              <Card key={c.id} className="border-[var(--clinical-border)]">
                <CardHeader>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <CardDescription>{c.clinicalScenario}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <SectionList title="Ultrasound" items={c.ultrasoundFindings} />
                  <SectionList title="Doppler" items={c.dopplerFindings} />
                  <p>
                    <span className="font-semibold">Interpretation:</span> {c.interpretation}
                  </p>
                  <p>
                    <span className="font-semibold">Diagnosis:</span> {c.finalDiagnosis}
                  </p>
                  <SectionList title="Teaching points" items={c.teachingPoints} />
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </TabsContent>

      <TabsContent value="quiz" className="mt-0">
        <SelfAssessmentWidget
          bank={FETAL_DOPPLER_QUIZ_BANK}
          storageKey="sonogyn:fetal-doppler-first-trimester:quiz"
          title="Самопроверка · допплер I триместра"
          description="16 вопросов: ALARA, 5 позиций, VP, SUA, UTA, АБС."
          disclaimer={FETAL_DOPPLER_DISCLAIMER}
          relatedLinks={[FETAL_DOPPLER_LINKS.fmf, FETAL_DOPPLER_LINKS.obstetricAtlas]}
        />
      </TabsContent>

      <TabsContent value="algorithms" className="mt-0 space-y-4">
        {FETAL_DOPPLER_ALGORITHMS.map((algo) => (
          <Card key={algo.id} className="border-[var(--clinical-border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4 text-[var(--clinical-primary)]" />
                {algo.title}
              </CardTitle>
              <CardDescription>{algo.indication}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                {algo.steps.map((step) => (
                  <li key={step.step} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--clinical-primary-muted)] text-xs font-bold text-[var(--clinical-primary-deep)]">
                      {step.step}
                    </span>
                    <div>
                      <p className="font-medium">{step.action}</p>
                      {step.detail ? (
                        <p className="text-[var(--clinical-foreground-muted)]">{step.detail}</p>
                      ) : null}
                      {step.branch ? (
                        <p className="text-xs text-amber-700 dark:text-amber-300">{step.branch}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="glossary" className="mt-0 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--clinical-foreground-muted)]" />
          <Input
            className="pl-9"
            placeholder="Поиск термина…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredGlossary.map((entry) => (
            <Card key={entry.term} className="border-[var(--clinical-border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{entry.term}</CardTitle>
                {entry.aliases?.length ? (
                  <CardDescription>{entry.aliases.join(" · ")}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="text-sm text-[var(--clinical-foreground-muted)]">{entry.definition}</CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="atlas" className="mt-0 space-y-4">
        <Card className="border-[var(--clinical-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Visual atlas · placeholder structure
            </CardTitle>
            <CardDescription>
              Положите PNG в <code className="text-xs">/public/images/fetal-doppler/</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FETAL_DOPPLER_ATLAS_FILES.map((file) => (
              <div
                key={file}
                className="flex flex-col gap-2 rounded-xl border border-dashed border-[var(--clinical-border)] p-4"
              >
                <div className="flex h-24 items-center justify-center rounded-lg bg-[var(--clinical-muted)] text-xs text-[var(--clinical-foreground-muted)]">
                  {file}
                </div>
                <p className="font-mono text-xs">{fetalDopplerAtlasSrc(file)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={FETAL_DOPPLER_LINKS.fmf.href} className="font-medium text-[var(--clinical-primary)] underline">
            {FETAL_DOPPLER_LINKS.fmf.label}
          </Link>
          <Link
            href={FETAL_DOPPLER_LINKS.obstetricAtlas.href}
            className="font-medium text-[var(--clinical-primary)] underline"
          >
            {FETAL_DOPPLER_LINKS.obstetricAtlas.label}
          </Link>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function SectionList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
        {title}
      </h4>
      <ul className="list-disc space-y-0.5 pl-4 text-sm text-[var(--clinical-foreground-muted)]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
