"use client";

import {
  formatArticleForAssistant,
  type CanonicalKnowledgeArticle,
} from "@repo/medical-knowledge";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const BLOCK_ORDER: Array<{
  types: string[];
  label: string;
  accent: string;
}> = [
  {
    types: ["symptoms", "red_flags"],
    label: "Симптомы / на что смотреть",
    accent: "border-rose-300/80 dark:border-rose-800",
  },
  {
    types: ["diagnostics"],
    label: "Анализы и обследования",
    accent: "border-sky-300/80 dark:border-sky-800",
  },
  {
    types: ["action_steps"],
    label: "Что делать (1-2-3)",
    accent: "border-emerald-300/80 dark:border-emerald-800",
  },
  {
    types: ["medications"],
    label: "Препараты (справочно · дозы по КР)",
    accent: "border-violet-300/80 dark:border-violet-800",
  },
  {
    types: ["do_not"],
    label: "Чего не делать",
    accent: "border-amber-300/80 dark:border-amber-800",
  },
  {
    types: ["escalation"],
    label: "Эскалация / госпитализация",
    accent: "border-orange-300/80 dark:border-orange-800",
  },
  {
    types: ["education"],
    label: "Источник и КР",
    accent: "border-[var(--clinical-border)]",
  },
];

function sectionFor(article: CanonicalKnowledgeArticle, types: string[]) {
  for (const t of types) {
    const s = article.sections.find((x) => x.sectionType === t && x.content.trim());
    if (s) return s;
  }
  return null;
}

function renderBody(content: string) {
  const lines = content
    .split(/(?=\d+[).]\s)/)
    .map((l) => l.trim())
    .filter(Boolean);
  const looksNumbered = lines.length > 1 && /^\d+[).]/.test(lines[0] ?? "");
  if (looksNumbered) {
    return (
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
        {lines.map((line) => (
          <li key={line.slice(0, 48)}>{line.replace(/^\d+[).]\s*/, "")}</li>
        ))}
      </ol>
    );
  }
  return <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
}

type Props = {
  article: CanonicalKnowledgeArticle;
};

export function EmergencyClinicalGuide({ article }: Props) {
  const src = article.sources[0];
  const pages =
    src?.pageStart != null
      ? src.pageEnd != null && src.pageEnd !== src.pageStart
        ? `стр. ${src.pageStart}–${src.pageEnd}`
        : `стр. ${src.pageStart}`
      : null;

  const draft = formatArticleForAssistant(article);

  return (
    <article className="space-y-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">
          Клинический гайд · неотложка
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--clinical-foreground)] sm:text-3xl">
          {article.title}
        </h2>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">{article.summary}</p>
        {src ? (
          <p className="text-[11px] text-[var(--clinical-foreground-muted)]">
            {src.shortTitle ?? src.title}
            {pages ? ` · ${pages}` : ""}
            {src.year ? ` · ${src.year}` : ""}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void navigator.clipboard.writeText(draft)}
          >
            Копировать гайд
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/tools/refs/guidelines">Полка КР</Link>
          </Button>
        </div>
      </header>

      {BLOCK_ORDER.map((block) => {
        const section = sectionFor(article, block.types);
        if (!section) return null;
        return (
          <section
            key={block.label}
            className={`rounded-2xl border bg-[var(--clinical-card)] p-4 sm:p-5 ${block.accent}`}
          >
            <h3 className="text-base font-semibold text-[var(--clinical-foreground)]">{block.label}</h3>
            {renderBody(section.content)}
          </section>
        );
      })}

      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Справочно. Не диагноз. Дозы и показания сверяйте с актуальными КР МЗ РФ и локальным
        протоколом СМП — решение за врачом. Не вводите ПДн пациентов.
      </p>
    </article>
  );
}
