import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CervixPathologyLibraryClient } from "@/components/education/CervixPathologyLibraryClient";
import { CERVIX_PATHOLOGY_QUIZ_LINKS } from "@/lib/education/cervix-pathology-quiz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Патология шейки матки · справочник, цитология, самопроверка",
  description:
    "8 глав справочника + интерактивный модуль «Цитология и скрининг РШМ»: Bethesda, HPV, алгоритмы ASCCP, кейсы, AI и 25 вопросов.",
};

export default function CervixPathologyPage() {
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
            <Badge variant="outline">Справочник · offline-first</Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
              Патология шейки матки
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              8 глав справочника (TTS для студента, квик-реф для врача) + интерактив «Цитология · скрининг»: алгоритмы,
              Bethesda AI, кейсы, лекции и самопроверка. Без персональных данных в AI-формах.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href={CERVIX_PATHOLOGY_QUIZ_LINKS.cytology.href}
                className="font-medium text-[var(--clinical-primary)] underline"
              >
                {CERVIX_PATHOLOGY_QUIZ_LINKS.cytology.label}
              </Link>
              <Link
                href={CERVIX_PATHOLOGY_QUIZ_LINKS.nosology.href}
                className="font-medium text-[var(--clinical-primary)] underline"
              >
                {CERVIX_PATHOLOGY_QUIZ_LINKS.nosology.label}
              </Link>
              <Link
                href={CERVIX_PATHOLOGY_QUIZ_LINKS.evidence.href}
                className="font-medium text-[var(--clinical-primary)] underline"
              >
                {CERVIX_PATHOLOGY_QUIZ_LINKS.evidence.label}
              </Link>
            </div>
          </div>
        </header>

        <CervixPathologyLibraryClient />
      </div>
    </div>
  );
}
