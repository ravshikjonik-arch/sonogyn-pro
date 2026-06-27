"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Radio, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WebinarListItem } from "@/lib/webinars/types";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function WebinarCard({ item }: { item: WebinarListItem }) {
  const href = `/tools/refs/webinars/${item.lessonId}`;
  const live = item.status === "live";

  return (
    <article className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          {live ? (
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
              <Radio className="h-3 w-3" /> LIVE
            </span>
          ) : item.status === "ended" ? (
            <span className="mb-2 inline-block rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold dark:bg-slate-800">
              Запись
            </span>
          ) : (
            <span className="mb-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              Скоро
            </span>
          )}
          <h3 className="font-semibold leading-snug">{item.lessonTitle}</h3>
          <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">{item.courseTitle}</p>
          <p className="mt-2 text-xs text-slate-500">
            {formatWhen(item.scheduledAt)}
            {item.authorName ? ` · ${item.authorName}` : ""}
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold">{item.priceRub.toLocaleString("ru-RU")} ₽</p>
      </div>
      <div className="mt-4">
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href={href}>
            {item.hasAccess ? (live ? "В эфир" : item.status === "ended" ? "Смотреть запись" : "Открыть") : "Подробнее"}
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function WebinarHubClient() {
  const [live, setLive] = useState<WebinarListItem[]>([]);
  const [upcoming, setUpcoming] = useState<WebinarListItem[]>([]);
  const [archive, setArchive] = useState<WebinarListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/webinars", { credentials: "same-origin" });
      const body = (await res.json()) as {
        ok?: boolean;
        live?: WebinarListItem[];
        upcoming?: WebinarListItem[];
        archive?: WebinarListItem[];
      };
      setLive(body.live ?? []);
      setUpcoming(body.upcoming ?? []);
      setArchive(body.archive ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
      </p>
    );
  }

  const empty = live.length === 0 && upcoming.length === 0 && archive.length === 0;

  return (
    <div className="space-y-10">
      {live.length > 0 ? (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Radio className="h-5 w-5 text-red-600" /> Сейчас в эфире
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {live.map((item) => (
              <WebinarCard key={item.lessonId} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Предстоящие</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((item) => (
              <WebinarCard key={item.lessonId} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {archive.length > 0 ? (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Video className="h-5 w-5" /> Архив записей
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {archive.map((item) => (
              <WebinarCard key={item.lessonId} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {empty ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-[var(--clinical-foreground-muted)]">
          Вебинаров пока нет. Лекторы создают их в{" "}
          <Link href="/author/courses" className="text-[var(--clinical-primary)] underline">
            кабинете автора
          </Link>
          .
        </div>
      ) : null}
    </div>
  );
}
