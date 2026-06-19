"use client";

import { BookMarked, ExternalLink, Loader2, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import type { EvidenceCitation } from "@repo/evidence-engine";
import {
  EVIDENCE_DISCLAIMER,
  EVIDENCE_ENTRIES,
  EVIDENCE_SHELVES,
  type EvidenceRelatedLink,
  type EvidenceShelf,
  type EvidenceShelfMeta,
} from "@repo/evidence-corpus";

type AskResponse = {
  query: string;
  answerSummary: string;
  citations: EvidenceCitation[];
  disclaimer: string;
  corpusVersion: string;
};

const ACTIVE_SHELVES = EVIDENCE_SHELVES.filter((s: EvidenceShelfMeta) => s.status === "active");

const SUGGESTED_BY_SHELF: Record<EvidenceShelf, string[]> = {
  "us-fmf": [
    "NT срок измерения",
    "PAPP-A снижен",
    "калькулятор преэклампсии",
    "венозный проток a-wave",
    "близнецы хорионичность",
    "CPR допплер",
    "TTTS",
    "NIPT",
  ],
  obgyn: [
    "эндометриоз УЗИ",
    "миома FIGO",
    "СПКЯ Rotterdam",
    "аденомиоз",
    "перекрут яичника",
    "эктопическая беременность",
    "преэклампсия ведение",
    "O-RADS triage",
  ],
  cervix: [
    "ВПЧ скрининг",
    "ASC-US тактика",
    "CIN2 лечение",
    "кольпоскопия показания",
    "короткая шейка CL",
    "progesterone CL",
    "полип шейки",
    "AGC цитология",
  ],
  mammo: [
    "BI-RADS 3",
    "fibroadenoma",
    "simple cyst",
    "BI-RADS 4 biopsy",
    "axillary node",
    "эластография",
    "palpable lump",
    "dense breast",
  ],
  onco: [
    "O-RADS 5",
    "IOTA M-features",
    "color score",
    "endometrioma",
    "ascites придатки",
    "PMPB эндометрий",
    "papillary projections",
    "CA-125",
  ],
  endocrine: [
    "СПКЯ Rotterdam",
    "AMH резерв",
    "TSH беременность",
    "TI-RADS узел",
    "letrozole овуляция",
    "гиперprolactinemia",
    "POI",
    "GDM postpartum",
  ],
  surgery: [
    "laparoscopy показания",
    "hysteroscopy полип",
    "myomectomy FIGO",
    "endometriosis pre-op",
    "O-RADS pre-op",
    "cerclage",
    "niche cesarean scar",
    "hydrosalpinx IVF",
  ],
};

const PLACEHOLDER_BY_SHELF: Record<EvidenceShelf, string> = {
  "us-fmf": "NT, PAPP-A, венозный проток, КТР…",
  obgyn: "эндометриоз, FIGO, СПКЯ, преэклампсия, O-RADS…",
  cervix: "ВПЧ, ASC-US, CIN, CL, кольпоскопия…",
  mammo: "BI-RADS, киста, fibroadenoma, elastography…",
  onco: "O-RADS, IOTA, papillary, ascites, эндометрий…",
  endocrine: "СПКЯ, AMH, TSH, TI-RADS, letrozole…",
  surgery: "laparoscopy, hysteroscopy, myomectomy, cerclage…",
};

const FALLBACK_LINK_BY_SHELF: Record<EvidenceShelf, { href: string; label: string }> = {
  "us-fmf": { href: "/assistant/fmf", label: "FMF · скрининги" },
  obgyn: { href: "/assistant/gynecology", label: "Помощник АГ" },
  cervix: { href: "/nosologies/cervix-pathology", label: "Нозология · шейка" },
  mammo: { href: "/calculators/bi-rads", label: "BI-RADS" },
  onco: { href: "/library/orads-echograms", label: "O-RADS · эхограммы" },
  endocrine: { href: "/calculators/ti-rads", label: "TI-RADS" },
  surgery: { href: "/idea-deep-endometriosis", label: "IDEA · pre-op" },
};

function TierBadge({ tier }: { tier: 1 | 2 | 3 }) {
  const label = tier === 1 ? "КР / FMF / ISUOG" : tier === 2 ? "PubMed" : "Консенсус";
  return (
    <Badge variant="outline" className="text-[10px]">
      Tier {tier} · {label}
    </Badge>
  );
}

function CitationCard({ c }: { c: EvidenceCitation }) {
  return (
    <Card className="border-[var(--clinical-border)]">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <TierBadge tier={c.tier} />
          {c.year ? <span className="text-[10px] text-[var(--clinical-foreground-muted)]">{c.year}</span> : null}
        </div>
        <CardTitle className="text-base">{c.title}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">{c.sourceLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{c.summary}</p>
        <p className="rounded-xl bg-[var(--clinical-primary-muted)]/40 p-3 text-xs leading-relaxed">
          <span className="font-semibold">На УЗИ: </span>
          {c.clinicalPearl}
        </p>
        <blockquote className="border-l-2 border-[var(--clinical-primary)] pl-3 text-xs italic text-[var(--clinical-foreground-muted)]">
          {c.excerpt}
        </blockquote>
        {c.relatedLinks && c.relatedLinks.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {c.relatedLinks.map((link: EvidenceRelatedLink) => (
              <Button key={link.href} variant="outline" size="sm" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>
        ) : null}
        {c.url ? (
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--clinical-primary)] hover:underline"
          >
            Источник <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function EvidenceWorkspace() {
  const [shelf, setShelf] = useState<EvidenceShelf>("us-fmf");

  const shelfMeta = useMemo(
    () => EVIDENCE_SHELVES.find((s: EvidenceShelfMeta) => s.id === shelf)!,
    [shelf],
  );

  const suggested = SUGGESTED_BY_SHELF[shelf];

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);

  const runSearch = useCallback(
    async (q: string, shelfId: EvidenceShelf = shelf) => {
      const trimmed = q.trim();
      if (trimmed.length < 2) {
        setError("Введите минимум 2 символа.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/evidence/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, shelf: shelfId, limit: 5 }),
        });
        const json = (await res.json()) as AskResponse & { error?: string };
        if (!res.ok) {
          setError(json.error ?? "Ошибка поиска");
          setResult(null);
          return;
        }
        setResult(json);
      } catch {
        setError("Нет связи с сервером.");
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [shelf],
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runSearch(query);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 lg:px-8">
      <header className="sonogyn-glass-card space-y-3 rounded-3xl p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            SonoEvidence
          </Badge>
          <Badge>{shelfMeta.label}</Badge>
        </div>
        <h1 className="sonogyn-gradient-text text-2xl font-black tracking-tight">
          Доказательная база
        </h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {shelfMeta.description} · активных полок: {ACTIVE_SHELVES.length} · {EVIDENCE_ENTRIES.length} тем.
        </p>
        <p className="text-[11px] text-[var(--clinical-foreground-muted)]">{EVIDENCE_DISCLAIMER}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {ACTIVE_SHELVES.map((s: EvidenceShelfMeta) => (
          <button
            key={s.id}
            type="button"
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              shelf === s.id
                ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)]/50 text-[var(--clinical-primary)]"
                : "border-[var(--clinical-border)] hover:border-[var(--clinical-primary)]",
            )}
            onClick={() => {
              setShelf(s.id);
              setResult(null);
              setError("");
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--clinical-foreground-muted)]" />
          <Input
            className="pl-9"
            placeholder={`Например: ${PLACEHOLDER_BY_SHELF[shelf]}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Найти"}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {suggested.map((s) => (
          <button
            key={s}
            type="button"
            className={cn(
              "rounded-full border border-[var(--clinical-border)] px-3 py-1 text-xs",
              "hover:border-[var(--clinical-primary)] hover:text-[var(--clinical-primary)]",
            )}
            onClick={() => {
              setQuery(s);
              void runSearch(s, shelf);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {result ? (
        <section className="space-y-4">
          <Card className="border-[var(--clinical-primary)]/30 bg-[var(--clinical-primary-muted)]/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookMarked className="h-4 w-4" />
                Вывод
              </CardTitle>
              <CardDescription>Запрос: «{result.query}»</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">{result.answerSummary}</CardContent>
          </Card>

          {result.citations.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-sm font-bold">Источники ({result.citations.length})</h2>
              {result.citations.map((c) => (
                <CitationCard key={c.entryId} c={c} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--clinical-foreground-muted)]">
              Совпадений нет — попробуйте другой синоним или откройте{" "}
              <Link
                href={FALLBACK_LINK_BY_SHELF[shelf].href}
                className="font-semibold text-[var(--clinical-primary)] underline"
              >
                {FALLBACK_LINK_BY_SHELF[shelf].label}
              </Link>
              .
            </p>
          )}

          <p className="text-[10px] text-[var(--clinical-foreground-muted)]">
            Корпус v{result.corpusVersion} · {result.disclaimer}
          </p>
        </section>
      ) : null}

      {EVIDENCE_SHELVES.some((s: EvidenceShelfMeta) => s.status === "planned") ? (
        <Card className="border-dashed border-[var(--clinical-border)]">
          <CardHeader>
            <CardTitle className="text-sm">Скоро по очереди</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {EVIDENCE_SHELVES.filter((s: EvidenceShelfMeta) => s.status === "planned").map((s: EvidenceShelfMeta) => (
              <Badge key={s.id} variant="secondary">
                {s.label}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
