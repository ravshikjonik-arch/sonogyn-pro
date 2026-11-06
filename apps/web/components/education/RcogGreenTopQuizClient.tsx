"use client";

import Link from "next/link";

import { SelfAssessmentWidget } from "@/components/education/SelfAssessmentWidget";
import { Button } from "@/components/ui/button";
import {
  RCOG_GREEN_TOP_QUIZ_BANK,
  RCOG_QUIZ_STORAGE_KEY,
} from "@/lib/education/rcog-green-top";

export function RcogGreenTopQuizClient() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 lg:px-8">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/tools/refs/rcog-green-top">← RCOG Green-top Hub</Link>
        </Button>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-200">
          Самопроверка · RCOG
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Green-top · маршруты УЗИ
        </h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {RCOG_GREEN_TOP_QUIZ_BANK.questions.length} вопросов: SGA/FGR, плацента, эктопия, шейка,
          O-RADS. Не диагноз; приоритет — КР РФ и протокол ЛПУ.
        </p>
      </div>

      <SelfAssessmentWidget
        bank={RCOG_GREEN_TOP_QUIZ_BANK}
        storageKey={RCOG_QUIZ_STORAGE_KEY}
        title="Самопроверка · Green-top"
        description="Учебные сценарии CDS по хабу RCOG + инструменты SonoGyn."
        disclaimer="Справочно. RCOG — UK; для РФ сверяйте КР Минздрава и локальный протокол. Не является медицинским диагнозом."
        relatedLinks={[
          { href: "/tools/refs/rcog-green-top", label: "Хабу Green-top" },
          { href: "/ai/consultants/fmf?section=third", label: "FMF · III" },
          { href: "/tools/refs/learning-paths", label: "Learning paths" },
        ]}
      />
    </div>
  );
}
