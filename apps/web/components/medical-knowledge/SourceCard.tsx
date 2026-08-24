"use client";

import type { SourceCitationPublic } from "@repo/medical-knowledge";
import Link from "next/link";

type Props = {
  source: SourceCitationPublic;
  usedFor?: string;
};

export function SourceCard({ source, usedFor }: Props) {
  return (
    <article className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 text-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
        Источник
      </p>
      <h3 className="mt-1 text-base font-semibold text-[var(--clinical-foreground)]">{source.title}</h3>
      {source.authors ? (
        <p className="mt-1 text-[var(--clinical-foreground-muted)]">{source.authors}</p>
      ) : null}
      <dl className="mt-3 grid gap-1 text-xs text-[var(--clinical-foreground-muted)]">
        {source.organization ? (
          <div>
            <dt className="inline font-medium">Организация: </dt>
            <dd className="inline">{source.organization}</dd>
          </div>
        ) : null}
        {source.year ? (
          <div>
            <dt className="inline font-medium">Год: </dt>
            <dd className="inline">{source.year}</dd>
          </div>
        ) : null}
        {source.edition ? (
          <div>
            <dt className="inline font-medium">Издание: </dt>
            <dd className="inline">{source.edition}</dd>
          </div>
        ) : null}
        {source.chapter ? (
          <div>
            <dt className="inline font-medium">Глава: </dt>
            <dd className="inline">{source.chapter}</dd>
          </div>
        ) : null}
        {(source.pageStart ?? source.pageEnd) ? (
          <div>
            <dt className="inline font-medium">Страницы: </dt>
            <dd className="inline">
              {source.pageStart ?? "?"}–{source.pageEnd ?? "?"}
            </dd>
          </div>
        ) : null}
        {source.doi ? (
          <div>
            <dt className="inline font-medium">DOI: </dt>
            <dd className="inline font-mono">{source.doi}</dd>
          </div>
        ) : null}
        {source.isbn ? (
          <div>
            <dt className="inline font-medium">ISBN: </dt>
            <dd className="inline font-mono">{source.isbn}</dd>
          </div>
        ) : null}
      </dl>
      {usedFor ? (
        <p className="mt-3 text-xs text-emerald-800 dark:text-emerald-200">
          Источник использован при подготовке ответа: {usedFor}
        </p>
      ) : null}
      <p className="mt-2 text-[11px] text-[var(--clinical-foreground-muted)]">
        Статус проверки: {source.reviewStatus}
        {source.verified ? " · verified" : ""}
      </p>
      {source.externalUrl ? (
        <Link
          href={source.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-xs font-medium text-sky-700 underline underline-offset-2 dark:text-sky-300"
        >
          Внешняя библиографическая ссылка
        </Link>
      ) : null}
      <p className="mt-3 text-[10px] text-[var(--clinical-foreground-muted)]">
        Оригинальный PDF недоступен — только атрибуция и структурированное знание SonoGyn Pro.
      </p>
    </article>
  );
}
