"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getUsScanPlanesAtlas,
  getUsScanPlanesChapter,
  listUsScanPlanesChapters,
  type UsScanPlanesChapter,
} from "@repo/us-scan-planes-atlas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  initialSection?: string;
  initialSlug?: string;
};

const SECTION_CHIP_LABEL: Record<string, string> = {
  "infant-head": "Младенец",
  head: "Голова",
  neck: "Шея",
  heart: "Сердце",
  chest: "Грудь",
  abdomen: "Живот",
  pelvis: "Таз",
  "upper-limb": "Руки",
  "lower-limb": "Ноги",
};

function resolveInitialSlug(sectionId: string, slug?: string): string {
  const atlas = getUsScanPlanesAtlas();
  if (slug && getUsScanPlanesChapter(slug)) return slug;
  if (sectionId !== "all") {
    return listUsScanPlanesChapters(sectionId)[0]?.slug ?? atlas.chapters[0]?.slug ?? "";
  }
  return atlas.chapters[0]?.slug ?? "";
}

function matchQuery(ch: UsScanPlanesChapter, q: string): boolean {
  const hay = [ch.titleRu, ch.sectionRu, ...ch.keyFactsRu, ...ch.images.map((i) => i.captionRu)]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function UsScanPlanesAtlasWidget({ initialSection = "all", initialSlug }: Props) {
  const doc = getUsScanPlanesAtlas();
  const [section, setSection] = useState(initialSection);
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState(() => resolveInitialSlug(initialSection, initialSlug));

  const chapters = useMemo(() => {
    const base = section === "all" ? doc.chapters : listUsScanPlanesChapters(section);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((c) => matchQuery(c, q));
  }, [doc.chapters, section, query]);

  const selected = useMemo(() => {
    const pick = getUsScanPlanesChapter(slug);
    if (pick && chapters.some((c) => c.slug === pick.slug)) return pick;
    return chapters[0];
  }, [slug, chapters]);

  const pickSection = (sectionId: string) => {
    setSection(sectionId);
    const next = (sectionId === "all" ? doc.chapters : listUsScanPlanesChapters(sectionId))[0];
    if (next) setSlug(next.slug);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
          Базовая УЗ-техника · плоскости и датчик
        </p>
        <h1 className="text-2xl font-bold md:text-3xl">{doc.meta.titleRu}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {doc.meta.chapterCount} позиций (PDF {doc.meta.chapterCount} слайдов): на каждом — схема постановки датчика и изображение на экране
          прибора. Для ординаторов и приёмов: голова, шея, сердце, живот,{" "}
          <Link href="/tools/refs/prenatal-echography-atlas" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            пренатал
          </Link>
          , таз. Связка с{" "}
          <Link href="/tools/refs/exam-checklists" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            чек-листами УЗИ
          </Link>
          .
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">{doc.meta.disclaimerRu}</p>
        <p className="text-xs text-slate-500">{doc.meta.sourceEn}</p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 space-y-3 lg:w-80">
          <Input
            placeholder="Поиск: сагиттальная, таз, ТВУЗ…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Поиск по атласу плоскостей"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant={section === "all" ? "default" : "outline"} onClick={() => pickSection("all")}>
              Все
            </Button>
            {doc.sections.map((s) => (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant={section === s.id ? "default" : "outline"}
                onClick={() => pickSection(s.id)}
                aria-pressed={section === s.id}
              >
                {SECTION_CHIP_LABEL[s.id] ?? s.titleRu}
              </Button>
            ))}
          </div>
          <ul className="max-h-[min(60vh,520px)] space-y-1 overflow-y-auto rounded-2xl border border-[var(--clinical-border)] p-2">
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
                  <span className="block line-clamp-2">{ch.titleRu}</span>
                  <span className="text-[10px] text-[var(--clinical-foreground-muted)]">
                    стр. {ch.printStart} · {ch.sectionRu}
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
                {selected.sectionRu} · PDF стр. {selected.printStart}
              </p>
            </div>

            {selected.keyFactsRu.length > 0 ? (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                  Подсказки
                </h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed">
                  {selected.keyFactsRu.map((line) => (
                    <li key={line.slice(0, 48)}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {selected.images[0] ? (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
                  Схема + скан
                </h3>
                <figure className="mt-4 overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-black/[0.02]">
                  <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-900">
                    <Image
                      src={selected.images[0].href}
                      alt={selected.images[0].captionRu || selected.titleRu}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 720px"
                      priority
                    />
                  </div>
                  <figcaption className="p-3 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                    Полный слайд атласа: ориентация датчика и изображение на экране.
                  </figcaption>
                </figure>
              </section>
            ) : null}
          </article>
        ) : null}
      </div>
    </div>
  );
}