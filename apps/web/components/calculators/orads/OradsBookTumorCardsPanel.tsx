"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import {
  ORADS_BOOK_DISCLAIMER_RU,
  ORADS_BOOK_PHOTOCARDS,
  listOradsBookTumorGroups,
  resolveOradsBookPhotocardSrc,
  searchOradsBookTumorCards,
  getPhotocardsForTumor,
  type OradsBookTumorCard,
} from "@repo/orads-us/book-ovary";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

function TumorCard({ card }: { card: OradsBookTumorCard }) {
  const photos = getPhotocardsForTumor(card.id).slice(0, 2);
  return (
    <article
      className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/25 p-3"
      aria-labelledby={`tumor-${card.id}`}
    >
      <h3 id={`tumor-${card.id}`} className="text-sm font-semibold text-[var(--clinical-foreground)]">
        {card.name}
      </h3>
      <p className="mt-0.5 text-xs text-[var(--clinical-foreground-muted)]">{card.group}</p>
      <dl className="mt-2 space-y-1.5 text-xs leading-relaxed text-[var(--clinical-foreground)]">
        <div>
          <dt className="font-medium text-[var(--clinical-foreground-muted)]">Возраст</dt>
          <dd>{card.age}</dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--clinical-foreground-muted)]">Латеральность</dt>
          <dd>{card.laterality}</dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--clinical-foreground-muted)]">УЗ-вид</dt>
          <dd>{card.appearance}</dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--clinical-foreground-muted)]">Признаки / маркеры</dt>
          <dd>{card.typical_features}</dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--clinical-foreground-muted)]">ЦДК</dt>
          <dd>{card.color_score}</dd>
        </div>
      </dl>
      {photos.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {photos.map((p) => (
            <figure key={p.file} className="overflow-hidden rounded-lg border border-[var(--clinical-border)]">
              <Image
                src={resolveOradsBookPhotocardSrc(p.file)}
                alt={p.titleRu}
                width={320}
                height={200}
                className="h-28 w-full object-cover"
              />
              <figcaption className="px-1.5 py-1 text-[10px] text-[var(--clinical-foreground-muted)]">
                {p.titleRu}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </article>
  );
}

/** Справочник гистологических типов из книги (не меняет категорию O-RADS). */
export function OradsBookTumorCardsPanel() {
  const groups = useMemo(() => listOradsBookTumorGroups(), []);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const results = useMemo(() => searchOradsBookTumorCards(query, group || undefined), [query, group]);

  return (
    <div className="space-y-3" data-e2e-orads-book-tumors>
      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Дифференциальный справочник (32 типа). Не подменяет стратификацию O-RADS US — только подсказки по УЗ-виду,
        маркерам и ЦДК.
      </p>
      <label className="block text-sm">
        <span className="font-medium text-[var(--clinical-foreground)]">Поиск</span>
        <Input
          className="mt-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Название, маркер (СА-125), УЗ-признак…"
          aria-label="Поиск по карточкам опухолей яичника"
        />
      </label>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Фильтр по группе">
        <button
          type="button"
          className={cn(
            "rounded-md border px-2 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
            !group
              ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)]/10 font-semibold"
              : "border-[var(--clinical-border)]",
          )}
          onClick={() => setGroup("")}
        >
          Все
        </button>
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            className={cn(
              "rounded-md border px-2 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
              group === g
                ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)]/10 font-semibold"
                : "border-[var(--clinical-border)]",
            )}
            onClick={() => setGroup(g)}
          >
            {g.replace(/^Доброкачественные/, "Добр.").replace(/^Злокачественные/, "Злок.").replace(/^Пограничные/, "Погран.")}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--clinical-foreground-muted)]">Найдено: {results.length}</p>
      <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
        {results.map((card) => (
          <TumorCard key={card.id} card={card} />
        ))}
      </div>
      <p className="text-[10px] leading-relaxed text-[var(--clinical-foreground-muted)]">
        {ORADS_BOOK_DISCLAIMER_RU} {ORADS_BOOK_PHOTOCARDS.disclaimerRu}
      </p>
    </div>
  );
}
