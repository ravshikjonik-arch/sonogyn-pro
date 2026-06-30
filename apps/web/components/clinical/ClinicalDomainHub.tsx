import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DomainHubCard } from "@/lib/nav/domain-hubs";

export function ClinicalDomainHub({
  kicker,
  title,
  description,
  cards,
  backHref = "/tools",
  backLabel = "← Все инструменты",
}: {
  kicker: string;
  title: string;
  description: string;
  cards: DomainHubCard[];
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 pb-24 lg:px-6">
      <header className="space-y-3">
        <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-xs" asChild>
          <Link href={backHref}>{backLabel}</Link>
        </Button>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--clinical-foreground-muted)]">
          {kicker}
        </p>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {description}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Card
            key={card.href}
            className={
              card.primary
                ? "border-[var(--clinical-primary)]/30 bg-[var(--clinical-primary-muted)]/20"
                : undefined
            }
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug">{card.title}</CardTitle>
                {card.badge ? <Badge variant="secondary">{card.badge}</Badge> : null}
              </div>
              <CardDescription className="leading-relaxed">{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" variant={card.primary ? "default" : "secondary"}>
                <Link href={card.href}>Открыть →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
