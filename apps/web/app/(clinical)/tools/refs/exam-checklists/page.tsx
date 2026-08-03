import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";

import { ExamChecklistsClient } from "@/components/education/ExamChecklistsClient";
import {
  EXAM_CHECKLISTS_DISCLAIMER,
  EXAM_CHECKLISTS_LINKS,
  EXAM_CHECKLISTS_MODULE_TITLE_RU,
  EXAM_ITEM_COUNT,
  EXAM_PROTOCOL_COUNT,
  EXAM_CHECKLISTS_QUIZ_BANK,
} from "@/lib/education/exam-checklists";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Чек-листы полного УЗИ · AIUM / ISUOG",
  description:
    "Интерактивные чек-листы полного УЗИ-исследования: гинекология TA+TV, стандартное акушерское, I и III триместр. AIUM / ISUOG practice parameters.",
};

export default function ExamChecklistsPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={EXAM_CHECKLISTS_LINKS.library.href}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {EXAM_CHECKLISTS_LINKS.library.label}
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">AIUM</Badge>
              <Badge variant="outline">ISUOG</Badge>
              <Badge variant="outline">{EXAM_PROTOCOL_COUNT} протокола</Badge>
              <Badge variant="outline">{EXAM_ITEM_COUNT} пунктов</Badge>
              <Badge variant="outline">{EXAM_CHECKLISTS_QUIZ_BANK.questions.length} Q</Badge>
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
              <ClipboardCheck className="h-8 w-8 text-[var(--clinical-primary)]" />
              {EXAM_CHECKLISTS_MODULE_TITLE_RU}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              Интерактивные чек-листы по международным practice parameters: отметьте выполненные пункты во время
              исследования, отслеживайте полноту протокола, переходите к Structured Reporting.
            </p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{EXAM_CHECKLISTS_DISCLAIMER}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href={EXAM_CHECKLISTS_LINKS.reports.href} className="font-medium text-[var(--clinical-primary)] underline">
                {EXAM_CHECKLISTS_LINKS.reports.label}
              </Link>
              <Link
                href={EXAM_CHECKLISTS_LINKS.fetalAnatomy.href}
                className="font-medium text-[var(--clinical-primary)] underline"
              >
                {EXAM_CHECKLISTS_LINKS.fetalAnatomy.label}
              </Link>
              <Link
                href={EXAM_CHECKLISTS_LINKS.fmf.href}
                className="font-medium text-[var(--clinical-primary)] underline"
              >
                {EXAM_CHECKLISTS_LINKS.fmf.label}
              </Link>
            </div>
          </div>
        </header>

        <ExamChecklistsClient />
      </div>
    </div>
  );
}
