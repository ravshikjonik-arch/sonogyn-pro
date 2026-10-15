"use client";

import { ArrowRight, Clock3, Search, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import {
  countEducationByShelf,
  EDUCATION_SHELF_DESCRIPTIONS,
  EDUCATION_SHELF_LABELS,
  EDUCATION_SHELF_ORDER,
  groupEducationByShelf,
  searchEducationLibrary,
  type EducationShelf,
  type EducationLibraryItem,
} from "@/lib/education/library-catalog";

type LibraryView = EducationShelf | "all" | "favorites" | "recent";

const FAVORITES_STORAGE_KEY = "sonogyn:education-library:favorites";
const RECENTS_STORAGE_KEY = "sonogyn:education-library:recent";
const MAX_RECENT_ITEMS = 8;

export function EducationLibraryCatalog() {
  const [query, setQuery] = useState("");
  const [shelf, setShelf] = useState<LibraryView>("all");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    setFavoriteIds(readStoredIds(FAVORITES_STORAGE_KEY));
    setRecentIds(readStoredIds(RECENTS_STORAGE_KEY));
  }, []);

  const baseShelf = shelf === "favorites" || shelf === "recent" ? "all" : shelf;
  const baseFiltered = useMemo(() => searchEducationLibrary(query, baseShelf), [query, baseShelf]);
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const recentSet = useMemo(() => new Set(recentIds), [recentIds]);
  const filtered = useMemo(() => {
    if (shelf === "favorites") {
      return baseFiltered.filter((item) => favoriteSet.has(item.id));
    }
    if (shelf === "recent") {
      return [...baseFiltered]
        .filter((item) => recentSet.has(item.id))
        .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
    }
    return baseFiltered;
  }, [baseFiltered, favoriteSet, recentIds, recentSet, shelf]);
  const grouped = useMemo(() => groupEducationByShelf(filtered), [filtered]);
  const counts = useMemo(() => countEducationByShelf(), []);

  function toggleFavorite(itemId: string) {
    setFavoriteIds((current) => {
      const next = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [itemId, ...current];
      writeStoredIds(FAVORITES_STORAGE_KEY, next);
      return next;
    });
  }

  function markRecent(itemId: string) {
    setRecentIds((current) => {
      const next = [itemId, ...current.filter((id) => id !== itemId)].slice(0, MAX_RECENT_ITEMS);
      writeStoredIds(RECENTS_STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--clinical-foreground-muted)]" />
        <Input
          className="pl-9"
          placeholder="Поиск: ISUOG, O-RADS, FMF, нозологии…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <ShelfChip active={shelf === "all"} onClick={() => setShelf("all")} label="Все" count={baseFiltered.length} />
        <ShelfChip
          active={shelf === "favorites"}
          onClick={() => setShelf(shelf === "favorites" ? "all" : "favorites")}
          label="Избранное"
          count={favoriteIds.length}
        />
        <ShelfChip
          active={shelf === "recent"}
          onClick={() => setShelf(shelf === "recent" ? "all" : "recent")}
          label="Недавно"
          count={recentIds.length}
        />
        {EDUCATION_SHELF_ORDER.map((s) => (
          <ShelfChip
            key={s}
            active={shelf === s}
            onClick={() => setShelf(shelf === s ? "all" : s)}
            label={EDUCATION_SHELF_LABELS[s]}
            count={counts[s]}
          />
        ))}
      </div>

      {shelf === "all" ? (
        EDUCATION_SHELF_ORDER.map((s) => {
          const items = grouped.get(s) ?? [];
          if (!items.length) return null;
          return (
            <ShelfSection
              key={s}
              favoriteIds={favoriteSet}
              items={items}
              markRecent={markRecent}
              shelf={s}
              toggleFavorite={toggleFavorite}
            />
          );
        })
      ) : shelf === "favorites" || shelf === "recent" ? (
        <PersonalSection
          favoriteIds={favoriteSet}
          items={filtered}
          markRecent={markRecent}
          mode={shelf}
          toggleFavorite={toggleFavorite}
        />
      ) : (
        <ShelfSection
          favoriteIds={favoriteSet}
          items={filtered}
          markRecent={markRecent}
          shelf={shelf}
          toggleFavorite={toggleFavorite}
        />
      )}

      {!filtered.length ? (
        <p className="rounded-2xl border border-dashed border-[var(--clinical-border)] px-4 py-8 text-center text-sm text-[var(--clinical-foreground-muted)]">
          {shelf === "favorites"
            ? "В избранном пока пусто. Отметьте важные материалы звездочкой."
            : shelf === "recent"
              ? "Недавно открытых материалов пока нет."
              : "Ничего не найдено — попробуйте другой запрос или снимите фильтр полки."}
        </p>
      ) : null}
    </div>
  );
}

function ShelfChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
          : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:bg-[var(--clinical-muted)]",
      )}
    >
      {label} · {count}
    </button>
  );
}

function ShelfSection({
  favoriteIds,
  shelf,
  items,
  markRecent,
  toggleFavorite,
}: {
  favoriteIds: Set<string>;
  shelf: EducationShelf;
  items: EducationLibraryItem[];
  markRecent: (itemId: string) => void;
  toggleFavorite: (itemId: string) => void;
}) {
  if (!items.length) return null;
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--clinical-foreground)]">{EDUCATION_SHELF_LABELS[shelf]}</h2>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">{EDUCATION_SHELF_DESCRIPTIONS[shelf]}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <LibraryItemCard
            key={item.id}
            favorite={favoriteIds.has(item.id)}
            item={item}
            markRecent={markRecent}
            toggleFavorite={toggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}

function PersonalSection({
  favoriteIds,
  items,
  markRecent,
  mode,
  toggleFavorite,
}: {
  favoriteIds: Set<string>;
  items: EducationLibraryItem[];
  markRecent: (itemId: string) => void;
  mode: "favorites" | "recent";
  toggleFavorite: (itemId: string) => void;
}) {
  if (!items.length) return null;
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--clinical-foreground)]">
          {mode === "favorites" ? <Star className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
          {mode === "favorites" ? "Избранное" : "Недавно открытые"}
        </h2>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          {mode === "favorites"
            ? "Личная полка врача: КР, калькуляторы, алгоритмы и гайды, которые нужны чаще всего."
            : "Последние открытые материалы на этом устройстве."}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <LibraryItemCard
            key={item.id}
            favorite={favoriteIds.has(item.id)}
            item={item}
            markRecent={markRecent}
            toggleFavorite={toggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}

function LibraryItemCard({
  favorite,
  item,
  markRecent,
  toggleFavorite,
}: {
  favorite: boolean;
  item: EducationLibraryItem;
  markRecent: (itemId: string) => void;
  toggleFavorite: (itemId: string) => void;
}) {
  return (
    <Card className="flex flex-col border-[var(--clinical-border)] bg-[var(--clinical-card)]">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {item.badge ? <Badge className="bg-rose-600 hover:bg-rose-600">{item.badge}</Badge> : null}
            {item.primary ? <Badge variant="outline">Рекомендуем</Badge> : null}
          </div>
          <button
            type="button"
            aria-label={favorite ? "Убрать из избранного" : "Добавить в избранное"}
            aria-pressed={favorite}
            onClick={() => toggleFavorite(item.id)}
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
              favorite
                ? "border-amber-300 bg-amber-100 text-amber-800"
                : "border-[var(--clinical-border)] text-[var(--clinical-foreground-muted)] hover:bg-[var(--clinical-muted)]",
            )}
          >
            <Star className={cn("h-4 w-4", favorite ? "fill-current" : "")} />
          </button>
        </div>
        <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
        <CardDescription className="leading-relaxed">{item.description}</CardDescription>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--clinical-muted)] px-2 py-0.5 text-[10px] text-[var(--clinical-foreground-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="mt-auto">
        <Button variant={item.primary ? "default" : "secondary"} className="w-full" asChild>
          <Link href={item.href} onClick={() => markRecent(item.id)}>
            Открыть
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function readStoredIds(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function writeStoredIds(key: string, ids: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Local storage can be blocked; the catalog still works without personalization.
  }
}
