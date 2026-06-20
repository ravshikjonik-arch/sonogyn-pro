import { Search, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";

import { CardImage } from "@/components/CardImage";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ALL_TAGS } from "@/data/cardsData";
import { useCardFilter } from "@/hooks/useCardFilter";
import { cardPreview, primaryTag, TAG_STYLES } from "@/lib/card-utils";
import { cn } from "@/lib/cn";

export function HomePage() {
  const { query, setQuery, activeTag, setActiveTag, filtered, total } = useCardFilter();
  const featured = filtered.find((c) => c.id === 1) ?? filtered[0];
  const gridCards = filtered.filter((c) => c.id !== featured?.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="animate-fade-up overflow-hidden rounded-3xl bg-gradient-to-br from-medical-navy-deep via-medical-navy to-medical-navy-light p-6 text-white shadow-xl sm:p-8 lg:p-10">
        <div className="relative">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-medical-teal/20 blur-3xl" aria-hidden />
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-medical-teal">Fetal spine · ultrasound atlas</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            УЗИ позвоночника плода
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            15 интерактивных карточек: от нормальной анатомии до spina bifida, тератом и синдрома каудальной регрессии.
            Поиск, фильтры и структурированные секции для скрининга II–III триместра.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { label: "15 карточек", icon: Sparkles },
              { label: "Offline", icon: null },
              { label: "ISUOG-стиль", icon: null },
            ].map(({ label }) => (
              <span
                key={label}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск: миеломенингоцеле, L1–L2, тератома…"
              className="w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-10 text-sm text-slate-900 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-teal"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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

      {/* Stats bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-medical-border bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
        <p className="text-sm text-medical-muted">
          Показано <span className="font-bold text-medical-navy">{filtered.length}</span> из {total} карточек
        </p>
        {(query || activeTag) && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveTag(null);
            }}
            className="text-xs font-bold text-medical-teal hover:underline"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState onReset={() => { setQuery(""); setActiveTag(null); }} />
      ) : (
        <>
          {featured ? (
            <Link to={`/card/${featured.id}`} className="group mt-6 block animate-fade-up">
              <Card className="overflow-hidden border-medical-border/80 shadow-md transition-all hover:shadow-xl">
                <div className="grid lg:grid-cols-2">
                  <div className="relative bg-slate-50 lg:max-h-[320px]">
                    <CardImage imageId={featured.imageId} title={featured.title} variant="thumb" className="lg:aspect-auto lg:h-full lg:max-h-none" />
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <Badge variant="accent">Старт · глава {String(featured.id).padStart(2, "0")}</Badge>
                    <h2 className="mt-3 text-2xl font-extrabold text-medical-navy group-hover:text-medical-navy-light">
                      {featured.title}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-medical-muted">{cardPreview(featured)}</p>
                    <span className="mt-5 inline-flex items-center text-sm font-bold text-medical-teal group-hover:underline">
                      Открыть карточку →
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ) : null}

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {gridCards.map((card, i) => {
              const tag = primaryTag(card);
              const style = TAG_STYLES[tag] ?? TAG_STYLES.Обзор;
              return (
                <Link
                  key={card.id}
                  to={`/card/${card.id}`}
                  className="group block animate-fade-up"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <Card
                    className={cn(
                      "h-full overflow-hidden ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                      style.ring,
                    )}
                  >
                    <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
                      <CardImage imageId={card.imageId} title={card.title} variant="thumb" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
                      <span className="absolute left-3 top-3 rounded-lg bg-medical-navy/90 px-2 py-1 text-[10px] font-black tracking-wider text-white shadow">
                        {String(card.id).padStart(2, "0")}
                      </span>
                    </div>
                    <CardHeader className="border-0 pb-1 pt-4">
                      <h2 className="line-clamp-2 text-base font-bold leading-snug text-medical-navy transition-colors group-hover:text-medical-teal-dark">
                        {card.title}
                      </h2>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="line-clamp-2 text-xs leading-relaxed text-medical-muted">{cardPreview(card)}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {card.tags.slice(0, 3).map((t) => (
                          <Badge key={t} variant={TAG_STYLES[t]?.badge ?? "default"}>
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
          ? "bg-medical-teal text-medical-navy shadow-md shadow-medical-teal/30"
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
    <div className="mt-10 rounded-3xl border border-dashed border-medical-border bg-white p-12 text-center shadow-sm">
      <p className="text-lg font-bold text-medical-navy">Ничего не найдено</p>
      <p className="mt-2 text-sm text-medical-muted">Попробуйте другой запрос или сбросьте фильтр по тегам.</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-xl bg-medical-navy px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-medical-navy-light"
      >
        Показать все карточки
      </button>
    </div>
  );
}
