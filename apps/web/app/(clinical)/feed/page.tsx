import Link from "next/link";

import { FeedCaseCard } from "@/components/cases/FeedCaseCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadFeedCuratedCases } from "@/lib/cases/feed-curation";
import { createClient } from "@/utils/supabase/server";

/**
 * P0 curated feed — editorial blocks (Case of day · Confirmed · Rare).
 * No user media thumbs (gate R6).
 */
export default async function FeedPage() {
  const supabase = await createClient();
  const { caseOfDay, confirmed, rare, lifecycleReady } = await loadFeedCuratedCases(supabase);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 pb-24 lg:px-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--clinical-foreground-muted)]">
          Лента
        </p>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Для врача УЗД</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Подборка кейсов, инструментов и материалов. Главный рабочий вход —{" "}
          <Link
            href="/cases"
            className="font-semibold text-[var(--clinical-primary-deep)] underline-offset-2 hover:underline"
          >
            Кейсы
          </Link>
          .
        </p>
      </header>

      <section aria-labelledby="feed-case-of-day">
        {caseOfDay ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" id="feed-case-of-day">
                Case of the day
              </Badge>
              {caseOfDay.confirmed_at ? (
                <span className="text-xs text-[var(--clinical-foreground-muted)]">
                  подтверждён {new Date(caseOfDay.confirmed_at).toLocaleDateString("ru-RU")}
                </span>
              ) : null}
            </div>
            <FeedCaseCard item={caseOfDay} variant="featured" />
          </div>
        ) : (
          <Card className="border-[var(--clinical-primary)]/20 bg-[var(--clinical-primary-muted)]/30">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Case of the day</Badge>
                <span className="text-xs text-[var(--clinical-foreground-muted)]">editorial</span>
              </div>
              <CardTitle className="text-lg">
                {lifecycleReady
                  ? "Подтверждённых кейсов пока нет — добавьте первый"
                  : "Кейс дня появится после миграции lifecycle"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--clinical-foreground-muted)]">
              Создайте{" "}
              <Link href="/cases/new" className="font-semibold text-[var(--clinical-primary-deep)]">
                новый кейс
              </Link>{" "}
              или откройте{" "}
              <Link href="/tools/calc/rads/o-rads" className="font-semibold text-[var(--clinical-primary-deep)]">
                O-RADS
              </Link>
              .
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="feed-confirmed">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="feed-confirmed"
            className="text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]"
          >
            Подтверждённые кейсы
          </h2>
          <Link
            href="/cases?tab=cases&lifecycle=confirmed"
            className="text-xs font-semibold text-[var(--clinical-primary-deep)] hover:underline"
          >
            Подтверждённые →
          </Link>
        </div>
        {confirmed.length > 0 ? (
          <div className="space-y-3">
            {confirmed.map((item) => (
              <FeedCaseCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-sm text-[var(--clinical-foreground-muted)]">
              {lifecycleReady
                ? "Экспертно подтверждённые случаи появятся после модерации (lifecycle CONFIRMED)."
                : "Блок активируется после миграции lifecycle в Supabase."}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="feed-rare">
        <h2
          id="feed-rare"
          className="text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]"
        >
          Редкие случаи
        </h2>
        {rare.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {rare.map((item) => (
              <FeedCaseCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-sm text-[var(--clinical-foreground-muted)]">
              Редкие патологии (`is_rare`) появятся после editorial-разметки модератором.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="feed-quick-start">
        <h2
          id="feed-quick-start"
          className="text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]"
        >
          Быстрый старт
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">O-RADS Pro</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" variant="secondary">
                <Link href="/tools/calc/rads/o-rads">Открыть</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Чат врачей</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm">
                <Link href="/cases">К кейсам</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
