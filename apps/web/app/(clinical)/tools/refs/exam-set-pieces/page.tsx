import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Stethoscope } from "lucide-react";

import { ExamSetPieceClient } from "@/components/education/ExamSetPieceClient";
import {
  EXAM_SET_PIECE_DISCLAIMER,
  EXAM_SET_PIECE_MODULE_TITLE_RU,
  EXAM_SET_PIECE_QUIZ_BANK,
  SET_PIECE_COUNT,
} from "@/lib/education/exam-set-pieces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Exam Set-pieces · OBGYN",
  description:
    "Radiopaedia-style set-pieces: clinical history → structured report → differential. 4 сценария + 25 exam questions.",
};

export default function ExamSetPiecesPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/tools/refs">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Библиотека
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Radiopaedia-style</Badge>
              <Badge variant="outline">{SET_PIECE_COUNT} сценария</Badge>
              <Badge variant="outline">{EXAM_SET_PIECE_QUIZ_BANK.questions.length} Q</Badge>
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
              <Stethoscope className="h-8 w-8 text-[var(--clinical-primary)]" />
              {EXAM_SET_PIECE_MODULE_TITLE_RU}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              Тренировка для экзамена и ординатуры: история → структурированный отчёт → differential → sample report.
            </p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{EXAM_SET_PIECE_DISCLAIMER}</p>
            <Link href="/tools/refs/exam-checklists" className="text-sm font-medium text-[var(--clinical-primary)] underline">
              Чек-листы полного УЗИ →
            </Link>
          </div>
        </header>

        <ExamSetPieceClient />
      </div>
    </div>
  );
}
