"use client";

import { NOSOLOGY_ZONE_LABELS, getFavoriteNosologyIds, getRecentNosologyIds, type Nosology, type NosologyZone } from "@repo/nosology";
import { HeartPulse, Search } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNosologyList } from "@/hooks/useNosologies";
import { cn } from "@/lib/utils/cn";

const ZONE_ORDER: NosologyZone[] = ["obstetrics", "uterus", "endometrium", "ovaries", "tubes", "cervix", "other"];

function NosologyCard({ n, studyId }: { n: Nosology; studyId?: string | null }) {
  const href = studyId ? `/nosologies/${n.id}?studyId=${studyId}` : `/nosologies/${n.id}`;
  return (
    <Link href={href} prefetch className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clinical-primary)]">
      <Card className="h-full cursor-pointer border-[var(--clinical-border)] bg-[var(--clinical-card)] transition-shadow hover:shadow-md active:scale-[0.99]">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{n.title}</CardTitle>
            <HeartPulse className="h-4 w-4 shrink-0 text-[var(--clinical-primary)] opacity-60" />
          </div>
          {n.icd10 ? <Badge variant="outline" className="w-fit text-[10px]">{n.icd10}</Badge> : null}
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-3 text-sm">{n.description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}

type Props = { studyId?: string | null };

export function NosologyListClient({ studyId }: Props) {
  const { items, loading, error, query, setQuery, hits } = useNosologyList();

  const displayItems = useMemo(() => {
    if (query.trim() && hits.length > 0) {
      const ids = new Set(hits.map((h) => h.id));
      return items.filter((n) => ids.has(n.id));
    }
    if (query.trim()) return [];
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
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 lg:px-8">
      <header className="space-y-2">
        <Badge variant="outline">Справочник</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Нозологии</h1>
        <p className="max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
          Клинические алгоритмы: обследование, УЗ-диагностика, лечение и маршрутизация. Работает офлайн после первой
          загрузки.
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-[var(--clinical-muted)]" />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {!loading && !error && recent.length > 0 && !query.trim() ? (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
            Недавние
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((n) => (
              <NosologyCard key={n.id} n={n} studyId={studyId} />
            ))}
          </div>
        </section>
      ) : null}

      {!loading && !error && favorites.length > 0 && !query.trim() ? (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
            Избранное
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((n) => (
              <NosologyCard key={n.id} n={n} studyId={studyId} />
            ))}
          </div>
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

      {!loading && !error
        ? ZONE_ORDER.map((zone) => {
            const list = grouped.get(zone) ?? [];
            if (list.length === 0) return null;
            return (
              <section key={zone}>
                <h2
                  className={cn(
                    "mb-3 text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]",
                  )}
                >
                  {NOSOLOGY_ZONE_LABELS[zone]}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((n) => (
                    <NosologyCard key={n.id} n={n} studyId={studyId} />
                  ))}
                </div>
              </section>
            );
          })
        : null}
    </div>
  );
}
