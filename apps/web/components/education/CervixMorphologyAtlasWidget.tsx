"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getCervixMorphAtlas,
  getCervixMorphChapter,
  listCervixMorphChapters,
  type CervixMorphAtlasChapter,
} from "@repo/cervix-morphology-atlas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  initialSection?: string;
  initialSlug?: string;
};

function matchQuery(ch: CervixMorphAtlasChapter, q: string): boolean {
  const hay = [
    ch.titleRu,
    ch.sectionRu,
    ...ch.keyFactsRu,
    ...ch.images.map((i) => i.captionRu),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function CervixMorphologyAtlasWidget({ initialSection = "all", initialSlug }: Props) {
  const doc = getCervixMorphAtlas();
  const [section, setSection] = useState(initialSection);
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState(initialSlug ?? doc.chapters[0]?.slug ?? "");

  const chapters = useMemo(() => {
    const base = section === "all" ? doc.chapters : listCervixMorphChapters(section);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((c) => matchQuery(c, q));
  }, [doc.chapters, section, query]);

  const selected = useMemo(() => {
    return getCervixMorphChapter(slug) ?? chapters[0];
  }, [slug, chapters]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
          Шейка матки · морфологический атлас
        </p>
        <h1 className="text-2xl font-bold md:text-3xl">{doc.meta.titleRu}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {doc.meta.chapterCount} глав, {doc.meta.usImageCount} микро- и макропрепаратов (ГЭ ×400 и др.).
          CIN/HSIL, AIS, гистотипы карцином, ИГХ и генетика — в связке с модулем скрининга.{" "}
          <Link
            href="/tools/refs/cervix-pathology?tab=cytology"
            className="font-semibold text-[var(--clinical-primary-deep)] hover:underline"
          >
            Патология шейки · цитология
          </Link>
          .
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">{doc.meta.disclaimerRu}</p>
        <p className="text-xs text-slate-500">{doc.meta.sourceEn}</p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 space-y-3 lg:w-80">
          <Input
            placeholder="Поиск: CIN III, аденокарцинома, p16…"
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
                  Ключевые положения и фрагменты текста
                </h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed">
                  {selected.keyFactsRu.map((line) => (
                    <li key={line.slice(0, 48)}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {selected.images.length > 0 ? (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                  Гистологические изображения ({selected.images.length})
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {selected.images.map((img) => (
                    <figure
                      key={img.href}
                      className="overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-black/[0.02]"
                    >
                      <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-900">
                        <Image
                          src={img.href}
                          alt={img.captionRu || selected.titleRu}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 320px"
                        />
                      </div>
                      {img.captionRu ? (
                        <figcaption className="p-3 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                          {img.captionRu}
                          {img.printPage ? (
                            <span className="mt-1 block text-[10px] opacity-70">стр. {img.printPage}</span>
                          ) : null}
                        </figcaption>
                      ) : (
                        img.printPage ? (
                          <figcaption className="p-3 text-[10px] text-[var(--clinical-foreground-muted)]">
                            стр. {img.printPage}
                          </figcaption>
                        ) : null
                      )}
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
