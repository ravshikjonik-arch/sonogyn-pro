import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { DomainHubCard, DomainHubGroup } from "@/lib/nav/domain-hubs";

export function ClinicalDomainHub({
  title,
  description,
  cards,
  groups,
  backHref = "/home",
  backLabel = "← Разделы",
}: {
  kicker?: string;
  title: string;
  description: string;
  cards?: DomainHubCard[];
  groups?: DomainHubGroup[];
  backHref?: string;
  backLabel?: string;
}) {
  const sections: DomainHubGroup[] = groups?.length
    ? groups
    : [{ title: "Открыть", cards: cards ?? [] }];

  return (
    <div className="mx-auto min-h-[100dvh] max-w-lg space-y-6 px-4 py-6 pb-28 sm:max-w-xl">
      <header className="space-y-2">
        <Link href={backHref} className="text-sm font-medium text-[var(--clinical-foreground-muted)]">
          {backLabel}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--clinical-foreground)]">{title}</h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{description}</p>
      </header>

      {sections.map((group) => (
        <section key={group.title} className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-[var(--clinical-foreground-muted)]">{group.title}</h2>
          <ul className="overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]">
            {group.cards.map((card, index) => (
              <li key={card.href} className={index > 0 ? "border-t border-[var(--clinical-border)]" : undefined}>
                <Link
                  href={card.href}
                  className="flex items-center gap-3 px-4 py-3 active:bg-[var(--clinical-muted)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-[var(--clinical-foreground)]">
                      {card.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--clinical-foreground-muted)]">
                      {card.description}
                    </span>
                  </span>
                  {card.badge ? (
                    <span className="shrink-0 rounded-full bg-[var(--clinical-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--clinical-foreground)]">
                      {card.badge}
                    </span>
                  ) : null}
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--clinical-foreground-muted)]" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="px-1 text-xs text-[var(--clinical-foreground-muted)]">
        Справочная поддержка. Не ставит диагноз.
      </p>
    </div>
  );
}
