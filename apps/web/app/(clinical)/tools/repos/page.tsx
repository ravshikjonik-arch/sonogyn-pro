import Link from "next/link";

import { PLATFORM_REPOS } from "@/lib/platform-repos";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/repos");

export default function PlatformReposPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">Платформа</p>
        <h1 className="text-3xl font-black tracking-tight">Репозитории</h1>
        <p className="max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
          Каталоги открываются и ищутся здесь. Модели УЗИ лежат в проекте как исследовательский код: кабинет показывает их описание и не подменяет ими калькулятор приёма.
        </p>
      </header>
      <ul className="grid gap-3">
        {PLATFORM_REPOS.map((repo) => (
          <li key={repo.slug}>
            <Link
              href={`/tools/repos/${repo.slug}`}
              className="block rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4"
            >
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
                {repo.kind === "catalog" ? "Каталог" : "Модель"}
              </span>
              <span className="mt-1 block text-lg font-black">{repo.title}</span>
              <span className="mt-1 block text-sm text-[var(--clinical-foreground-muted)]">{repo.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
