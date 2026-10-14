"use client";

import type { KnowledgeLink } from "@repo/clinical-tools";
import { Calculator, GraduationCap, Link2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const KIND_LABEL: Record<KnowledgeLink["kind"], string> = {
  calculator: "Калькулятор",
  guideline: "КР",
  quiz: "Задачи",
  atlas: "Атлас",
  tool: "Инструмент",
  education: "Обучение",
};

function kindIcon(kind: KnowledgeLink["kind"]) {
  if (kind === "calculator" || kind === "tool") return Calculator;
  if (kind === "quiz" || kind === "education") return GraduationCap;
  return Link2;
}

export type KnowledgeLinksCardProps = {
  fromType: "nosology" | "teaching_case" | "module";
  fromId: string;
  title?: string;
  description?: string;
  /** SSR / instant paint before API. */
  initialLinks?: KnowledgeLink[];
};

export function KnowledgeLinksCard({
  fromType,
  fromId,
  title = "Связанные инструменты",
  description = "Калькуляторы, КР, задачи и атласы — единый граф знаний (без PHI).",
  initialLinks = [],
}: KnowledgeLinksCardProps) {
  const [links, setLinks] = useState<KnowledgeLink[]>(initialLinks);
  const [loading, setLoading] = useState(initialLinks.length === 0);
  const fallbackRef = useRef(initialLinks);
  fallbackRef.current = initialLinks;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({ fromType, fromId });
    void fetch(`/api/knowledge/links?${params.toString()}`, { credentials: "include" })
      .then(async (res) => {
        const fallback = fallbackRef.current;
        if (!res.ok) return fallback;
        const json = (await res.json()) as { links?: KnowledgeLink[] };
        return json.links?.length ? json.links : fallback;
      })
      .then((next) => {
        if (!cancelled) setLinks(next);
      })
      .catch(() => {
        if (!cancelled) setLinks(fallbackRef.current);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fromType, fromId]);

  if (!links.length && !loading) return null;

  return (
    <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {title}
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--clinical-foreground-muted)]" aria-hidden />
          ) : null}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2">
          {links.map((link) => {
            const Icon = kindIcon(link.kind);
            return (
              <li key={`${link.kind}-${link.href}`}>
                <Link
                  href={link.href}
                  className="flex items-start gap-2 rounded-xl border border-[var(--clinical-border)] p-3 transition hover:bg-[var(--clinical-muted)]"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--clinical-primary)]" aria-hidden />
                  <span>
                    <span className="block text-sm font-semibold text-[var(--clinical-foreground)]">
                      {link.title}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
                      {KIND_LABEL[link.kind]}
                    </span>
                    {link.description ? (
                      <span className="mt-0.5 block text-xs text-[var(--clinical-foreground-muted)]">
                        {link.description}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
