"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Stethoscope } from "lucide-react";

import { AppointmentCalcCard } from "@/components/calculators/appointment/AppointmentCalcCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  sortCalculators,
  useAppointmentCalcPrefs,
  type SortMode,
} from "@/lib/calculators/appointment/useAppointmentCalcPrefs";
import { cn } from "@/lib/utils/cn";
import {
  APPOINTMENT_CALCULATORS,
  APPOINTMENT_CATEGORY_LABELS,
  APPOINTMENT_CATEGORY_ORDER,
  getAppointmentCalculatorById,
  getFrequentAtAppointment,
  type AppointmentCalcCategory,
  type AppointmentCalculator,
} from "@repo/clinical-tools";

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: "popular", label: "По популярности" },
  { id: "alphabet", label: "По алфавиту" },
  { id: "recent", label: "По последнему использованию" },
];

function matchesSearch(calc: AppointmentCalculator, q: string): boolean {
  if (!q.trim()) return true;
  const needle = q.trim().toLowerCase();
  const hay = [calc.title, calc.description, ...(calc.searchTerms ?? [])].join(" ").toLowerCase();
  return hay.includes(needle);
}

function SectionBlock({
  title,
  subtitle,
  items,
  favorites,
  onToggleFavorite,
  onOpen,
  emptyHint,
}: {
  title: string;
  subtitle?: string;
  items: AppointmentCalculator[];
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onOpen: (id: string) => void;
  emptyHint?: string;
}) {
  if (items.length === 0) {
    if (!emptyHint) return null;
    return (
      <section className="space-y-3">
        <header>
          <h2 className="text-lg font-bold text-[var(--clinical-foreground)]">{title}</h2>
          {subtitle ? <p className="text-xs text-[var(--clinical-foreground-muted)]">{subtitle}</p> : null}
        </header>
        <p className="rounded-xl border border-dashed border-[var(--clinical-border)] p-4 text-sm text-[var(--clinical-foreground-muted)]">
          {emptyHint}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-bold text-[var(--clinical-foreground)]">{title}</h2>
        {subtitle ? <p className="text-xs text-[var(--clinical-foreground-muted)]">{subtitle}</p> : null}
      </header>
      <div className="flex flex-col gap-3">
        {items.map((calc) => (
          <AppointmentCalcCard
            key={calc.id}
            calc={calc}
            isFavorite={favorites.has(calc.id)}
            onToggleFavorite={onToggleFavorite}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}

export function AppointmentQuickAccessHub() {
  const { prefs, toggleFavorite, recordUse, isFavorite } = useAppointmentCalcPrefs();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AppointmentCalcCategory | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [showFilters, setShowFilters] = useState(false);

  const onOpen = (id: string) => recordUse(id);

  const filteredBase = useMemo(() => {
    let list = APPOINTMENT_CALCULATORS.filter((c) => matchesSearch(c, query));
    if (categoryFilter !== "all") list = list.filter((c) => c.category === categoryFilter);
    return sortCalculators(list, sortMode, prefs);
  }, [query, categoryFilter, sortMode, prefs]);

  const favoriteItems = useMemo(() => {
    return prefs.favorites
      .map((id) => getAppointmentCalculatorById(id))
      .filter((c): c is AppointmentCalculator => Boolean(c))
      .filter((c) => matchesSearch(c, query));
  }, [prefs.favorites, query]);

  const recentItems = useMemo(() => {
    return prefs.recent
      .filter((id) => !prefs.favorites.includes(id))
      .map((id) => getAppointmentCalculatorById(id))
      .filter((c): c is AppointmentCalculator => Boolean(c))
      .filter((c) => matchesSearch(c, query))
      .slice(0, 6);
  }, [prefs.recent, prefs.favorites, query]);

  const frequentItems = useMemo(() => {
    const base = getFrequentAtAppointment().filter((c) => matchesSearch(c, query));
    if (categoryFilter !== "all") return base.filter((c) => c.category === categoryFilter);
    return base;
  }, [query, categoryFilter]);

  const favoritesSet = useMemo(() => new Set(prefs.favorites), [prefs.favorites]);
  const isSearching = query.trim().length > 0 || categoryFilter !== "all";

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-start gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calculators">← Калькуляторы</Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--clinical-primary)] text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Для приёма врача</h1>
              <p className="text-sm text-[var(--clinical-foreground-muted)]">Быстрый доступ к калькуляторам · один тап</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--clinical-foreground-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: ПДР, КТР, Bishop, VBAC…"
            className="rounded-xl pl-10"
            aria-label="Поиск калькуляторов"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            Фильтр и сортировка
          </Button>
          {categoryFilter !== "all" ? (
            <Badge variant="secondary" className="rounded-full">
              {APPOINTMENT_CATEGORY_LABELS[categoryFilter]}
            </Badge>
          ) : null}
        </div>
        {showFilters ? (
          <div className="sonogyn-glass-card space-y-4 rounded-2xl border border-[var(--clinical-border)] p-4">
            <div>
              <p className="mb-2 text-xs font-bold text-[var(--clinical-foreground-muted)]">Категория</p>
              <div className="flex flex-wrap gap-2">
                <FilterChip active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")} label="Все" />
                {APPOINTMENT_CATEGORY_ORDER.map((c) => (
                  <FilterChip
                    key={c.id}
                    active={categoryFilter === c.id}
                    onClick={() => setCategoryFilter(c.id)}
                    label={c.label}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-[var(--clinical-foreground-muted)]">Сортировка</p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt.id}
                    active={sortMode === opt.id}
                    onClick={() => setSortMode(opt.id)}
                    label={opt.label}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {isSearching ? (
        <SectionBlock
          title="Результаты"
          subtitle={`${filteredBase.length} калькулятор(ов)`}
          items={filteredBase}
          favorites={favoritesSet}
          onToggleFavorite={toggleFavorite}
          onOpen={onOpen}
          emptyHint="Ничего не найдено. Попробуйте «ПДР», «КТР», «масса»."
        />
      ) : (
        <>
          <SectionBlock
            title="Часто на приёме"
            subtitle="Топ инструментов на смене — срок, ПДР, масса, Bishop, VBAC"
            items={frequentItems}
            favorites={favoritesSet}
            onToggleFavorite={toggleFavorite}
            onOpen={onOpen}
          />

          <SectionBlock
            title="Избранные"
            items={favoriteItems}
            favorites={favoritesSet}
            onToggleFavorite={toggleFavorite}
            onOpen={onOpen}
            emptyHint="Нажмите 📌 на карточке, чтобы закрепить калькулятор."
          />

          <SectionBlock
            title="Последние использованные"
            items={recentItems}
            favorites={favoritesSet}
            onToggleFavorite={toggleFavorite}
            onOpen={onOpen}
            emptyHint="Открытые калькуляторы появятся здесь автоматически."
          />

          {APPOINTMENT_CATEGORY_ORDER.map((cat) => {
            const items = filteredBase.filter((c) => c.category === cat.id);
            if (items.length === 0) return null;
            return (
              <SectionBlock
                key={cat.id}
                title={cat.label}
                items={items}
                favorites={favoritesSet}
                onToggleFavorite={toggleFavorite}
                onOpen={onOpen}
              />
            );
          })}
        </>
      )}

      <p className="text-center text-[10px] leading-relaxed text-[var(--clinical-foreground-muted)]">
        Справочная информация · не заменяет клиническое суждение · интерпретация — лечащий специалист
      </p>
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
          : "border-[var(--clinical-border)] text-[var(--clinical-foreground-muted)] hover:border-[var(--clinical-primary)]",
      )}
    >
      {label}
    </button>
  );
}
