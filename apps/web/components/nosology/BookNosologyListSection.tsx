"use client";

import {
  BOOK_ID_LABELS,
  BOOK_NOSOLOGY_ZONE_LABELS,
  listBookNosologyEntries,
  searchBookNosologyEntries,
  type BookNosologyEntry,
  type BookNosologyZone,
} from "@repo/book-nosology-registry";
import { useMemo } from "react";

import { IosRowList } from "@/components/clinical/IosRowList";
import { cn } from "@/lib/utils/cn";

const ZONE_ORDER: BookNosologyZone[] = [
  "obstetrics",
  "breast",
  "cervix",
  "uterus",
  "endometrium",
  "ovaries",
  "tubes",
  "other",
];

function toRow(entry: BookNosologyEntry) {
  const images = entry.imageCount > 0 ? ` · ${entry.imageCount} сним.` : "";
  return {
    href: `/tools/refs/book-nosology/${encodeURIComponent(entry.id)}`,
    title: entry.titleRu,
    detail: entry.summaryRu,
    badge: `${BOOK_ID_LABELS[entry.bookId] ?? entry.bookId}${images}`,
  };
}

type Props = {
  query: string;
  bookFilter?: string;
  clinicalOnly?: boolean;
};

export function BookNosologyListSection({ query, bookFilter = "all", clinicalOnly = true }: Props) {
  const entries = useMemo(() => {
    const q = query.trim();
    let list = q
      ? searchBookNosologyEntries(q, 60)
      : listBookNosologyEntries({ clinicalOnly, bookId: bookFilter === "all" ? undefined : bookFilter });
    if (q && bookFilter !== "all") {
      list = list.filter((e) => e.bookId === bookFilter);
    }
    return list;
  }, [query, bookFilter, clinicalOnly]);

  const grouped = useMemo(() => {
    const map = new Map<BookNosologyZone, BookNosologyEntry[]>();
    for (const z of ZONE_ORDER) map.set(z, []);
    for (const e of entries) {
      map.get(e.zone)?.push(e);
    }
    return map;
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="book-atlas-heading" className="space-y-6 scroll-mt-8">
      <div className="space-y-1">
        <h2
          id="book-atlas-heading"
          className="text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]"
        >
          Учебные атласы · по нозологиям
        </h2>
        <p className="max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
          Цервикс (гистология), маммология, пренатал и Otto — структура по главам книг, связь с клиническими
          нозологиями выше.
        </p>
      </div>

      {!query.trim()
        ? ZONE_ORDER.map((zone) => {
            const list = grouped.get(zone) ?? [];
            if (list.length === 0) return null;
            return (
              <div key={zone}>
                <h3
                  className={cn(
                    "mb-3 text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]",
                  )}
                >
                  {BOOK_NOSOLOGY_ZONE_LABELS[zone]}
                </h3>
                <IosRowList rows={list.map(toRow)} />
              </div>
            );
          })
        : (
            <IosRowList rows={entries.map(toRow)} />
          )}
    </section>
  );
}
