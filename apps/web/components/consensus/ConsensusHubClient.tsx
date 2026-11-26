"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CONSENSUS_ROOMS } from "@repo/clinical-tools";
import {
  CONSENSUS_HUB_META,
  IMPLEMENTATION_LABELS,
  type ConsensusHubCard,
  type ImplementationStatus,
  consensusHubCategoryLabels,
} from "@repo/evidence-retrieval";

const IMPLEMENTATION_BADGE: Record<ImplementationStatus, string> = {
  live: "bg-[var(--clinical-primary)]/15 text-[var(--clinical-primary-deep)]",
  routed: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  corpus: "bg-[var(--clinical-muted)] text-[var(--clinical-foreground-muted)]",
  planned: "border border-dashed border-[var(--clinical-border)] text-[var(--clinical-foreground-muted)]",
  external: "bg-slate-500/10 text-[var(--clinical-foreground-muted)]",
};

export function ConsensusHubClient({ cards }: { cards: ConsensusHubCard[] }) {
  const categories = useMemo(() => consensusHubCategoryLabels(), []);
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(() => {
    if (cat === "all") return cards;
    return cards.filter((c) => c.cats.includes(cat));
  }, [cards, cat]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 lg:px-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
          Consensus Platform · волна 0
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
          {CONSENSUS_HUB_META.title}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {CONSENSUS_HUB_META.description}
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Реестр v{CONSENSUS_HUB_META.registryVersion} · обновлён {CONSENSUS_HUB_META.registryUpdated} ·{" "}
          {CONSENSUS_HUB_META.schemaVersion}
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          <Link href="/tools/refs/guidelines?shelf=international" className="underline underline-offset-2">
            Полка «Международные» в КР
          </Link>
          {" · "}
          <Link href="/tools/refs/sources" className="underline underline-offset-2">
            Официальные источники
          </Link>
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="consensus-rooms-heading">
        <h2 id="consensus-rooms-heading" className="text-lg font-semibold text-[var(--clinical-foreground)]">
          Комнаты консенсуса
        </h2>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Один вход на семейство стандартов (как O-RADS US). Остальные комнаты наполняются в волнах 1–3.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONSENSUS_ROOMS.map((room) => (
            <li key={room.id} id={`room-${room.id}`}>
              <Card className="h-full border-[var(--clinical-primary)]/35 bg-[var(--clinical-surface)]">
                <CardHeader className="pb-2">
                  {room.badge ? (
                    <Badge variant="outline" className="mb-1 w-fit">
                      {room.badge}
                    </Badge>
                  ) : null}
                  <CardTitle className="text-base">
                    <Link href={room.href} className="hover:underline">
                      {room.title}
                    </Link>
                  </CardTitle>
                  <CardDescription>{room.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={room.href}
                    className="text-sm font-medium text-[var(--clinical-primary)] underline underline-offset-2"
                  >
                    Открыть комнату →
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4" aria-labelledby="consensus-catalog-heading">
        <h2 id="consensus-catalog-heading" className="text-lg font-semibold text-[var(--clinical-foreground)]">
          Каталог классификаций
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={cat === "all" ? "default" : "outline"}
            onClick={() => setCat("all")}
          >
            Все
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              type="button"
              size="sm"
              variant={cat === c.id ? "default" : "outline"}
              onClick={() => setCat(c.id)}
            >
              {c.title}
            </Button>
          ))}
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((item) => (
            <li key={item.key}>
              <Card className="h-full border-[var(--clinical-border)] bg-[var(--clinical-surface)]">
                <CardHeader className="pb-2">
                  <div className="mb-1 flex flex-wrap gap-2">
                    <Badge className={IMPLEMENTATION_BADGE[item.implementation]}>
                      {IMPLEMENTATION_LABELS[item.implementation]}
                    </Badge>
                    <Badge variant="outline">{item.org}</Badge>
                  </div>
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <CardDescription>{item.domain}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-[var(--clinical-foreground-muted)]">
                  <p>Статус документа: {item.status}</p>
                  {item.roomId ? <p>Комната: {item.roomId}</p> : null}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="inline-block text-sm font-medium text-[var(--clinical-primary)] underline underline-offset-2"
                    >
                      Открыть в платформе →
                    </Link>
                  ) : item.source ? (
                    <a
                      href={item.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm font-medium text-[var(--clinical-primary)] underline underline-offset-2"
                    >
                      Официальный источник ↗
                    </a>
                  ) : (
                    <span>Пока только полка знаний / RAG</span>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-[var(--clinical-border)] pt-4 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Справочно · не диагноз · интерпретация — лечащий специалист. Тексты и таблицы организаций не
        копируются.
      </footer>
    </div>
  );
}