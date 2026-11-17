"use client";

import { useState } from "react";
import Link from "next/link";

import {
  formatRetrieveResultForAssistant,
  type MedicalKnowledgeRetrieveResult,
} from "@repo/medical-knowledge";

import { ClinicalGuide } from "@/components/medical-knowledge/ClinicalGuide";
import { SourceCard } from "@/components/medical-knowledge/SourceCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "all" | "emergency" | "gynecology";

export default function MedicalKnowledgeAssistantPage() {
  const [query, setQuery] = useState("инфаркт");
  const [mode, setMode] = useState<Mode>("emergency");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedicalKnowledgeRetrieveResult | null>(null);
  const [error, setError] = useState("");
  const [assistantDraft, setAssistantDraft] = useState("");

  async function onAsk() {
    setLoading(true);
    setError("");
    try {
      const specialty = mode === "all" ? undefined : mode;
      const res = await fetch("/api/medical-knowledge/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, specialty, limit: 5 }),
      });
      const json = (await res.json()) as MedicalKnowledgeRetrieveResult & { error?: string };
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Ошибка запроса");
        setResult(null);
        setAssistantDraft("");
        return;
      }
      setResult(json);
      setAssistantDraft(formatRetrieveResultForAssistant(json));
    } finally {
      setLoading(false);
    }
  }

  const article = result?.canonicalResults[0] ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <Badge variant="outline">KB · движок помощника</Badge>
        <h1 className="text-3xl font-bold">База знаний врача</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Своя KB (не интернет): запрос → карточка «флаги / 1-2-3 / эскалация» + источник. Полный корпус
          справочника — локально в проекте (`medical-knowledge/data/emergency-corpus`); в публичный деплой
          текст книги не уезжает.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["emergency", "Неотложка"],
            ["gynecology", "Гинекология"],
            ["all", "Вся KB"],
          ] as const
        ).map(([id, label]) => (
          <Button key={id} size="sm" variant={mode === id ? "default" : "outline"} onClick={() => setMode(id)}>
            {label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Например: инсульт, инфаркт, ТЭЛА, анафилаксия…"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") void onAsk();
          }}
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
          <ClinicalGuide article={article} relatedLinks={[]} />
          {result?.sourceMetadata.map((source) => (
            <SourceCard key={source.id} source={source} usedFor={article.title} />
          ))}
        </>
      ) : result ? (
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          {result.draftDisclaimer} Уверенность: {result.confidence}.
        </p>
      ) : null}

      {assistantDraft ? (
        <div className="sonogyn-glass-card space-y-2 rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold">Черновик для движка помощника</p>
            <Button size="sm" variant="secondary" onClick={() => void navigator.clipboard.writeText(assistantDraft)}>
              Копировать
            </Button>
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900/5 p-3 text-xs leading-relaxed dark:bg-white/5">
            {assistantDraft}
          </pre>
        </div>
      ) : null}

      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        <Link href="/privacy" className="underline underline-offset-2">
          Политика конфиденциальности
        </Link>
        · не диагноз, интерпретация — специалист ·{" "}
        <Link href="/tools/refs/guidelines" className="underline underline-offset-2">
          КР и приказы
        </Link>
      </p>
    </div>
  );
}
