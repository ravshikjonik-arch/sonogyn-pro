"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getMammologyAtlasChapter,
  getMammologyNationalAtlas,
  listMammologyAtlasChapters,
  type MammologyAtlasChapter,
} from "@repo/mammology-national-atlas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  initialSection?: string;
  initialSlug?: string;
};

function matchQuery(ch: MammologyAtlasChapter, q: string): boolean {
  const hay = [
    ch.titleRu,
    ch.sectionRu,
    ...ch.keyFactsRu,
    ...ch.figureCaptionsRu,
    ...ch.images.map((i) => i.captionRu),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function MammologyNationalAtlasWidget({ initialSection = "all", initialSlug }: Props) {
  const doc = getMammologyNationalAtlas();
  const [section, setSection] = useState(initialSection);
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState(initialSlug ?? doc.chapters[0]?.slug ?? "");

  const chapters = useMemo(() => {
    const base = section === "all" ? doc.chapters : listMammologyAtlasChapters(section);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((c) => matchQuery(c, q));
  }, [doc.chapters, section, query]);

  const selected = useMemo(() => {
    return getMammologyAtlasChapter(slug) ?? chapters[0];
  }, [slug, chapters]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
          Маммология · национальное руководство
        </p>
        <h1 className="text-2xl font-bold md:text-3xl">{doc.meta.titleRu}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {doc.meta.chapterCount} глав, {doc.meta.usImageCount} разворотов скана, OCR-текст и подписи рисунков.
          Для протокола УЗИ МЖ и BI-RADS —{" "}
          <Link href="/tools/calc/rads/bi-rads" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            калькулятор BI-RADS
          </Link>
          .{" "}
          <Link href="/tools/refs/nosologies#book-atlas" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            Нозологии · маммология
          </Link>
          .
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">{doc.meta.disclaimerRu}</p>
        <p className="text-xs text-slate-500">{doc.meta.sourceEn}</p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 space-y-3 lg:w-80">
          <Input
            placeholder="Поиск: УЗИ, BI-RADS, фибroadenoma…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Поиск по атласу"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={section === "all" ? "default" : "outline"}
              onClick={() => setSection("all")}
            >
              Все
            </Button>
            {doc.sections.map((s) => (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant={section === s.id ? "default" : "outline"}
                onClick={() => setSection(s.id)}
                title={s.titleRu}
              >
                {s.titleRu.split(" ")[0]}
              </Button>
            ))}
          </div>
          <ul className="max-h-[min(60vh,520px)] space-y-1 overflow-y-auto rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-2">
            {chapters.map((ch) => (
              <li key={ch.slug}>
                <button
                  type="button"
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    selected?.slug === ch.slug
                      ? "bg-[var(--clinical-primary-muted)] font-semibold text-[var(--clinical-primary-deep)]"
                      : "hover:bg-black/[0.04]"
                  }`}
                  onClick={() => setSlug(ch.slug)}
                >
                  <span className="block">{ch.titleRu}</span>
                  <span className="text-[10px] text-[var(--clinical-foreground-muted)]">
                    стр. {ch.printStart}–{ch.printEnd} · {ch.sectionRu}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {selected ? (
          <article className="min-w-0 flex-1 space-y-6 rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-bold">{selected.titleRu}</h2>
              <p className="text-xs text-[var(--clinical-foreground-muted)]">
                Печатные стр. {selected.printStart}–{selected.printEnd}
              </p>
            </div>

            {selected.keyFactsRu.length > 0 ? (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                  Фрагменты текста (OCR)
                </h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed">
                  {selected.keyFactsRu.map((line) => (
                    <li key={line.slice(0, 48)}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {selected.figureCaptionsRu.length > 0 ? (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                  Подписи рисунков и схем ({selected.figureCaptionsRu.length})
                </h3>
                <ul className="mt-2 max-h-64 list-disc space-y-1 overflow-y-auto pl-5 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                  {selected.figureCaptionsRu.map((line) => (
                    <li key={line.slice(0, 56)}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {selected.images.length > 0 ? (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                  Развороты учебника ({selected.images.length})
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {selected.images.map((img) => (
                    <figure
                      key={img.href}
                      className="overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-black/[0.02]"
                    >
                      <div className="relative aspect-[3/4] w-full bg-slate-100 dark:bg-slate-900">
                        <Image
                          src={img.href}
                          alt={img.captionRu || selected.titleRu}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 320px"
                        />
                      </div>
                      <figcaption className="p-2 text-[10px] text-[var(--clinical-foreground-muted)]">
                        {img.captionRu}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            ) : null}
          </article>
        ) : null}
      </div>
    </div>
  );
}
