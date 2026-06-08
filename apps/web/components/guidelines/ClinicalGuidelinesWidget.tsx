"use client";

import { ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import {
  CLINICAL_GUIDELINES,
  DOCUMENT_KIND_LABELS,
  GUIDELINES_DISCLAIMER,
  ISSUER_LABELS,
  SHELF_DESCRIPTIONS,
  SHELF_LABELS,
  SHELF_ORDER,
  SPECIALTY_FILTER_CHIPS,
  SPECIALTY_LABELS,
  STATUS_LABELS,
  countByShelf,
  groupGuidelinesByShelf,
  searchGuidelines,
  type GuidelineShelf,
  type GuidelineShelfFilter,
  type GuidelineSpecialtyFilter,
} from "@repo/clinical-guidelines";

export function ClinicalGuidelinesCatalog() {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState<GuidelineSpecialtyFilter>("all");
  const [shelf, setShelf] = useState<GuidelineShelfFilter>("all");

  const filtered = useMemo(
    () => searchGuidelines(CLINICAL_GUIDELINES, query, { specialty, shelf, activeOnly: false }),
    [query, specialty, shelf],
  );

  const grouped = useMemo(
    () => groupGuidelinesByShelf(filtered, SHELF_ORDER),
    [filtered],
  );

  const shelfCounts = useMemo(() => countByShelf(), []);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 lg:px-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
          Справочник документов
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Клинические рекомендации и приказы
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Отдельные полки: КР Минздрава РФ, приказы ДЗМ, приказы МЗ, международные гайдлайны.
          Каждый документ — отдельная карточка с выдержками и ссылкой на официальный источник.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href="/nosologies" className="font-medium text-[var(--clinical-primary)] underline">
            Нозологии →
          </Link>
          <span className="text-[var(--clinical-foreground-muted)]">·</span>
          <Link href="/reference" className="font-medium text-[var(--clinical-primary)] underline">
            Клин. нормы УЗИ →
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SHELF_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setShelf(shelf === s ? "all" : s)}
            className={cn(
              "rounded-2xl border p-4 text-left transition-colors",
              shelf === s
                ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)]"
                : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:bg-[var(--clinical-muted)]",
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
              {shelfCounts[s]} док.
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug">{SHELF_LABELS[s]}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--clinical-foreground-muted)]" />
          <Input
            className="pl-9"
            placeholder="Поиск по названию, тегам, номеру приказа…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_FILTER_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setSpecialty(chip.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                specialty === chip.id
                  ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                  : "border-[var(--clinical-border)] text-[var(--clinical-foreground-muted)] hover:bg-[var(--clinical-muted)]",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Ничего не найдено</CardTitle>
            <CardDescription>Измените фильтры или поисковый запрос.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        grouped.map(({ shelf: shelfId, items }) => (
          <ShelfSection key={shelfId} shelf={shelfId} items={items} />
        ))
      )}

      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        {GUIDELINES_DISCLAIMER}
      </p>
    </div>
  );
}

function ShelfSection({
  shelf,
  items,
}: {
  shelf: GuidelineShelf;
  items: (typeof CLINICAL_GUIDELINES)[number][];
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{SHELF_LABELS[shelf]}</h2>
        <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">{SHELF_DESCRIPTIONS[shelf]}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((g) => (
          <Link key={g.id} href={`/guidelines/${g.id}`} className="group block">
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader className="space-y-2 pb-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{DOCUMENT_KIND_LABELS[g.documentKind]}</Badge>
                  <Badge variant="secondary">{SPECIALTY_LABELS[g.specialty]}</Badge>
                  {g.status !== "active" ? (
                    <Badge variant="outline" className="border-amber-300 text-amber-800">
                      {STATUS_LABELS[g.status]}
                    </Badge>
                  ) : null}
                </div>
                <CardTitle className="text-base leading-snug">{g.title}</CardTitle>
                <CardDescription className="text-xs">
                  {ISSUER_LABELS[g.issuer]} · {g.year}
                  {g.documentNumber ? ` · ${g.documentNumber}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{g.summary}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ClinicalGuidelineDetailView({ guidelineId }: { guidelineId: string }) {
  const g = CLINICAL_GUIDELINES.find((x) => x.id === guidelineId);

  if (!g) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-[var(--clinical-foreground-muted)]">Документ не найден.</p>
        <Link href="/guidelines" className="mt-4 inline-block text-sm font-semibold text-[var(--clinical-primary)]">
          ← К каталогу
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-8 lg:px-8">
      <Link href="/guidelines" className="text-sm font-semibold text-[var(--clinical-primary)] hover:underline">
        ← Все полки
      </Link>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--clinical-foreground-muted)]">
          {SHELF_LABELS[g.shelf]}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge>{DOCUMENT_KIND_LABELS[g.documentKind]}</Badge>
          <Badge variant="outline">{ISSUER_LABELS[g.issuer]}</Badge>
          <Badge variant="secondary">{SPECIALTY_LABELS[g.specialty]}</Badge>
          <Badge variant="outline">{STATUS_LABELS[g.status]}</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{g.title}</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          {g.year}
          {g.documentNumber ? ` · ${g.documentNumber}` : ""}
          {g.effectiveFrom ? ` · с ${g.effectiveFrom}` : ""}
          {g.revisedAt ? ` · редакция ${g.revisedAt}` : ""}
        </p>
        <p className="text-base leading-relaxed text-slate-800 dark:text-slate-100">{g.summary}</p>
      </div>

      {g.sections?.map((sec) => (
        <Card key={sec.title}>
          <CardHeader>
            <CardTitle className="text-lg">{sec.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
              {sec.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      {g.relatedNosologyIds?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Связанные нозологии</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {g.relatedNosologyIds.map((id) => (
              <Link key={id} href={`/nosologies/${id}`}>
                <Badge variant="outline" className="hover:bg-[var(--clinical-muted)]">
                  {id}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {g.officialUrl ? (
        <a
          href={g.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--clinical-primary-muted)] px-4 py-3 text-sm font-semibold text-[var(--clinical-primary-deep)] hover:opacity-90"
        >
          Официальный документ
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}

      {g.tags?.length ? (
        <p className="text-xs text-[var(--clinical-foreground-muted)]">Теги: {g.tags.join(" · ")}</p>
      ) : null}

      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        {GUIDELINES_DISCLAIMER}
      </p>
    </article>
  );
}
