import Link from "next/link";
import type { ReactNode } from "react";

import { ContentErrorReportLink } from "@/components/feedback/ContentErrorReportLink";
import { formatLegalCopyrightLine, readLegalPublicProfile } from "@/lib/config/legal";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function LegalDocShell({ title, subtitle, children }: Props) {
  const legal = readLegalPublicProfile();

  return (
    <main className="min-h-screen bg-[var(--clinical-canvas)] text-[var(--clinical-foreground)]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clinical-primary-deep)]">
          SonoGyn Pro
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle ? (
          <p className="mt-3 text-sm text-[var(--clinical-foreground-muted)]">{subtitle}</p>
        ) : null}
        <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">
          Редакция документов: {legal.docsVersion} · {formatLegalCopyrightLine(legal)}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[var(--clinical-foreground)]">
          {children}
        </div>

        <div className="mt-10">
          <ContentErrorReportLink />
        </div>

        <nav
          className="mt-12 flex flex-wrap gap-3 text-sm"
          aria-label="Юридические документы"
        >
          <Link
            href="/"
            className="rounded-xl border border-[var(--clinical-border)] px-4 py-2 hover:bg-[var(--clinical-muted)]"
          >
            На главную
          </Link>
          <Link
            href="/privacy"
            className="rounded-xl border border-[var(--clinical-border)] px-4 py-2 hover:bg-[var(--clinical-muted)]"
          >
            Политика
          </Link>
          <Link
            href="/offer"
            className="rounded-xl border border-[var(--clinical-border)] px-4 py-2 hover:bg-[var(--clinical-muted)]"
          >
            Оферта
          </Link>
          <Link
            href="/contacts"
            className="rounded-xl border border-[var(--clinical-border)] px-4 py-2 hover:bg-[var(--clinical-muted)]"
          >
            Контакты
          </Link>
        </nav>
      </div>
    </main>
  );
}
