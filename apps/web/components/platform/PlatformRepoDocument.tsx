"use client";

import { useMemo, useState } from "react";

import type { PlatformRepo } from "@/lib/platform-repos";

export function PlatformRepoDocument({
  repo,
  text,
  source,
}: {
  repo: PlatformRepo;
  text: string;
  source: "project" | "github";
}) {
  const [query, setQuery] = useState("");
  const lines = useMemo(() => text.split("\n"), [text]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter((line) => line.toLowerCase().includes(q));
  }, [lines, query]);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
          {repo.kind === "catalog" ? "Каталог" : "Исследовательский репозиторий"}
        </p>
        <h1 className="text-3xl font-black tracking-tight">{repo.title}</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">{repo.summary}</p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Текст {source === "project" ? "из папки проекта" : "с GitHub"} · {visible.length} из {lines.length} строк
        </p>
        <a className="text-sm font-semibold text-[var(--clinical-link)]" href={repo.githubUrl}>
          Открыть на GitHub
        </a>
      </header>
      <input
        className="w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2 text-sm"
        placeholder="Поиск по тексту репозитория"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Поиск по тексту репозитория"
      />
      <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 text-xs leading-relaxed">
        {visible.join("\n")}
      </pre>
    </div>
  );
}
