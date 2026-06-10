"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

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
} from "@/lib/education/library-catalog";

export function EducationLibraryCatalog() {
  const [query, setQuery] = useState("");
  const [shelf, setShelf] = useState<EducationShelf | "all">("all");

  const filtered = useMemo(() => searchEducationLibrary(query, shelf), [query, shelf]);
  const grouped = useMemo(() => groupEducationByShelf(filtered), [filtered]);
  const counts = useMemo(() => countEducationByShelf(), []);

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
        <ShelfChip active={shelf === "all"} onClick={() => setShelf("all")} label="Все" count={filtered.length} />
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
            <ShelfSection key={s} shelf={s} items={items} />
          );
        })
      ) : (
        <ShelfSection shelf={shelf} items={filtered} />
      )}

      {!filtered.length ? (
        <p className="rounded-2xl border border-dashed border-[var(--clinical-border)] px-4 py-8 text-center text-sm text-[var(--clinical-foreground-muted)]">
          Ничего не найдено — попробуйте другой запрос или снимите фильтр полки.
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
  shelf,
  items,
}: {
  shelf: EducationShelf;
  items: ReturnType<typeof searchEducationLibrary>;
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
          <Card key={item.id} className="flex flex-col border-[var(--clinical-border)] bg-[var(--clinical-card)]">
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {item.badge ? <Badge className="bg-rose-600 hover:bg-rose-600">{item.badge}</Badge> : null}
                {item.primary ? <Badge variant="outline">Рекомендуем</Badge> : null}
              </div>
              <CardTitle className="text-base">{item.title}</CardTitle>
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
                <Link href={item.href}>Открыть</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
