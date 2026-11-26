import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ConsensusPlannedRoute } from "@repo/clinical-tools";

export function ConsensusPlannedClient({ route }: { route: ConsensusPlannedRoute }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
          Consensus Platform · маршрут
        </p>
        <h1 className="text-2xl font-semibold text-[var(--clinical-foreground)]">{route.title}</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">{route.subtitle}</p>
      </header>

      <div className="rounded-2xl border border-dashed border-[var(--clinical-border)] bg-[var(--clinical-surface)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
          В плане · без отдельного engine
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--clinical-foreground)]">
          {route.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={route.primaryHref}>{route.primaryLabel} →</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/tools/consensus">Каталог стандартов</Link>
        </Button>
        {route.officialUrl ? (
          <Button variant="ghost" asChild>
            <a href={route.officialUrl} target="_blank" rel="noopener noreferrer">
              Официальный источник
            </a>
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        Справочная поддержка решений. Интерпретацию и тактику определяет врач; это не диагноз.
      </p>
    </div>
  );
}