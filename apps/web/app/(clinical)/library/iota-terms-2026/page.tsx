import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { IotaTerms2026LibraryClient } from "@/components/education/iota-terms-2026/IotaTerms2026LibraryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IOTA_TERMS_2026_LINKS, IOTA_TERMS_2026_META } from "@/lib/education/iota-terms-2026/constants";

export const metadata: Metadata = {
  title: "IOTA 2026 · термины и определения",
  description:
    "Обновлённый консенсус IOTA Group 2026: солидный компонент, тип поражения, папиллярные проекции, цветовой балл, ADNEX — инфографика, текст и 12 вопросов.",
};

export default function IotaTerms2026Page() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/library">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Библиотека
            </Link>
          </Button>
          <div className="space-y-2">
            <Badge variant="outline">IOTA Group · 2026 Update</Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
              Термины и определения IOTA
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              Консенсусное заявление IOTA Group ({IOTA_TERMS_2026_META.published}): структурированные термины для
              описания придаточных образований — modified benign descriptors, ADNEX и двухэтапная стратегия. Инфографика
              + текст + самопроверка (12 вопросов), offline.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href={IOTA_TERMS_2026_LINKS.oradsCalculator.href}
                className="font-medium text-[var(--clinical-primary)] underline"
              >
                {IOTA_TERMS_2026_LINKS.oradsCalculator.label}
              </Link>
              <Link
                href="/evidence?shelf=onco"
                className="font-medium text-[var(--clinical-primary)] underline"
              >
                SonoEvidence · онкология
              </Link>
              <Link
                href={IOTA_TERMS_2026_LINKS.oradsEchograms.href}
                className="font-medium text-[var(--clinical-primary)] underline"
              >
                {IOTA_TERMS_2026_LINKS.oradsEchograms.label}
              </Link>
            </div>
          </div>
        </header>

        <IotaTerms2026LibraryClient />
      </div>
    </div>
  );
}
