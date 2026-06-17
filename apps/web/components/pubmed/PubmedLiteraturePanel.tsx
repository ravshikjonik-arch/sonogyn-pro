"use client";

import { pubmedArticleUrl } from "@repo/nosology";
import { BookOpen, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type PubmedLiteratureItem = {
  pmid: string;
  title?: string;
  journal?: string;
  year?: number;
  clinicalPearl?: string;
  tier?: 1 | 2 | 3;
};

type PubmedArticleMeta = {
  pmid: string;
  title: string;
  journal?: string;
  year?: number;
};

export type PubmedLiteraturePanelProps = {
  title?: string;
  description?: string;
  pubmedHref: string;
  items: PubmedLiteratureItem[];
  extraLinks?: { href: string; label: string }[];
  className?: string;
  compact?: boolean;
};

function LiteratureRow({
  item,
  meta,
  loading,
}: {
  item: PubmedLiteratureItem;
  meta?: PubmedArticleMeta;
  loading: boolean;
}) {
  const title = meta?.title ?? item.title ?? `PMID ${item.pmid}`;
  const subtitle = [meta?.journal ?? item.journal, meta?.year ?? item.year].filter(Boolean).join(" · ");

  return (
    <li className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 p-3">
      <div className="flex flex-wrap items-start gap-2">
        <Badge variant="outline" className="text-[10px]">
          PMID {item.pmid}
        </Badge>
        {item.tier ? (
          <Badge variant="secondary" className="text-[10px]">
            Tier {item.tier}
          </Badge>
        ) : null}
        <a
          href={pubmedArticleUrl(item.pmid)}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-[var(--clinical-primary)] hover:underline"
        >
          PubMed <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <p className="mt-2 text-sm font-medium leading-snug">
        {loading && !meta ? <span className="text-[var(--clinical-foreground-muted)]">Загрузка…</span> : title}
      </p>
      {subtitle ? <p className="mt-0.5 text-xs text-[var(--clinical-foreground-muted)]">{subtitle}</p> : null}
      {item.clinicalPearl ? (
        <p className="mt-2 text-xs leading-relaxed">
          <span className="font-semibold">На УЗИ: </span>
          {item.clinicalPearl}
        </p>
      ) : null}
    </li>
  );
}

export function PubmedLiteraturePanel({
  title = "Литература · PubMed",
  description = "Курируемые статьи (tier 2) дополняют КР. Не заменяют протокол учреждения.",
  pubmedHref,
  items,
  extraLinks = [],
  className,
  compact = false,
}: PubmedLiteraturePanelProps) {
  const [metaByPmid, setMetaByPmid] = useState<Record<string, PubmedArticleMeta>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    const pmids = items.map((i) => i.pmid).join(",");

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/pubmed/abstracts?pmid=${encodeURIComponent(pmids)}`);
        const data = (await res.json()) as { articles?: PubmedArticleMeta[] };
        if (cancelled || !data.articles) return;
        const map: Record<string, PubmedArticleMeta> = {};
        for (const a of data.articles) map[a.pmid] = a;
        setMetaByPmid(map);
      } catch {
        /* fallback to curated pearls */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [items]);

  return (
    <Card className={className}>
      {!compact ? (
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[var(--clinical-primary)]" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      ) : null}
      <CardContent className={compact ? "space-y-3 p-4" : "space-y-4"}>
        {compact ? <p className="text-sm font-semibold">{title}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" asChild>
            <a href={pubmedHref} target="_blank" rel="noopener noreferrer">
              Искать в PubMed
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
          {extraLinks.map((link) => (
            <Button key={link.href} size="sm" variant="outline" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>

        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <LiteratureRow key={item.pmid} item={item} meta={metaByPmid[item.pmid]} loading={loading} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Используйте поиск в PubMed по теме калькулятора.
          </p>
        )}

        {loading && items.length > 0 ? (
          <p className="flex items-center gap-2 text-xs text-[var(--clinical-foreground-muted)]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Данные PubMed/NCBI…
          </p>
        ) : null}

        {!compact ? (
          <p className="text-[10px] leading-relaxed text-[var(--clinical-foreground-muted)]">
            Источник метаданных:{" "}
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              PubMed
            </a>{" "}
            (NCBI). Клиническая интерпретация — специалист.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
