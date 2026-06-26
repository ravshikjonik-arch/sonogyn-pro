import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { FetalSpineGalleryClient } from "@/components/education/fetal-spine/FetalSpineGalleryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FETAL_SPINE_LINKS } from "@/lib/education/fetal-spine/constants";

export const metadata: Metadata = {
  title: "УЗИ позвоночника плода · атлас карточек",
  description:
    "15 интерактивных карточек: норма, spina bifida, миеломенингоцеле, сколиоз, тератомы, каудальная регрессия — для скрининга II–III триместра.",
};

export default function FetalSpineLibraryPage() {
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
            <Badge variant="outline">Атлас · offline-first</Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
              УЗИ позвоночника плода
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              15 карточек с инфографикой и структурированным протоколом: от анатомии до патологии. Поиск, фильтры по
              тегам, lightbox и копирование заключения.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href={FETAL_SPINE_LINKS.obstetricAtlas.href}
                className="font-medium text-[var(--clinical-primary)] underline"
              >
                {FETAL_SPINE_LINKS.obstetricAtlas.label}
              </Link>
              <Link
                href={FETAL_SPINE_LINKS.evidence.href}
                className="font-medium text-[var(--clinical-primary)] underline"
              >
                {FETAL_SPINE_LINKS.evidence.label}
              </Link>
            </div>
          </div>
        </header>

        <FetalSpineGalleryClient />
      </div>
    </div>
  );
}
