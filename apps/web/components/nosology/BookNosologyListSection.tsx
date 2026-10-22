"use client";

import {
  BOOK_ID_LABELS,
  BOOK_NOSOLOGY_ZONE_LABELS,
  listBookNosologyEntries,
  searchBookNosologyEntries,
  type BookNosologyEntry,
  type BookNosologyZone,
} from "@repo/book-nosology-registry";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function BookCard({ entry }: { entry: BookNosologyEntry }) {
  const href = `/tools/refs/book-nosology/${encodeURIComponent(entry.id)}`;
  return (
    <Link href={href} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clinical-primary)]">
      <Card className="h-full border-[var(--clinical-border)] bg-[var(--clinical-card)] transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{entry.titleRu}</CardTitle>
            <BookOpen className="h-4 w-4 shrink-0 text-[var(--clinical-primary)] opacity-70" />
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px]">
              {BOOK_ID_LABELS[entry.bookId] ?? entry.bookId}
            </Badge>
            {entry.imageCount > 0 ? (
              <Badge variant="secondary" className="text-[10px]">
                {entry.imageCount} сним.
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-3 text-sm">{entry.summaryRu}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
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
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((e) => (
                    <BookCard key={e.id} entry={e} />
                  ))}
                </div>
              </div>
            );
          })
        : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((e) => (
                <BookCard key={e.id} entry={e} />
              ))}
            </div>
          )}
    </section>
  );
}
