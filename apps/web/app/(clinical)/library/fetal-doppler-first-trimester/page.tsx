import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Stethoscope } from "lucide-react";

import { FetalDopplerFirstTrimesterClient } from "@/components/education/FetalDopplerFirstTrimesterClient";
import { FETAL_DOPPLER_FIRST_TRIMESTER_LECTURE_ID } from "@/lib/clinical-assistant/first-trimester-doppler";
import { FETAL_DOPPLER_DISCLAIMER, FETAL_DOPPLER_LINKS } from "@/lib/education/fetal-doppler-first-trimester";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Допплер I триместра (11–14 нед) · образовательный курс",
  description:
    "5 допплер-позиций FMF: сердце, венозный проток, пуповина, пупочное кольцо, маточные артерии. ALARA, случаи, самопроверка 16 Q.",
};

export default function FetalDopplerFirstTrimesterPage() {
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
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">FMF · I триместр</Badge>
              <Badge variant="outline">11–14 нед</Badge>
              <Badge variant="outline">offline-first</Badge>
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
              <Stethoscope className="h-8 w-8 text-[var(--clinical-primary)]" />
              Doppler Ultrasound in the First Trimester (11–14 Weeks)
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              Расширенный допплер-протокол по материалам М.В. Ситарской (ultrasoundoc.com): ALARA, 5 позиций,
              PI венозного протока и маточных артерий, SUA, omphalocele/gastroschisis, 9 случаев, 16 вопросов
              самопроверки.
            </p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{FETAL_DOPPLER_DISCLAIMER}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href={`/library/basic-course?lecture=${FETAL_DOPPLER_FIRST_TRIMESTER_LECTURE_ID}&tab=lecture`}
                className="font-medium text-[var(--clinical-primary)] underline"
              >
                ISUOG Basic Training · лекция 7
              </Link>
              <Link href={FETAL_DOPPLER_LINKS.fmf.href} className="font-medium text-[var(--clinical-primary)] underline">
                {FETAL_DOPPLER_LINKS.fmf.label}
              </Link>
              <Link
                href={FETAL_DOPPLER_LINKS.obstetricAtlas.href}
                className="font-medium text-[var(--clinical-primary)] underline"
              >
                {FETAL_DOPPLER_LINKS.obstetricAtlas.label}
              </Link>
            </div>
          </div>
        </header>

        <FetalDopplerFirstTrimesterClient />
      </div>
    </div>
  );
}
