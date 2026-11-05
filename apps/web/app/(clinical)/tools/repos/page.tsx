import Link from "next/link";

import { getClinicalPlatformRepos } from "@/lib/platform-repos";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/repos");

export default function PlatformReposPage() {
  const repos = getClinicalPlatformRepos();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
          Справочник · исследования
        </p>
        <h1 className="text-3xl font-black tracking-tight">Исслед. AI / УЗИ</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Карточки внешних open-source проектов, которые смотрели при проектировании AI-зоны. Это{" "}
          <strong className="font-semibold text-[var(--clinical-foreground)]">не файлы вашего кабинета</strong> и
          не замена калькуляторов O-RADS / BI-RADS / КР. Полный код — только на GitHub.
        </p>
      </header>
      <ul className="grid gap-3">
        {repos.map((repo) => (
          <li key={repo.slug}>
            <Link
              href={`/tools/repos/${repo.slug}`}
              className="block rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 transition hover:border-[var(--clinical-primary)]"
            >
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
                Исследование
              </span>
              <span className="mt-1 block text-lg font-black text-[var(--clinical-foreground)]">{repo.title}</span>
              <span className="mt-1 block text-sm text-[var(--clinical-foreground-muted)]">{repo.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
