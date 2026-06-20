"use client";

import { Search, Sparkles, X } from "lucide-react";
import Link from "next/link";

import { FetalSpineCardImage } from "@/components/education/fetal-spine/FetalSpineCardImage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useFetalSpineCardFilter } from "@/hooks/useFetalSpineCardFilter";
import { cardPreview, primaryTag, TAG_STYLES } from "@/lib/education/fetal-spine/card-utils";
import { ALL_TAGS } from "@/lib/education/fetal-spine/cardsData";
import { cn } from "@/lib/utils/cn";

export function FetalSpineGalleryClient() {
  const { query, setQuery, activeTag, setActiveTag, filtered, total } = useFetalSpineCardFilter();
  const featured = filtered.find((c) => c.id === 1) ?? filtered[0];
  const gridCards = filtered.filter((c) => c.id !== featured?.id);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--clinical-primary-deep)] via-[var(--clinical-primary)] to-[var(--clinical-primary)]/85 p-6 text-white shadow-xl sm:p-8 lg:p-10">
        <div className="relative">
          <div
            className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
            Fetal spine · ultrasound atlas
          </p>
          <h2 className="mt-3 max-w-3xl text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
            15 интерактивных карточек
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            От нормальной анатомии до spina bifida, тератом и синдрома каудальной регрессии. Поиск, фильтры и
            структурированные секции для скрининга II–III триместра.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {["15 карточек", "Offline", "ISUOG-стиль"].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm"
              >
                {label === "15 карточек" ? <Sparkles className="h-3 w-3" /> : null}
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--clinical-foreground-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск: миеломенингоцеле, L1–L2, тератома…"
              className="w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-10 text-sm text-[var(--clinical-foreground)] shadow-lg placeholder:text-[var(--clinical-foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--clinical-primary-muted)]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--clinical-foreground-muted)] hover:bg-[var(--clinical-muted)] hover:text-[var(--clinical-foreground)]"
                aria-label="Очистить поиск"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>

          <div className="flex flex-wrap gap-2">
            <FilterChip active={activeTag === null} onClick={() => setActiveTag(null)} label="Все" count={total} />
            {ALL_TAGS.map((tag) => (
              <FilterChip
                key={tag}
                active={activeTag === tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                label={tag}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-4 py-3 shadow-sm">
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Показано <span className="font-bold text-[var(--clinical-foreground)]">{filtered.length}</span> из {total}{" "}
          карточек
        </p>
        {(query || activeTag) && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveTag(null);
            }}
            className="text-xs font-bold text-[var(--clinical-primary)] hover:underline"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          onReset={() => {
            setQuery("");
            setActiveTag(null);
          }}
        />
      ) : (
        <>
          {featured ? (
            <Link href={`/library/fetal-spine/${featured.id}`} className="group block">
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="grid lg:grid-cols-2">
                  <div className="relative bg-[var(--clinical-muted)]/30 lg:max-h-[320px]">
                    <FetalSpineCardImage
                      imageId={featured.imageId}
                      title={featured.title}
                      variant="thumb"
                      className="lg:aspect-auto lg:h-full lg:max-h-none"
                    />
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <Badge variant="warning">Старт · глава {String(featured.id).padStart(2, "0")}</Badge>
                    <h3 className="mt-3 text-2xl font-extrabold text-[var(--clinical-foreground)] group-hover:text-[var(--clinical-primary-deep)]">
                      {featured.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                      {cardPreview(featured)}
                    </p>
                    <span className="mt-5 inline-flex items-center text-sm font-bold text-[var(--clinical-primary)] group-hover:underline">
                      Открыть карточку →
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ) : null}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {gridCards.map((card) => {
              const tag = primaryTag(card);
              const style = TAG_STYLES[tag] ?? TAG_STYLES.Обзор;
              return (
                <Link key={card.id} href={`/library/fetal-spine/${card.id}`} className="group block">
                  <Card
                    className={cn(
                      "h-full overflow-hidden ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                      style.ring,
                    )}
                  >
                    <div className="relative overflow-hidden bg-gradient-to-b from-[var(--clinical-muted)]/40 to-[var(--clinical-card)]">
                      <FetalSpineCardImage imageId={card.imageId} title={card.title} variant="thumb" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--clinical-card)] to-transparent" />
                      <span className="absolute left-3 top-3 rounded-lg bg-[var(--clinical-primary-deep)]/90 px-2 py-1 text-[10px] font-black tracking-wider text-white shadow">
                        {String(card.id).padStart(2, "0")}
                      </span>
                    </div>
                    <CardHeader className="border-0 pb-1 pt-4">
                      <h3 className="line-clamp-2 text-base font-bold leading-snug text-[var(--clinical-foreground)] transition-colors group-hover:text-[var(--clinical-primary-deep)]">
                        {card.title}
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="line-clamp-2 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                        {cardPreview(card)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {card.tags.slice(0, 3).map((t) => (
                          <Badge key={t} variant={style.badge}>
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
        active
          ? "bg-white text-[var(--clinical-primary-deep)] shadow-md"
          : "border border-white/20 bg-white/10 text-white hover:bg-white/20",
      )}
    >
      {label}
      {count != null ? ` · ${count}` : ""}
    </button>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--clinical-border)] bg-[var(--clinical-card)] p-12 text-center shadow-sm">
      <p className="text-lg font-bold text-[var(--clinical-foreground)]">Ничего не найдено</p>
      <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">
        Попробуйте другой запрос или сбросьте фильтр по тегам.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-xl bg-[var(--clinical-primary-deep)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--clinical-primary)]"
      >
        Показать все карточки
      </button>
    </div>
  );
}
