"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getObAtlasChapter,
  getObImagingAtlas,
  listObAtlasChapters,
  type ObAtlasChapter,
} from "@repo/obstetrics-imaging-atlas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  initialSection?: string;
  initialSlug?: string;
};

function matchQuery(ch: ObAtlasChapter, q: string): boolean {
  const hay = [
    ch.titleRu,
    ch.titleEn,
    ch.sectionRu,
    ...ch.keyFactsRu,
    ...ch.differentialRu.flatMap((d) => [d.diagnosisRu, ...d.pointsRu]),
    ...ch.images.map((i) => i.captionRu),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function sectionChipLabel(titleRu: string): string {
  const first = titleRu.split(/[\s(·]/)[0] ?? titleRu;
  return first.length > 12 ? `${first.slice(0, 11)}…` : first;
}

export function ObstetricsImagingAtlasWidget({ initialSection = "all", initialSlug }: Props) {
  const doc = getObImagingAtlas();
  const [section, setSection] = useState(initialSection);
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState(initialSlug ?? doc.chapters[0]?.slug ?? "");

  const chapters = useMemo(() => {
    const base = section === "all" ? doc.chapters : listObAtlasChapters(section);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((c) => matchQuery(c, q));
  }, [doc.chapters, section, query]);

  const selected = useMemo(() => {
    return getObAtlasChapter(slug) ?? chapters[0];
  }, [slug, chapters]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
          Акушерство · учебный атлас
        </p>
        <h1 className="text-2xl font-bold md:text-3xl">{doc.meta.titleRu}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {doc.meta.chapterCount} глав, {doc.meta.usImageCount} эхограмм УЗИ с подписями на русском языке.
          Ключевые положения и дифференциальная диагностика — для I–III триместра, плаценты и патологии плода.{" "}
          <Link
            href="/tools/refs/obstetric-atlas"
            className="font-semibold text-[var(--clinical-primary-deep)] hover:underline"
          >
            Атлас Блинова (I триместр)
          </Link>
          .
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">{doc.meta.disclaimerRu}</p>
        <p className="text-xs text-slate-500">{doc.meta.sourceEn}</p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 space-y-3 lg:w-80">
          <Input
            placeholder="Поиск: внемatочная, плацента, ЗРП…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Поиск по атласу"
          />
          <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto">
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
                {sectionChipLabel(s.titleRu)}
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
                {selected.titleEn} · печатные стр. {selected.printStart}–{selected.printEnd}
              </p>
            </div>

            {selected.keyFactsRu.length > 0 ? (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                  Ключевые положения
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  {selected.keyFactsRu.map((line) => (
                    <li key={line.slice(0, 48)}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {selected.differentialRu.length > 0 ? (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                  Дифференциальная диагностика
                </h3>
                <div className="mt-3 space-y-4">
                  {selected.differentialRu.map((dx) => (
                    <div key={dx.diagnosisRu} className="rounded-xl bg-[var(--clinical-muted)] p-3">
                      <p className="font-semibold">{dx.diagnosisRu}</p>
                      {dx.pointsRu.length > 0 ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                          {dx.pointsRu.map((p) => (
                            <li key={p.slice(0, 40)}>{p}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {selected.images.length > 0 ? (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                  Эхограммы и снимки ({selected.images.length})
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {selected.images.map((img) => (
                    <figure
                      key={img.href}
                      className="overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-black/[0.02]"
                    >
                      <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-900">
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
                        </figcaption>
                      ) : null}
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
