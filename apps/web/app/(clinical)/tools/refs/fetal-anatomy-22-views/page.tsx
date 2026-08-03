import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scan } from "lucide-react";

import { FetalAnatomy22ViewsClient } from "@/components/education/FetalAnatomy22ViewsClient";
import {
  FETAL_ANATOMY_ANOMALY_COUNT,
  FETAL_ANATOMY_CASES,
  FETAL_ANATOMY_DISCLAIMER,
  FETAL_ANATOMY_LINKS,
  FETAL_ANATOMY_MODULE_TITLE,
  FETAL_ANATOMY_MODULE_TITLE_RU,
  FETAL_ANATOMY_QUIZ_BANK,
  FETAL_ANATOMY_SOURCE,
  FETAL_ANATOMY_VIEW_COUNT,
} from "@/lib/education/fetal-anatomy-22-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "22 среза · 65 ВПР плода · II триместр",
  description:
    "Систематический протокол УЗИ II триместра: 22 views, база 65 аномалий, 15 случаев, 20 Q, атлас (Е.С. Емельяненко).",
};

export default function FetalAnatomy22ViewsPage() {
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
              <Badge variant="outline">II триместр · 18–22 нед</Badge>
              <Badge variant="outline">{FETAL_ANATOMY_VIEW_COUNT} views</Badge>
              <Badge variant="outline">{FETAL_ANATOMY_ANOMALY_COUNT} ВПР</Badge>
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
              <Scan className="h-8 w-8 text-[var(--clinical-primary)]" />
              {FETAL_ANATOMY_MODULE_TITLE_RU}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              {FETAL_ANATOMY_MODULE_TITLE}. Spine, brain, heart (7a–10), abdomen, pelvis, limbs, face + overview sweeps.
              {FETAL_ANATOMY_CASES.length} клинических случаев, {FETAL_ANATOMY_QUIZ_BANK.questions.length} вопросов
              самопроверки, searchable база {FETAL_ANATOMY_ANOMALY_COUNT} ВПР.
            </p>
            <p className="text-xs">
              {FETAL_ANATOMY_SOURCE.author} · {FETAL_ANATOMY_SOURCE.organization}
            </p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{FETAL_ANATOMY_DISCLAIMER}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href={FETAL_ANATOMY_LINKS.fmf.href} className="font-medium text-[var(--clinical-primary)] underline">
                {FETAL_ANATOMY_LINKS.fmf.label}
              </Link>
              <Link
                href={FETAL_ANATOMY_LINKS.fetalSpine.href}
                className="font-medium text-[var(--clinical-primary)] underline"
              >
                {FETAL_ANATOMY_LINKS.fetalSpine.label}
              </Link>
            </div>
          </div>
        </header>

        <FetalAnatomy22ViewsClient />
      </div>
    </div>
  );
}
