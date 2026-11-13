import Link from "next/link";
import type { ReactNode } from "react";

import { CalculatorOpenTracker } from "@/components/analytics/CalculatorOpenTracker";
import { CalculatorFaqJsonLd } from "@/components/seo/CalculatorFaqJsonLd";
import { ContentErrorReportLink } from "@/components/feedback/ContentErrorReportLink";
import {
  CLINICAL_CONTENT_DISCLAIMER,
  formatClinicalReviewLabel,
} from "@/lib/seo/clinical-reviewer";
import type { CalculatorLandingContent } from "@/lib/seo/calculator-landing-content";

type Props = {
  content: CalculatorLandingContent;
  children: ReactNode;
};

export function CalculatorLandingShell({ content, children }: Props) {
  const calcId = content.path.replace(/^\/tools\/calc\//, "").replace(/\//g, "_") || content.path;

  return (
    <div className="space-y-8">
      <CalculatorOpenTracker id={calcId} />
      <CalculatorFaqJsonLd faq={content.faq} />

      <header className="mx-auto max-w-4xl space-y-3 px-4 pt-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--clinical-foreground)] sm:text-3xl">
          {content.h1}
        </h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)] sm:text-base">
          {content.lead}
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Обновлено: {content.updatedAt} ·{" "}
          {formatClinicalReviewLabel(content.reviewStatus, content.reviewedBy)}
        </p>
      </header>

      <div>{children}</div>

      <article className="mx-auto max-w-4xl space-y-8 px-4 pb-12 text-[var(--clinical-foreground)]">
        <section className="space-y-3" aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-lg font-semibold">
            Как считается
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            {content.howItWorks.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="space-y-3" aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="text-lg font-semibold">
            Источники
          </h2>
          <ul className="space-y-2 text-sm text-[var(--clinical-foreground-muted)]">
            {content.sources.map((source) => (
              <li key={source.label}>
                {source.href ? (
                  <a
                    href={source.href}
                    className="font-medium text-[var(--clinical-primary-deep)] underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.label}
                    {source.year ? ` (${source.year})` : ""}
                  </a>
                ) : (
                  <span>
                    {source.label}
                    {source.year ? ` (${source.year})` : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3" aria-labelledby="limits-heading">
          <h2 id="limits-heading" className="text-lg font-semibold">
            Ограничения
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            {content.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3" aria-labelledby="example-heading">
          <h2 id="example-heading" className="text-lg font-semibold">
            {content.example.title}
          </h2>
          <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            {content.example.body}
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-lg font-semibold">
            Частые вопросы
          </h2>
          <dl className="space-y-4">
            {content.faq.map((item) => (
              <div key={item.question} className="space-y-1">
                <dt className="text-sm font-semibold">{item.question}</dt>
                <dd className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="space-y-3" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-lg font-semibold">
            Связанные инструменты
          </h2>
          <ul className="flex flex-wrap gap-2">
            {content.related.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex rounded-full border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-1.5 text-xs font-semibold text-[var(--clinical-foreground)] hover:bg-[var(--clinical-muted)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <ContentErrorReportLink pagePath={content.path} />

        <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          {CLINICAL_CONTENT_DISCLAIMER}
        </p>
      </article>
    </div>
  );
}
