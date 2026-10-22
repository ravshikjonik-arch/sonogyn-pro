"use client";

import {
  BOOK_ID_LABELS,
  BOOK_NOSOLOGY_ZONE_LABELS,
  getBookNosologyEntry,
} from "@repo/book-nosology-registry";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { entryId: string };

export function BookNosologyDetailClient({ entryId }: Props) {
  const entry = getBookNosologyEntry(entryId);

  if (!entry) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-[var(--clinical-foreground-muted)]">Тема не найдена.</p>
        <Button variant="link" asChild className="mt-4 px-0">
          <Link href="/tools/refs/nosologies#book-atlas">← К справочнику</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 lg:px-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href="/tools/refs/nosologies#book-atlas">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Нозологии · атласы книг
        </Link>
      </Button>

      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{BOOK_ID_LABELS[entry.bookId]}</Badge>
          <Badge variant="secondary">{BOOK_NOSOLOGY_ZONE_LABELS[entry.zone]}</Badge>
          {entry.imageCount > 0 ? <Badge variant="outline">{entry.imageCount} иллюстраций</Badge> : null}
        </div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{entry.titleRu}</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">{entry.domainLabel}</p>
      </header>

      {entry.parentChapterSlug ? (
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Глава атласа:{" "}
          <Link href={entry.atlasHref} className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            {entry.parentChapterSlug}
          </Link>
        </p>
      ) : null}

      {(entry.imageHrefs?.length ? entry.imageHrefs : entry.previewImageHref ? [entry.previewImageHref] : []).length >
      0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {(entry.imageHrefs?.slice(0, 6) ?? (entry.previewImageHref ? [entry.previewImageHref] : [])).map((src) => (
            <figure key={src} className="overflow-hidden rounded-xl border border-[var(--clinical-border)]">
              <Image
                src={src}
                alt=""
                width={480}
                height={360}
                className="h-auto max-h-[280px] w-full object-contain bg-[var(--clinical-background)]"
                unoptimized
              />
            </figure>
          ))}
        </div>
      ) : null}
      {entry.imageHrefs && entry.imageHrefs.length > 6 ? (
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Ещё {entry.imageHrefs.length - 6} снимков — в полном атласе.
        </p>
      ) : null}
      {entry.previewImageHref || entry.imageHrefs?.length ? (
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Учебные снимки · сверка с монитором. Не диагноз.
        </p>
      ) : null}

      {entry.keyFactsRu.length > 0 ? (
        <Card className="border-[var(--clinical-border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ключевые тезисы (книга)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
              {entry.keyFactsRu.map((line) => (
                <li key={line.slice(0, 48)}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={entry.atlasHref}>Открыть в атласе →</Link>
        </Button>
        {entry.linkedSeedNosologyIds.map((seedId) => (
          <Button key={seedId} variant="outline" asChild>
            <Link href={`/nosologies/${seedId}`}>Клиническая нозология</Link>
          </Button>
        ))}
      </div>

      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        Учебный материал SonoGyn Pro. Интерпретация и тактика — лечащим специалистом по актуальным КР и
        гайдлайнам.
      </p>
    </div>
  );
}
