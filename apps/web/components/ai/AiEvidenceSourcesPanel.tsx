"use client";

import { AlertTriangle, ArrowUpRight, BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { AssistantAnswer } from "@repo/evidence-retrieval";

import { resolveCitationLink, resolveGuidelineEntryLink } from "@/lib/evidence/citation-links";
import { isInsufficientEvidence } from "@/lib/ai/sonogyn-chat/evidence-insufficient";
import { cn } from "@/lib/utils/cn";

type Props = {
  evidence: AssistantAnswer;
  onNavigate?: () => void;
  className?: string;
};

export function AiEvidenceSourcesPanel({ evidence, onNavigate, className }: Props) {
  const insufficient = isInsufficientEvidence(evidence);
  const pick = onNavigate;

  return (
    <div
      className={cn(
        "mt-3 space-y-2 border-t border-[var(--clinical-border)] pt-2",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {insufficient ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:text-amber-100">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            Недостаточно источников
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
            <BookOpen className="h-3 w-3" aria-hidden />
            EBM · {evidence.gradeLabel}
          </span>
        )}
        <span className="text-[10px] text-[var(--clinical-foreground-muted)]">
          {evidence.citations.length} цитат
          {evidence.guidelines.length ? ` · ${evidence.guidelines.length} КР` : ""}
        </span>
      </div>

      {insufficient ? (
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Ответ без подтверждённых citations.{" "}
          <Link
            href="/tools/refs/guidelines"
            className="font-semibold text-[var(--clinical-primary-deep)] underline"
            onClick={pick}
          >
            Каталог КР
          </Link>
          {" · "}
          <Link
            href="/tools/refs/evidence-assistant"
            className="font-semibold text-[var(--clinical-primary-deep)] underline"
            onClick={pick}
          >
            Evidence Assistant
          </Link>
        </p>
      ) : null}

      {evidence.guidelines.length > 0 ? (
        <ul className="space-y-1">
          {evidence.guidelines.slice(0, 3).map((g) => {
            const link = resolveGuidelineEntryLink(g);
            return (
              <li key={g.url}>
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--clinical-primary)] underline"
                  >
                    {g.title}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    onClick={pick}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--clinical-primary-deep)] underline"
                  >
                    {g.title}
                    <span className="rounded bg-[var(--clinical-primary-muted)] px-1 text-[9px] font-bold uppercase">
                      {link.label}
                    </span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {evidence.citations.length > 0 ? (
        <ul className="space-y-1.5">
          {evidence.citations.slice(0, 4).map((c) => {
            const link = resolveCitationLink(c);
            return (
              <li key={c.id}>
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--clinical-primary)] underline"
                  >
                    {c.title}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    onClick={pick}
                    className="inline-flex flex-wrap items-center gap-1 text-xs text-[var(--clinical-primary-deep)] underline"
                  >
                    {c.title}
                    <span className="text-[9px] font-bold uppercase text-[var(--clinical-foreground-muted)]">
                      {link.label}
                    </span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {evidence.citations.length > 4 ? (
        <Link
          href="/tools/refs/evidence-assistant"
          onClick={pick}
          className="inline-flex items-center gap-1 text-[10px] text-[var(--clinical-primary-deep)] underline"
        >
          Все цитаты в Evidence Assistant
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
