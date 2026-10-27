"use client";

import Link from "next/link";

import { MyomaChrome } from "@/components/education/myoma/MyomaChrome";
import { useMyomaProgress } from "@/components/education/myoma/use-myoma-progress";

type ModuleCard = {
  id: string;
  order: number;
  title: string;
  durationMinutes: number;
};

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]";

export function MyomaCourseClient({
  title,
  modules,
}: {
  title: string;
  modules: ModuleCard[];
}) {
  const { progress, ready } = useMyomaProgress();
  const done = modules.filter((module) => progress.completedModuleIds.includes(module.id)).length;

  return (
    <MyomaChrome title={title} kicker="Обучение">
      <p className="max-w-[72ch] text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
        Шесть модулей по лекции: топография FIGO, протокол, допплер, особые формы, беременность и самопроверка.
        Прогресс хранится в этом браузере.
      </p>
      <p className="text-sm font-medium text-[var(--clinical-foreground)]" aria-live="polite">
        {ready ? `Пройдено ${done} из ${modules.length}` : "Прогресс загружается"}
        {progress.quizBestScore != null ? ` · лучший результат теста ${progress.quizBestScore}%` : ""}
      </p>
      <ol className="overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]">
        {modules.map((module, index) => {
          const complete = progress.completedModuleIds.includes(module.id);
          return (
            <li key={module.id} className={index > 0 ? "border-t border-[var(--clinical-border)]" : undefined}>
              <Link
                href={`/tools/refs/myoma-education/module/${module.id}`}
                className={`flex items-center gap-3 px-4 py-3 ${focus}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-[var(--clinical-foreground)]">
                    {module.order}. {module.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--clinical-foreground-muted)]">
                    {module.durationMinutes} мин
                    {progress.lastModuleId === module.id ? " · последний открытый" : ""}
                  </span>
                </span>
                {complete ? (
                  <span className="shrink-0 rounded-full bg-[var(--clinical-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--clinical-foreground)]">
                    Пройден
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </MyomaChrome>
  );
}
