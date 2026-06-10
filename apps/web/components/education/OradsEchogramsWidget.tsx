"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ORADS_US_MANAGEMENT,
  ORADS_US_VERSION,
  SUPPLEMENTARY_READING,
  getAdnexDataset,
  listAdnexPages,
  searchAdnexPages,
  type AdnexPageRecord,
} from "@repo/adnex-education";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CHAPTER_LABELS: Record<string, string> = {
  all: "Все",
  intro: "Введение",
  iota: "IOTA",
  morphology: "Морфология",
  orads: "O-RADS",
  management: "Тактика",
};

type Props = {
  initialChapter?: string;
  initialPageId?: string;
};

export function OradsEchogramsWidget({ initialChapter = "all", initialPageId }: Props) {
  const catalog = getAdnexDataset();
  const [chapter, setChapter] = useState(initialChapter);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialPageId ?? null);

  const pages = useMemo(() => {
    if (query.trim()) return searchAdnexPages(query);
    return listAdnexPages(chapter === "all" ? undefined : { chapter });
  }, [chapter, query]);

  const selected: AdnexPageRecord | undefined = useMemo(() => {
    if (!selectedId) return pages[0];
    return pages.find((p) => p.id === selectedId) ?? pages[0];
  }, [pages, selectedId]);

  const supplementary = SUPPLEMENTARY_READING[0];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
          O-RADS US · эхограммы
        </p>
        <h1 className="text-2xl font-bold md:text-3xl">Библиотека эхограмм придатков матки</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Официальный расчёт категории — по {ORADS_US_VERSION} (ACR) в{" "}
          <Link href="/calculators/o-rads" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            калькуляторе O-RADS
          </Link>
          . Здесь — учебные снимки и разбор; позже добавим живые клинические случаи по нозологиям.
        </p>
        {supplementary ? (
          <p className="text-xs text-slate-500">
            {supplementary.citation} — {supplementary.note}
          </p>
        ) : null}
      </header>

      <section className="rounded-3xl border border-dashed border-sky-300 bg-sky-50/50 p-4 dark:border-sky-800 dark:bg-sky-950/20">
        <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">Скоро: реальные случаи</p>
        <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
          Планируем альбомы по нозологиям (эндометриома, дермоид, серозная и др.) с деидентифицированными
          эхограммами из практики — для сопоставления с O-RADS US.
        </p>
      </section>

      <section className="rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5">
        <h2 className="text-lg font-bold">Тактика по O-RADS US (ACR v2022)</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {([1, 2, 3, 4, 5] as const).map((cat) => (
            <div
              key={cat}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/40"
            >
              <p className="font-bold text-[var(--clinical-primary-deep)]">O-RADS {cat}</p>
              <p className="mt-1 text-[var(--clinical-foreground-muted)]">{ORADS_US_MANAGEMENT[cat]}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {["all", ...catalog.chapters.map((c) => c.id)].map((id) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={chapter === id ? "default" : "outline"}
              onClick={() => setChapter(id)}
            >
              {CHAPTER_LABELS[id] ?? id}
            </Button>
          ))}
        </div>
        <Input
          placeholder="Поиск по тексту страницы…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="max-h-[70vh] space-y-2 overflow-y-auto rounded-2xl border border-[var(--clinical-border)] p-2">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`flex w-full gap-3 rounded-xl border p-2 text-left text-xs transition ${
                selected?.id === p.id
                  ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)]/5"
                  : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/40"
              }`}
            >
              <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-slate-100">
                <Image src={p.image_href} alt="" fill className="object-cover" sizes="40px" />
              </div>
              <div className="min-w-0">
                <p className="font-bold">Стр. {p.page_number}</p>
                <p className="line-clamp-2 text-[var(--clinical-foreground-muted)]">
                  {p.title ?? p.teaching_hint ?? p.ocr_text.slice(0, 80)}
                </p>
              </div>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="space-y-3">
            <div className="relative aspect-[3/4] max-h-[70vh] w-full overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-black/5">
              <Image
                src={selected.image_href}
                alt={selected.title ?? `Стр. ${selected.page_number}`}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <p className="text-sm font-bold">Страница {selected.page_number}</p>
            {selected.teaching_hint ? (
              <p className="text-sm text-[var(--clinical-foreground-muted)]">{selected.teaching_hint}</p>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link href="/calculators/o-rads">Вернуться в калькулятор O-RADS →</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
