"use client";

import Link from "next/link";

import { SelfAssessmentWidget } from "@/components/education/SelfAssessmentWidget";
import { Button } from "@/components/ui/button";
import {
  BIRADS_US_QUIZ_BANK,
  BIRADS_US_QUIZ_STORAGE_KEY,
} from "@/lib/education/birads-us";

export function BiradsUsQuizClient() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 lg:px-8">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/tools/refs/quiz-hub">← Quiz Hub</Link>
        </Button>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
          Самопроверка · BI-RADS US
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          US BI-RADS · категории и лексикон
        </h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {BIRADS_US_QUIZ_BANK.questions.length} вопросов (student / doctor). Опора — ACR BI-RADS US и
          калькулятор SonoGyn. Не диагноз; тактика — врач и протокол ЛПУ.
        </p>
      </div>

      <SelfAssessmentWidget
        bank={BIRADS_US_QUIZ_BANK}
        storageKey={BIRADS_US_QUIZ_STORAGE_KEY}
        title="Самопроверка · BI-RADS US"
        description="Категории ACR, лексикон B-режима, мультипараметр и красные флаги."
        disclaimer="Справочно для специалистов. Вероятности категорий — по ACR BI-RADS. Не является медицинским диагнозом. Чужие коммерческие курсы и УМП в текст не включены."
        relatedLinks={[
          { href: "/tools/calc/rads/bi-rads", label: "Калькулятор BI-RADS" },
          { href: "/tools/calc/rads/bi-rads?modality=us&tab=lymph", label: "BI-RADS · лимфоузлы" },
          { href: "/tools/refs/quiz-hub", label: "Quiz Hub" },
        ]}
      />
    </div>
  );
}
