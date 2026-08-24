"use client";

import type { CanonicalKnowledgeArticle } from "@repo/medical-knowledge";
import Link from "next/link";

import { SourceCard } from "@/components/medical-knowledge/SourceCard";
import { Button } from "@/components/ui/button";

const SECTION_LABELS: Record<string, string> = {
  definition: "Определение",
  ultrasound_findings: "УЗ-признаки",
  doppler: "Допплер",
  measurements: "Измерения",
  differential: "Дифференциальная диагностика",
  classification: "Классификация",
  clinical_context: "Клинический контекст",
  common_errors: "Типичные ошибки",
  report_description: "Описание для протокола",
  report_conclusion: "Заключение",
  education: "Обучение",
  management_reference: "Тактика",
  warning: "Предупреждение",
};

type Props = {
  article: CanonicalKnowledgeArticle;
  relatedLinks?: Array<{ href: string; label: string }>;
};

export function ClinicalGuide({ article, relatedLinks = [] }: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--clinical-primary-deep)]">
          Clinical Guide · {article.specialty}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">{article.summary}</p>
        <p className="text-[11px] text-[var(--clinical-foreground-muted)]">
          Черновик для врача · версия {article.version}
        </p>
      </header>

      {article.sections
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section) => (
          <section
            key={section.id}
            className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5"
          >
            <h2 className="text-lg font-semibold">
              {SECTION_LABELS[section.sectionType] ?? section.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--clinical-foreground)]">
              {section.content}
            </p>
          </section>
        ))}

      {relatedLinks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {relatedLinks.map((link) => (
            <Button key={link.href} asChild variant="secondary" size="sm" className="rounded-xl">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      ) : null}

      {article.sources.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Источники</h2>
          {article.sources.map((source) => (
            <SourceCard key={source.id} source={source} usedFor={article.title} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
