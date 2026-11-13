"use client";

import { useMemo, useState } from "react";

import { renderSimpleMarkdown } from "@/lib/education/simple-markdown";
import type { PlatformRepo } from "@/lib/platform-repos";
import { sanitizeCourseHtml } from "@/lib/security/sanitize-course-html";

/** SECURITY / UX: не показываем сырой README как «исходник» в <pre>. */
const PREVIEW_LINES = 60;

function excerptMarkdown(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (/^\[!\[/.test(t) || /^<img\s/i.test(t)) continue;
    kept.push(line);
    if (kept.length >= PREVIEW_LINES) break;
  }
  return kept.join("\n").trim();
}

export function PlatformRepoDocument({
  repo,
  text,
}: {
  repo: PlatformRepo;
  text: string | null;
}) {
  const [showReadme, setShowReadme] = useState(false);
  const previewHtml = useMemo(() => {
    if (!text) return null;
    return sanitizeCourseHtml(renderSimpleMarkdown(excerptMarkdown(text)));
  }, [text]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
          {repo.kind === "catalog" ? "Внешний каталог" : "Исследование (не калькулятор приёма)"}
        </p>
        <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">{repo.title}</h1>
        <p className="text-base leading-relaxed text-[var(--clinical-foreground-muted)]">{repo.summary}</p>
        <p className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 px-4 py-3 text-sm text-[var(--clinical-foreground-muted)]">
          Это <strong className="text-[var(--clinical-foreground)]">чужой открытый проект</strong>, не модуль
          SonoGyn Pro. Здесь нет готовых файлов вашего кабинета — только краткое описание и ссылка на GitHub.
          Не использовать как диагноз или замену КР / O-RADS / BI-RADS.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            className="inline-flex items-center rounded-xl bg-[var(--clinical-primary)] px-4 py-2 text-sm font-semibold text-white"
            href={repo.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Открыть на GitHub
          </a>
          {previewHtml ? (
            <button
              type="button"
              className="inline-flex items-center rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-4 py-2 text-sm font-semibold text-[var(--clinical-foreground)]"
              onClick={() => setShowReadme((v) => !v)}
              aria-expanded={showReadme}
            >
              {showReadme ? "Скрыть краткое README" : "Показать краткое README"}
            </button>
          ) : null}
        </div>
      </header>

      {showReadme && previewHtml ? (
        <article
          className="prose-clinical max-w-none space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5 text-sm leading-relaxed text-[var(--clinical-foreground)] [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      ) : null}
    </div>
  );
}
