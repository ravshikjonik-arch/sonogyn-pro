"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getClinicalEchoAtlas,
  getClinicalEchoChapter,
  listClinicalEchoChapters,
  type EchoAtlasChapter,
} from "@repo/clinical-echocardiography-atlas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renderSimpleMarkdown } from "@/lib/education/simple-markdown";

type Props = {
  initialSection?: string;
  initialSlug?: string;
  initialView?: "chapters" | "glossary";
};

function matchQuery(ch: EchoAtlasChapter, q: string): boolean {
  const hay = [
    ch.titleRu,
    ch.titleEn,
    ch.sectionRu,
    ...ch.summaryRu,
    ...ch.sections.map((s) => `${s.headingRu} ${s.bodyMarkdownRu}`),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

const proseClass =
  "prose-echo space-y-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)] [&_blockquote]:rounded-xl [&_blockquote]:border [&_blockquote]:border-[var(--clinical-border)] [&_blockquote]:bg-[var(--clinical-muted)]/40 [&_blockquote]:p-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--clinical-border)] [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-[var(--clinical-border)] [&_th]:bg-[var(--clinical-muted)] [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc";

export function ClinicalEchocardiographyAtlasWidget({
  initialSection = "all",
  initialSlug,
  initialView = "chapters",
}: Props) {
  const doc = getClinicalEchoAtlas();
  const [section, setSection] = useState(initialSection);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"chapters" | "glossary">(initialView);
  const [slug, setSlug] = useState(initialSlug ?? doc.chapters[0]?.slug ?? "");

  const chapters = useMemo(() => {
    const base = section === "all" ? doc.chapters : listClinicalEchoChapters(section);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((c) => matchQuery(c, q));
  }, [doc.chapters, section, query]);

  const selected = useMemo(() => getClinicalEchoChapter(slug) ?? chapters[0], [slug, chapters]);

  const [glossaryMd, setGlossaryMd] = useState<string | null>(null);
  const [glossaryLoading, setGlossaryLoading] = useState(false);

  useEffect(() => {
    if (view !== "glossary" || glossaryMd) return;
    let cancelled = false;
    setGlossaryLoading(true);
    fetch(doc.meta.glossaryHref)
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled) setGlossaryMd(text);
      })
      .catch(() => {
        if (!cancelled) setGlossaryMd("Не удалось загрузить глоссарий.");
      })
      .finally(() => {
        if (!cancelled) setGlossaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [view, glossaryMd, doc.meta.glossaryHref]);

  const glossaryHtml = useMemo(() => {
    if (!glossaryMd) return "";
    return renderSimpleMarkdown(glossaryMd.replace(/^#\s+.+\n/m, "## "));
  }, [glossaryMd]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
          Кардиология · эхокардиография
        </p>
        <h1 className="text-2xl font-bold md:text-3xl">{doc.meta.titleRu}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {doc.meta.translatedChapterCount} из {doc.meta.chapterCount} глав на русском, глоссарий ASE/ESC. Для
          фетального сердца —{" "}
          <Link href="/tools/refs/fetal-anatomy-22-views" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            22 проекции
          </Link>
          , для акушерского контекста —{" "}
          <Link href="/tools/refs/prenatal-echography-atlas" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            пренатальный атлас
          </Link>
          .{" "}
          <Link href="/tools/refs/nosologies#book-atlas" className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            Нозологии · Otto
          </Link>
          .
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">{doc.meta.disclaimerRu}</p>
        <p className="text-xs text-slate-500">{doc.meta.sourceEn}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={view === "chapters" ? "default" : "outline"} onClick={() => setView("chapters")}>
            Главы
          </Button>
          <Button type="button" size="sm" variant={view === "glossary" ? "default" : "outline"} onClick={() => setView("glossary")}>
            Глоссарий
          </Button>
        </div>
      </header>

      {view === "glossary" ? (
        glossaryLoading ? (
          <p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка глоссария…</p>
        ) : (
          <article className={proseClass} dangerouslySetInnerHTML={{ __html: glossaryHtml }} />
        )
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full shrink-0 space-y-3 lg:w-80">
            <Input
              placeholder="Поиск: ФВ, TAVI, стресс, ВПС…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Поиск по атласу"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={section === "all" ? "default" : "outline"} onClick={() => setSection("all")}>
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
                  className="max-w-[10rem] truncate"
                >
                  {s.titleRu.split("·")[0]?.trim().slice(0, 18) ?? s.id}
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
                    <span className="text-xs text-[var(--clinical-foreground-muted)]">Гл. {ch.chapterNum}</span>
                    <span className="mt-0.5 block leading-snug">{ch.titleRu}</span>
                    {!ch.hasTranslation ? (
                      <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                        перевод скоро
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <article className="min-w-0 flex-1 space-y-6">
            {selected ? (
              <>
                <div className="space-y-1 border-b border-[var(--clinical-border)] pb-4">
                  <p className="text-xs font-medium text-[var(--clinical-foreground-muted)]">
                    {selected.sectionRu} · PDF стр. {selected.printStart}–{selected.printEnd}
                  </p>
                  <h2 className="text-xl font-bold">
                    Глава {selected.chapterNum}. {selected.titleRu}
                  </h2>
                  {selected.summaryRu.length > 0 ? (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--clinical-foreground-muted)]">
                      {selected.summaryRu.slice(0, 8).map((item) => (
                        <li key={item.slice(0, 40)}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                {selected.sections.map((sec) => (
                  <section key={`${selected.slug}-${sec.headingRu}`} className="scroll-mt-24">
                    <h3 className="mb-2 text-base font-bold text-[var(--clinical-foreground)]">{sec.headingRu}</h3>
                    <div
                      className={proseClass}
                      dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(sec.bodyMarkdownRu) }}
                    />
                  </section>
                ))}
              </>
            ) : (
              <p className="text-sm text-[var(--clinical-foreground-muted)]">Выберите главу слева.</p>
            )}
          </article>
        </div>
      )}
    </div>
  );
}
