"use client";

import { NOSOLOGY_ZONE_LABELS, getFavoriteNosologyIds, getRecentNosologyIds, type Nosology, type NosologyZone } from "@repo/nosology";
import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { IosRowList, type IosRow } from "@/components/clinical/IosRowList";
import { BookNosologyListSection } from "@/components/nosology/BookNosologyListSection";

import { Input } from "@/components/ui/input";
import { useNosologyList } from "@/hooks/useNosologies";
import { cn } from "@/lib/utils/cn";

const ZONE_ORDER: NosologyZone[] = [
  "obstetrics",
  "breast",
  "uterus",
  "endometrium",
  "ovaries",
  "tubes",
  "cervix",
  "other",
];

function toRow(n: Nosology, studyId?: string | null): IosRow {
  const href = studyId ? `/nosologies/${n.id}?studyId=${studyId}` : `/nosologies/${n.id}`;
  return {
    href,
    title: n.title,
    detail: n.description,
    badge: n.icd10 ?? undefined,
  };
}

type Props = { studyId?: string | null };

const BOOK_FILTERS = [
  { id: "all", label: "Все книги" },
  { id: "cervix-morpho", label: "Шейка · гистология" },
  { id: "kaprin-mammology", label: "Маммология" },
  { id: "prenatal-echo", label: "Пренатал" },
  { id: "otto-echo", label: "Эхо Otto" },
  { id: "prenatal-finding", label: "Пороки (снимки)" },
] as const;

export function NosologyListClient({ studyId }: Props) {
  const { items, loading, error, query, setQuery, hits } = useNosologyList();
  const [bookFilter, setBookFilter] = useState<string>("all");

  const displayItems = useMemo(() => {
    if (query.trim()) {
      const source = items.length > 0 ? items : [];
      if (hits.length > 0) {
        const ids = new Set(hits.map((h) => h.id));
        return source.filter((n) => ids.has(n.id));
      }
      return [];
    }
    return items;
  }, [items, query, hits]);

  const grouped = useMemo(() => {
    const map = new Map<NosologyZone, Nosology[]>();
    for (const z of ZONE_ORDER) map.set(z, []);
    for (const n of displayItems) {
      map.get(n.zone)?.push(n);
    }
    return map;
  }, [displayItems]);

  const recentIds = getRecentNosologyIds();
  const recent = items.filter((n) => recentIds.includes(n.id));
  const favorites = items.filter((n) => getFavoriteNosologyIds().includes(n.id));

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6 pb-28 sm:max-w-xl">
      <header className="space-y-2">
        <Link href="/home" className="text-sm font-medium text-[var(--clinical-foreground-muted)]">
          ← Разделы
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Нозологии</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Алгоритмы по зонам: матка, эндометрий, яичники, шейка, акушерство, молочная железа.
        </p>
        {studyId ? (
          <p className="text-sm">
            <Link href={`/workspace/${studyId}`} className="font-medium text-[var(--clinical-primary)] underline">
              ← Вернуться к протоколу пациентки
            </Link>
          </p>
        ) : null}
      </header>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--clinical-foreground-muted)]" />
        <Input
          className="pl-10"
          placeholder="Поиск: миома, аденомиоз, полип…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Поиск нозологий"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-[var(--clinical-muted)]" />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {!loading && !error && recent.length > 0 && !query.trim() ? (
        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-[var(--clinical-foreground-muted)]">Недавние</h2>
          <IosRowList rows={recent.map((n) => toRow(n, studyId))} />
        </section>
      ) : null}

      {!loading && !error && favorites.length > 0 && !query.trim() ? (
        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-[var(--clinical-foreground-muted)]">Избранное</h2>
          <IosRowList rows={favorites.map((n) => toRow(n, studyId))} />
        </section>
      ) : null}

      {!loading && !error && displayItems.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--clinical-foreground-muted)]">
          Ничего не найдено. Попробуйте другое название или{" "}
          <button type="button" className="underline" onClick={() => setQuery("")}>
            сбросить поиск
          </button>
          .
        </p>
      ) : null}

      {!loading && !error && query.trim() && displayItems.length > 0 ? (
        <IosRowList rows={displayItems.map((n) => toRow(n, studyId))} />
      ) : null}

      {!loading && !error && !query.trim()
        ? ZONE_ORDER.map((zone) => {
            const list = grouped.get(zone) ?? [];
            if (list.length === 0) return null;
            return (
              <section key={zone} className="space-y-2">
                <h2 className="px-1 text-sm font-semibold text-[var(--clinical-foreground-muted)]">
                  {NOSOLOGY_ZONE_LABELS[zone]}
                </h2>
                <IosRowList rows={list.map((n) => toRow(n, studyId))} />
              </section>
            );
          })
        : null}

      {!loading && !error ? (
        <>
          <div className="flex flex-wrap gap-2">
            {BOOK_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  bookFilter === f.id
                    ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                    : "border-[var(--clinical-border)] hover:bg-[var(--clinical-muted)]",
                )}
                onClick={() => setBookFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <BookNosologyListSection query={query} bookFilter={bookFilter} clinicalOnly={!query.trim()} />
        </>
      ) : null}
    </div>
  );
}
