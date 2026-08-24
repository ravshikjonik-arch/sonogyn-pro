"use client";

import { useState } from "react";

import type { MedicalKnowledgeRetrieveResult } from "@repo/medical-knowledge";

import { ClinicalGuide } from "@/components/medical-knowledge/ClinicalGuide";
import { SourceCard } from "@/components/medical-knowledge/SourceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function MedicalKnowledgeAssistantPage() {
  const [query, setQuery] = useState("УЗ-признаки эндометриоидной кисты");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedicalKnowledgeRetrieveResult | null>(null);
  const [error, setError] = useState("");

  async function onAsk() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/medical-knowledge/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, specialty: "gynecology", limit: 5 }),
      });
      const json = (await res.json()) as MedicalKnowledgeRetrieveResult & { error?: string };
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Ошибка запроса");
        setResult(null);
        return;
      }
      setResult(json);
    } finally {
      setLoading(false);
    }
  }

  const article = result?.canonicalResults[0] ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--clinical-primary-deep)]">
          Medical Knowledge Assistant
        </p>
        <h1 className="text-3xl font-bold">Справочник для врача</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Структурированный ответ своими словами + библиографическая атрибуция. PDF и исходники
          недоступны.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Например: УЗ-признаки эндометриоидной кисты"
          className="flex-1"
        />
        <Button onClick={() => void onAsk()} disabled={loading || query.trim().length < 2}>
          {loading ? "Поиск…" : "Спросить"}
        </Button>
      </div>

      {error ? <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}

      {result?.conflicts.length ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {result.draftDisclaimer}
        </p>
      ) : null}

      {article ? (
        <>
          <ClinicalGuide
            article={article}
            relatedLinks={[
              { href: "/tools/calc/rads/o-rads", label: "Открыть O-RADS" },
              { href: "/tools/refs/clinical-guide/endometrioma-demo", label: "Подробнее" },
            ]}
          />
          {result?.sourceMetadata.map((source) => (
            <SourceCard key={source.id} source={source} usedFor={article.title} />
          ))}
        </>
      ) : result ? (
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          {result.draftDisclaimer} Уверенность: {result.confidence}.
        </p>
      ) : null}

      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        <Link href="/privacy" className="underline underline-offset-2">
          Политика конфиденциальности
        </Link>
        · не диагноз, интерпретация — специалист.
      </p>
    </div>
  );
}
