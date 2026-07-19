"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, XCircle } from "lucide-react";

import { SelfAssessmentWidget } from "@/components/education/SelfAssessmentWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EXAM_SET_PIECE_DISCLAIMER,
  EXAM_SET_PIECE_QUIZ_BANK,
  EXAM_SET_PIECE_SCENARIOS,
  loadSetPieceCompleted,
  setSetPieceCompleted,
  type ExamSetPieceScenario,
} from "@/lib/education/exam-set-pieces";

export function ExamSetPieceClient() {
  const [activeId, setActiveId] = useState(EXAM_SET_PIECE_SCENARIOS[0]!.id);
  const [selectedDx, setSelectedDx] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [tick, setTick] = useState(0);

  const completed = useMemo(() => loadSetPieceCompleted(), [tick]);
  const active = EXAM_SET_PIECE_SCENARIOS.find((s) => s.id === activeId)!;

  function selectScenario(scenario: ExamSetPieceScenario) {
    setActiveId(scenario.id);
    setSelectedDx(null);
    setRevealed(false);
  }

  function revealAnswer() {
    setRevealed(true);
    if (selectedDx === active.correctDifferentialIndex) {
      setSetPieceCompleted(active.id, true);
      setTick((n) => n + 1);
    }
  }

  const isCorrect = revealed && selectedDx === active.correctDifferentialIndex;

  return (
    <Tabs defaultValue="scenarios" className="space-y-4">
      <TabsList className="flex h-auto flex-wrap gap-1 bg-[var(--clinical-muted)] p-1">
        <TabsTrigger value="scenarios">Set-pieces · {EXAM_SET_PIECE_SCENARIOS.length}</TabsTrigger>
        <TabsTrigger value="quiz">Exam bank · {EXAM_SET_PIECE_QUIZ_BANK.questions.length} Q</TabsTrigger>
      </TabsList>

      <TabsContent value="scenarios" className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {EXAM_SET_PIECE_SCENARIOS.map((s) => (
            <Button
              key={s.id}
              variant={s.id === activeId ? "default" : "outline"}
              size="sm"
              onClick={() => selectScenario(s)}
            >
              {completed[s.id] && <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-400" />}
              {s.titleRu.replace("Set-piece · ", "")}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{active.titleRu}</CardTitle>
              <Badge variant="outline">{active.domain === "gynecology" ? "Гинекология" : "Акушерство"}</Badge>
              <Badge variant="outline">{active.level === "student" ? "🎓 ординатор" : "👨‍⚕️ врач"}</Badge>
            </div>
            <CardDescription>{EXAM_SET_PIECE_DISCLAIMER}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <section>
              <h3 className="mb-1 text-sm font-semibold">Clinical history</h3>
              <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{active.clinicalHistory}</p>
            </section>
            <section>
              <h3 className="mb-1 text-sm font-semibold">Ultrasound findings</h3>
              <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{active.ultrasoundFindings}</p>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Structured report (set-piece)</h3>
              <ul className="space-y-2">
                {active.reportSections.map((sec) => (
                  <li key={sec.id} className="rounded-lg border border-[var(--clinical-border)] px-3 py-2 text-sm">
                    <span className="font-medium">{sec.label}:</span>{" "}
                    <span className="text-[var(--clinical-foreground-muted)]">{sec.prompt}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Differential / тактика — выберите лучший вариант</h3>
              <div className="space-y-2">
                {active.differentialOptions.map((opt, idx) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={revealed}
                    onClick={() => setSelectedDx(idx)}
                    className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                      selectedDx === idx
                        ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)]/10"
                        : "border-[var(--clinical-border)] hover:bg-[var(--clinical-muted)]"
                    } ${revealed && idx === active.correctDifferentialIndex ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : ""} ${
                      revealed && selectedDx === idx && idx !== active.correctDifferentialIndex
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : ""
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {!revealed && (
                <Button className="mt-3" disabled={selectedDx == null} onClick={revealAnswer}>
                  Проверить ответ
                </Button>
              )}
            </section>

            {revealed && (
              <section className="space-y-3 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Верно
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" /> Неверно — см. образец
                    </>
                  )}
                </div>
                <div>
                  <h4 className="mb-1 flex items-center gap-1 text-sm font-semibold">
                    <BookOpen className="h-4 w-4" /> Sample report
                  </h4>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--clinical-foreground-muted)]">
                    {active.sampleReport}
                  </pre>
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {active.teachingPoints.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {active.relatedHref && (
                  <Link href={active.relatedHref} className="text-sm font-medium text-[var(--clinical-primary)] underline">
                    {active.relatedLabel} →
                  </Link>
                )}
              </section>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="quiz">
        <SelfAssessmentWidget
          bank={EXAM_SET_PIECE_QUIZ_BANK}
          storageKey="sonogyn:exam-set-pieces:quiz-progress"
          title="OBGYN Exam Practice · 25 вопросов"
          disclaimer={EXAM_SET_PIECE_DISCLAIMER}
          relatedLinks={[
            { href: "/tools/refs/exam-checklists", label: "Чек-листы AIUM/ISUOG" },
            { href: "/tools/refs/learning-paths", label: "Learning Paths" },
          ]}
        />
      </TabsContent>
    </Tabs>
  );
}
