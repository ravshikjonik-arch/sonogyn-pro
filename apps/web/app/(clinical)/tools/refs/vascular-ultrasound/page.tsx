import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";

import { VascularUltrasoundEducationClient } from "@/components/education/VascularUltrasoundEducationClient";
import { VASCULAR_US_DISCLAIMER, VASCULAR_US_LINKS, VASCULAR_US_SOURCE } from "@/lib/education/vascular-ultrasound";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Сосудистое УЗД · образовательный курс",
  description:
    "10 глав по Куликову: гемодинамика, БЦА, TCD, артерии и вены НК, аорта. Случаи, экзамен, режим ординатора.",
};

export default function VascularUltrasoundRefsPage() {
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
              <Badge variant="outline">Обучение</Badge>
              <Badge variant="outline">Ординатор</Badge>
              <Badge variant="outline">Куликов 2015</Badge>
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
              <GraduationCap className="h-8 w-8 text-[var(--clinical-primary)]" />
              Основы ультразвукового исследования сосудов
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              Модуль 2: курс по структуре книги {VASCULAR_US_SOURCE.author} — методика, критерии нормы и патологии,
              протоколы, стандарты заключений. Случаи, самопроверка, карточки ординатора.
            </p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{VASCULAR_US_DISCLAIMER}</p>
            <Link href={VASCULAR_US_LINKS.clinical.href} className="text-sm font-medium text-[var(--clinical-primary)] underline">
              Модуль 1 · клинический протокол и AI →
            </Link>
          </div>
        </header>
        <VascularUltrasoundEducationClient />
      </div>
    </div>
  );
}
