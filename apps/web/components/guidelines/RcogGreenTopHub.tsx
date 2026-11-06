"use client";

import { BookOpenCheck, ExternalLink, GraduationCap, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  GUIDELINES_DISCLAIMER,
  RCOG_BROWSE_URL,
  RCOG_CATEGORY_LABELS,
  RCOG_GREEN_TOP_GUIDELINES,
  RCOG_GUIDELINE_CATEGORY,
  RCOG_SONOGYN_LINKS,
  type RcogCategory,
} from "@repo/clinical-guidelines";

const CATEGORY_ORDER: RcogCategory[] = [
  "antenatal_us",
  "early_pregnancy",
  "preterm_cervix",
  "gyn_us",
];

export function RcogGreenTopHub() {
  const [category, setCategory] = useState<RcogCategory | "all">("all");

  const cards = useMemo(() => {
    if (category === "all") return RCOG_GREEN_TOP_GUIDELINES;
    return RCOG_GREEN_TOP_GUIDELINES.filter((g) => RCOG_GUIDELINE_CATEGORY[g.id] === category);
  }, [category]);

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),_transparent_55%),radial-gradient(ellipse_at_80%_20%,_rgba(13,148,136,0.12),_transparent_40%)]"
      />

      <div className="relative mx-auto max-w-6xl space-y-10 px-4 py-10 lg:px-8">
        <header className="space-y-5">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/tools/refs">← Библиотека</Link>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100">
              RCOG · Green-top
            </Badge>
            <Badge variant="outline">{RCOG_GREEN_TOP_GUIDELINES.length} приоритетных</Badge>
            <Badge variant="outline">UK · не КР РФ</Badge>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Green-top Guidelines
            </h1>
            <p className="text-base leading-relaxed text-[var(--clinical-foreground-muted)]">
              Каталог Royal College of Obstetricians and Gynaecologists для врача УЗИ/АГ: короткие
              ориентиры и переход в инструменты SonoGyn. Полный текст — только на сайте RCOG.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-emerald-700 text-white hover:bg-emerald-600">
              <a href={RCOG_BROWSE_URL} target="_blank" rel="noopener noreferrer">
                Открыть каталог RCOG
                <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tools/refs/guidelines?shelf=international">Полка «Международные»</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tools/refs/isuog-guidelines">ISUOG Hub</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/ai/consultants/fmf">FMF · скрининг</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tools/refs/evidence-sources?tab=ask&corpus=rcog&q=SGA%20FGR">
                Evidence · RCOG
              </Link>
            </Button>
          </div>
        </header>

        <aside
          className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-950 dark:text-amber-100"
          role="note"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold">Приоритет документов для РФ</p>
            <p>
              Сначала КР Минздрава РФ и локальный протокол ЛПУ / ДЗМ. RCOG — международный ориентир
              (Великобритания). {GUIDELINES_DISCLAIMER}
            </p>
          </div>
        </aside>

        <section className="space-y-4" aria-label="Фильтр по теме">
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={category === "all"}
              onClick={() => setCategory("all")}
              label={`Все · ${RCOG_GREEN_TOP_GUIDELINES.length}`}
            />
            {CATEGORY_ORDER.map((id) => {
              const count = RCOG_GREEN_TOP_GUIDELINES.filter((g) => RCOG_GUIDELINE_CATEGORY[g.id] === id)
                .length;
              return (
                <FilterChip
                  key={id}
                  active={category === id}
                  onClick={() => setCategory(id)}
                  label={`${RCOG_CATEGORY_LABELS[id]} · ${count}`}
                />
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Карточки Green-top">
          {cards.map((g) => {
            const cat = RCOG_GUIDELINE_CATEGORY[g.id];
            const links = RCOG_SONOGYN_LINKS[g.id] ?? [];
            return (
              <article
                key={g.id}
                className="group flex flex-col rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]/90 p-5 shadow-sm transition-colors hover:border-emerald-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-emerald-800 dark:text-emerald-200">
                        {g.documentNumber ?? "GTG"}
                      </span>
                      {cat ? (
                        <span className="text-[11px] font-medium text-[var(--clinical-foreground-muted)]">
                          {RCOG_CATEGORY_LABELS[cat]}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="text-base font-semibold leading-snug text-slate-950 dark:text-white">
                      {g.title.replace(/^RCOG · /, "")}
                    </h2>
                  </div>
                  <Badge variant="outline">{g.year}</Badge>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                  {g.summary}
                </p>

                {g.sections?.map((sec) => (
                  <div key={sec.title} className="mt-4 space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                      <BookOpenCheck className="h-3.5 w-3.5" aria-hidden />
                      {sec.title}
                    </p>
                    <ul className="space-y-1.5 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                      {sec.bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {links.length > 0 ? (
                  <div className="mt-5 space-y-2 border-t border-[var(--clinical-border)] pt-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--clinical-foreground)]">
                      <GraduationCap className="h-3.5 w-3.5" aria-hidden />В SonoGyn
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {links.map((l) => (
                        <Link
                          key={l.href + l.label}
                          href={l.href}
                          className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-500/20 dark:text-emerald-100"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-auto pt-4">
                  <a
                    href={g.officialUrl ?? RCOG_BROWSE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-200"
                  >
                    Оригинал на rcog.org.uk
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-6">
          <h2 className="text-lg font-semibold">Обучение</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
            Маршрут: карточка Green-top → инструмент FMF / O-RADS → чек-лист → самопроверка. Полный PDF
            в приложение не копируем.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" asChild className="bg-emerald-700 text-white hover:bg-emerald-600">
              <Link href="/tools/refs/rcog-green-top/quiz">Самопроверка · 12 Q</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tools/refs/learning-paths">Learning paths</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/ai/consultants/fmf/guided">Протокол по сроку</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tools/refs/exam-checklists">Чек-листы</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tools/refs/evidence-sources?tab=ask&source=rcog">Evidence · source=rcog</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-[var(--clinical-border)] bg-[var(--clinical-card)] text-[var(--clinical-foreground)] hover:border-emerald-500/50",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
