"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchMessengerCaseCard } from "@/lib/messenger/api-client";

type Props = {
  caseId: string;
};

export function MessengerClinicalCardEmbed({ caseId }: Props) {
  const [card, setCard] = useState<{
    title: string;
    href: string;
    topic: string | null;
    lifecycleStatus: string | null;
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchMessengerCaseCard(caseId)
      .then((c) => {
        if (!cancelled) setCard(c);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  if (error) {
    return (
      <p className="text-[11px] text-[var(--clinical-foreground-muted)]">
        Кейс недоступен · <Link href={`/cases/${caseId}`}>открыть</Link>
      </p>
    );
  }

  if (!card) {
    return <p className="text-[11px] text-[var(--clinical-foreground-muted)]">Загрузка кейса…</p>;
  }

  return (
    <Link
      href={card.href}
      className="mt-1 block max-w-sm rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/50 px-3 py-2 text-left transition hover:bg-[var(--clinical-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
        Учебный кейс
      </p>
      <p className="text-sm font-semibold text-[var(--clinical-foreground)] line-clamp-2">{card.title}</p>
      {card.lifecycleStatus ? (
        <p className="mt-0.5 text-[10px] text-[var(--clinical-foreground-muted)]">{card.lifecycleStatus}</p>
      ) : null}
    </Link>
  );
}
