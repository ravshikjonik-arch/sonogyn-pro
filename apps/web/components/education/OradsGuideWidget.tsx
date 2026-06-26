"use client";

import { BookOpen, Calculator, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { getOradsReferat, type OradsReferatSection } from "@repo/orads-us";

type Props = {
  initialSectionId?: string;
  locale?: string;
  className?: string;
};

function SectionBlock({
  section,
  cases,
  caseLabel,
}: {
  section: OradsReferatSection;
  cases: ReturnType<typeof getOradsReferat>["cases"];
  caseLabel: string;
}) {
  const sectionCases = cases.filter((c) => c.sectionId === section.id && c.image);

  return (
    <section id={section.id} className="scroll-mt-24 border-b border-[var(--clinical-border)] pb-10 last:border-0">
      <h2 className="text-xl font-bold text-[var(--clinical-foreground)]">{section.title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
        {section.paragraphs.map((p) => (
          <p key={p.slice(0, 40)}>{p}</p>
        ))}
        {section.bullets ? (
          <ul className="list-disc space-y-1 pl-5">
            {section.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {section.image ? (
        <figure className="mt-5 overflow-hidden rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-surface)]">
          <div className="relative aspect-[16/10] w-full">
            <Image src={section.image} alt={section.imageCaption ?? section.title} fill className="object-contain" sizes="(max-width: 768px) 100vw, 720px" />
          </div>
          {section.imageCaption ? (
            <figcaption className="border-t border-[var(--clinical-border)] px-3 py-2 text-xs text-[var(--clinical-foreground-muted)]">
              {section.imageCaption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      {sectionCases.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {sectionCases.map((c) => (
            <figure key={c.id} id={c.id} className="scroll-mt-24 overflow-hidden rounded-xl border border-[var(--clinical-border)]">
              <div className="relative aspect-[4/3] w-full bg-black/5">
                <Image src={c.image} alt={c.title} fill className="object-contain" sizes="(max-width: 768px) 100vw, 400px" />
              </div>
              <figcaption className="px-3 py-2 text-xs">
                <span className="font-bold text-[var(--clinical-foreground)]">{caseLabel} {c.number}. </span>
                <span className="text-[var(--clinical-foreground-muted)]">{c.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function OradsGuideWidget({ initialSectionId, locale = "ru", className }: Props) {
  const doc = getOradsReferat(locale);
  const caseLabel = locale.startsWith("ru") ? "Случай" : "Case";
  const [activeId, setActiveId] = useState(initialSectionId ?? doc.sections[0]?.id ?? "intro");

  useEffect(() => {
    const fromHash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const id = initialSectionId || fromHash;
    if (!id) return;
    setActiveId(id);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [initialSectionId]);

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[240px_1fr]", className)}>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" aria-hidden />
              O-RADS US
            </CardTitle>
            <CardDescription>{doc.meta.version}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {doc.sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setActiveId(s.id)}
                className={cn(
                  "block rounded-lg px-2 py-1.5 text-sm transition-colors",
                  activeId === s.id
                    ? "bg-[var(--clinical-primary)]/10 font-semibold text-[var(--clinical-primary)]"
                    : "text-[var(--clinical-foreground-muted)] hover:bg-black/5",
                )}
              >
                {s.title}
              </a>
            ))}
            <div className="mt-4 space-y-2 border-t border-[var(--clinical-border)] pt-3">
              <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2">
                <Link href="/tools/calc/rads/o-rads">
                  <Calculator className="h-4 w-4" />
                  Калькулятор O-RADS
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="w-full justify-start gap-2">
                <Link href="/tools/refs/orads-echograms">
                  <ExternalLink className="h-4 w-4" />
                  Эхограммы атласа
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>

      <div>
        <header className="mb-8">
          <Badge variant="outline" className="mb-2">
            Учебный реферат
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--clinical-foreground)] md:text-3xl">{doc.meta.title}</h1>
          <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">{doc.meta.subtitle}</p>
          <p className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            {doc.meta.disclaimer}
          </p>
        </header>

        {doc.sections.map((section) => (
          <SectionBlock key={section.id} section={section} cases={doc.cases} caseLabel={caseLabel} />
        ))}

        <section id="risk-table" className="scroll-mt-24 mt-10">
          <h2 className="text-xl font-bold">Таблица категорий риска</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--clinical-border)]">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[var(--clinical-surface-muted)] text-xs uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
                <tr>
                  <th className="px-3 py-2">Категория</th>
                  <th className="px-3 py-2">ROM</th>
                  <th className="px-3 py-2">Описание</th>
                  <th className="px-3 py-2">Тактика</th>
                </tr>
              </thead>
              <tbody>
                {doc.categories.map((row) => (
                  <tr key={row.category} className="border-t border-[var(--clinical-border)]">
                    <td className="px-3 py-2 font-semibold">{row.category}</td>
                    <td className="px-3 py-2">{row.risk}</td>
                    <td className="px-3 py-2 text-[var(--clinical-foreground-muted)]">{row.description}</td>
                    <td className="px-3 py-2 text-[var(--clinical-foreground-muted)]">{row.management}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-10 text-xs text-[var(--clinical-foreground-muted)]">
          <p>{doc.meta.source}</p>
        </footer>
      </div>
    </div>
  );
}
