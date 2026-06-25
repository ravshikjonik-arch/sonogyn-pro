"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, GraduationCap, Search } from "lucide-react";

import { SelfAssessmentWidget } from "@/components/education/SelfAssessmentWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  VASCULAR_US_CASES,
  VASCULAR_US_DISCLAIMER,
  VASCULAR_US_EDUCATIONAL_CARDS,
  VASCULAR_US_GLOSSARY,
  VASCULAR_US_LINKS,
  getVascularClinicalHref,
  getVascularUsQuizBank,
  VASCULAR_US_SECTIONS,
  VASCULAR_US_SOURCE,
  searchGlossary,
  VASCULAR_CLINICAL_TAB_BY_SECTION,
  type VascularSectionId,
} from "@/lib/education/vascular-ultrasound";

export function VascularUltrasoundEducationClient() {
  const [activeSection, setActiveSection] = useState<VascularSectionId>("extracranial");
  const [search, setSearch] = useState("");
  const quizBank = useMemo(() => getVascularUsQuizBank(), []);

  const section = VASCULAR_US_SECTIONS.find((s) => s.id === activeSection);
  const card = VASCULAR_US_EDUCATIONAL_CARDS.find((c) => c.id === activeSection);
  const filteredGlossary = useMemo(() => searchGlossary(search), [search]);

  return (
    <Tabs defaultValue="course" className="space-y-6">
      <TabsList className="flex h-auto flex-wrap gap-1 bg-[var(--clinical-muted)] p-1">
        <TabsTrigger value="course">Курс · 10 глав</TabsTrigger>
        <TabsTrigger value="cards">Ординатор</TabsTrigger>
        <TabsTrigger value="cases">Случаи · {VASCULAR_US_CASES.length}</TabsTrigger>
        <TabsTrigger value="quiz">Экзамен · {quizBank.questions.length} Q</TabsTrigger>
        <TabsTrigger value="glossary">Глоссарий</TabsTrigger>
      </TabsList>

      <TabsContent value="course" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[var(--clinical-primary)]" />
              {VASCULAR_US_SOURCE.title}
            </CardTitle>
            <CardDescription>
              {VASCULAR_US_SOURCE.author} · {VASCULAR_US_SOURCE.publisher}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--clinical-foreground-muted)]">{VASCULAR_US_DISCLAIMER}</p>
            <div className="flex flex-wrap gap-2">
              {VASCULAR_US_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    activeSection === s.id
                      ? "bg-[var(--clinical-primary)] text-white"
                      : "bg-[var(--clinical-muted)]"
                  }`}
                >
                  {s.number}. {s.title}
                </button>
              ))}
            </div>
            {section ? (
              <div className="space-y-3 rounded-2xl border border-[var(--clinical-border)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{section.kulikovChapter}</Badge>
                  <h3 className="font-semibold">{section.title}</h3>
                </div>
                <p className="text-sm text-[var(--clinical-foreground-muted)]">{section.subtitle}</p>
                {section.blocks.map((b) => (
                  <div key={b.heading}>
                    <p className="text-sm font-medium">{b.heading}</p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-[var(--clinical-foreground-muted)]">
                      {b.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {section.checklist ? (
                  <div>
                    <p className="text-sm font-medium">Чеклист</p>
                    <ul className="mt-1 list-disc pl-5 text-sm">
                      {section.checklist.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {section.pitfalls ? (
                  <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                    <p className="font-medium">Ошибки</p>
                    <ul className="mt-1 list-disc pl-5">
                      {section.pitfalls.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
            <Button asChild>
              <Link
                href={
                  activeSection in VASCULAR_CLINICAL_TAB_BY_SECTION
                    ? getVascularClinicalHref(activeSection as keyof typeof VASCULAR_CLINICAL_TAB_BY_SECTION)
                    : VASCULAR_US_LINKS.clinical.href
                }
              >
                Клинический модуль → протокол и калькуляторы
              </Link>
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cards">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Режим ординатора
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {card ? (
              <>
                <Block title="Цели" items={card.learningObjectives} />
                <Block title="Ключевое" items={card.keyPoints} />
                <Block title="Советы ординатору" items={card.residentTips} />
                <Block title="Экзамен" items={card.examPearls} />
                {card.faq.map((f) => (
                  <div key={f.q} className="rounded-xl border p-3">
                    <p className="font-medium">{f.q}</p>
                    <p className="mt-1 text-[var(--clinical-foreground-muted)]">{f.a}</p>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-[var(--clinical-foreground-muted)]">
                Выберите главу 4–9 в курсе — карточки ординатора доступны для всех клинических разделов.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cases" className="space-y-4">
        {VASCULAR_US_CASES.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="text-base">{c.title}</CardTitle>
              <CardDescription>
                {c.basin} · {c.level}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{c.clinicalScenario}</p>
              <Block title="УЗ" items={c.ultrasoundFindings} />
              <Block title="Допплер" items={c.dopplerFindings} />
              <p className="font-medium">{c.interpretation}</p>
              <Block title="Teaching points" items={c.teachingPoints} />
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="quiz">
        <SelfAssessmentWidget
          bank={quizBank}
          storageKey="sonogyn-vascular-us-quiz-progress"
          title="Самопроверка · сосудистое УЗД"
          description={`${quizBank.questions.length} вопросов по гл. 4–9 (Куликов): БЦА, TCD, АНК, ВНК, ВК, аорта.`}
          disclaimer={VASCULAR_US_DISCLAIMER}
          relatedLinks={[VASCULAR_US_LINKS.clinical]}
        />
      </TabsContent>

      <TabsContent value="glossary" className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--clinical-foreground-muted)]" />
          <Input className="pl-9" placeholder="PSV, RI, ИМТ…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {(search ? filteredGlossary : VASCULAR_US_GLOSSARY).map((e) => (
            <div key={e.term} className="rounded-xl border p-3 text-sm">
              <p className="font-semibold">{e.term}</p>
              <p className="mt-1 text-[var(--clinical-foreground-muted)]">{e.definition}</p>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      <ul className="list-disc pl-5 text-[var(--clinical-foreground-muted)]">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
