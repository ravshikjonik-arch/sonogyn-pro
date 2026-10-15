import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";

import { QuizHubClient } from "@/components/education/QuizHubClient";
import { Button } from "@/components/ui/button";
import { QUIZ_HUB_ENTRIES } from "@/lib/education/quiz-hub-registry";

export const metadata: Metadata = {
  title: "Клинические задачи · Quiz hub",
  description:
    "Самопроверка и exam-style задачи для врача УЗД/АГ: O-RADS, IOTA, акушерство, шейка матки — без дублирования банков.",
};

export default function QuizHubPage() {
  const count = QUIZ_HUB_ENTRIES.filter((e) => e.id !== "quiz-hub-meta").length;

  return (
    <div className="px-4 py-10 pb-24 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/tools/refs">
              <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
              Справочник
            </Link>
          </Button>
          <div className="space-y-2">
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
              <ClipboardList className="h-8 w-8 text-[var(--clinical-primary)]" aria-hidden />
              Клинические задачи
            </h1>
            <p className="max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
              {count} модулей самопроверки и exam practice. Каждый ведёт на существующий quiz-bank — формулы и
              вопросы не копируются.
            </p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              Обезличенные сценарии · предварительная интерпретация ≠ установленный диагноз.
            </p>
          </div>
        </header>
        <QuizHubClient />
      </div>
    </div>
  );
}
