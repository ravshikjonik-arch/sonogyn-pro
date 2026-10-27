"use client";

import Link from "next/link";
import { useEffect } from "react";

import { MyomaChrome } from "@/components/education/myoma/MyomaChrome";
import { useMyomaProgress } from "@/components/education/myoma/use-myoma-progress";

type Neighbor = { id: string; title: string } | null;

const prose =
  "myoma-prose min-w-0 max-w-[72ch] space-y-3 overflow-x-auto text-[15px] leading-7 break-words text-[var(--clinical-foreground)] [&_blockquote]:rounded-2xl [&_blockquote]:border [&_blockquote]:border-[var(--clinical-border)] [&_blockquote]:bg-[var(--clinical-muted)] [&_blockquote]:p-4 [&_figure]:max-w-full [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:h-auto [&_img]:max-w-full [&_img]:min-w-0 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_p]:[overflow-wrap:anywhere] [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_td]:border [&_td]:border-[var(--clinical-border)] [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-[var(--clinical-border)] [&_th]:bg-[var(--clinical-muted)] [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc";

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]";

export function MyomaModuleClient({
  moduleId,
  order,
  title,
  durationMinutes,
  html,
  prev,
  next,
}: {
  moduleId: string;
  order: number;
  title: string;
  durationMinutes: number;
  html: string;
  prev: Neighbor;
  next: Neighbor;
}) {
  const { progress, visitModule, markModule } = useMyomaProgress();
  const done = progress.completedModuleIds.includes(moduleId);

  useEffect(() => {
    visitModule(moduleId);
  }, [visitModule, moduleId]);

  return (
    <MyomaChrome title={title} kicker={`Модуль ${order} · ${durationMinutes} мин`}>
      <article className={prose} dangerouslySetInnerHTML={{ __html: html }} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={`rounded-full bg-[var(--clinical-muted)] px-4 py-2 text-sm font-semibold text-[var(--clinical-foreground)] ${focus}`}
          onClick={() => markModule(moduleId)}
          aria-pressed={done}
        >
          {done ? "Модуль отмечен пройденным" : "Отметить модуль пройденным"}
        </button>
      </div>
      <nav aria-label="Соседние модули" className="grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={`/tools/refs/myoma-education/module/${prev.id}`} className={`rounded-2xl border border-[var(--clinical-border)] px-4 py-3 ${focus}`}>
            <span className="block text-xs text-[var(--clinical-foreground-muted)]">Назад</span>
            <span className="block font-semibold text-[var(--clinical-foreground)]">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/tools/refs/myoma-education/module/${next.id}`} className={`rounded-2xl border border-[var(--clinical-border)] px-4 py-3 sm:text-right ${focus}`}>
            <span className="block text-xs text-[var(--clinical-foreground-muted)]">Далее</span>
            <span className="block font-semibold text-[var(--clinical-foreground)]">{next.title}</span>
          </Link>
        ) : (
          <Link href="/tools/refs/myoma-education/quiz" className={`rounded-2xl border border-[var(--clinical-border)] px-4 py-3 sm:text-right ${focus}`}>
            <span className="block text-xs text-[var(--clinical-foreground-muted)]">Далее</span>
            <span className="block font-semibold text-[var(--clinical-foreground)]">Итоговый тест</span>
          </Link>
        )}
      </nav>
    </MyomaChrome>
  );
}
