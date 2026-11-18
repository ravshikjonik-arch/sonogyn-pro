"use client";

import {
  pickPreferredEmergencyArticle,
  type MedicalKnowledgeRetrieveResult,
} from "@repo/medical-knowledge";
import { HeartPulse } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { EmergencyClinicalGuide } from "@/components/clinical-assistant/EmergencyClinicalGuide";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QUICK = [
  "инфаркт",
  "инсульт",
  "тэла",
  "аритмия",
  "остановка сердца",
  "анафилаксия",
  "астма",
  "пневмоторакс",
  "шок",
  "кровотечение",
  "внематочная",
  "судороги",
  "чмт",
  "отравление",
  "угарный газ",
  "температура",
] as const;

type Props = {
  initialQuery?: string;
};

export function EmergencyAssistantClient({ initialQuery = "" }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MedicalKnowledgeRetrieveResult | null>(null);
  const [activeQ, setActiveQ] = useState(initialQuery.trim().toLowerCase());

  const ask = useCallback(
    async (raw: string, syncUrl = true) => {
      const q = raw.trim();
      if (q.length < 2) return;
      setQuery(q);
      setActiveQ(q.toLowerCase());
      setLoading(true);
      setError("");
      if (syncUrl) {
        router.replace(`/tools/emergency?q=${encodeURIComponent(q)}`, { scroll: false });
      }
      try {
        const res = await fetch("/api/medical-knowledge/retrieve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, specialty: "emergency", limit: 8 }),
        });
        const json = (await res.json()) as MedicalKnowledgeRetrieveResult & {
          error?: string;
          ok?: boolean;
        };
        if (!res.ok) {
          setError(typeof json.error === "string" ? json.error : "Ошибка запроса");
          setResult(null);
          return;
        }
        setResult(json);
      } catch {
        setError("Сеть недоступна. Проверьте соединение и повторите.");
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      void ask(initialQuery, false);
    }
  }, [initialQuery, ask]);

  const article = result ? pickPreferredEmergencyArticle(result.canonicalResults) : null;
  const others =
    result?.canonicalResults.filter((a) => a.id !== article?.id).slice(0, 4) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 pb-28">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/home">← Разделы</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/tools/refs/guidelines">КР и приказы</Link>
        </Button>
      </div>

      <header className="space-y-2 rounded-2xl border border-rose-200/80 bg-gradient-to-br from-red-900 to-rose-700 px-4 py-4 text-white sm:px-5 dark:border-rose-900">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 shrink-0" aria-hidden />
          <Badge className="bg-white/20 text-white hover:bg-white/25">Неотложка · СМП</Badge>
        </div>
        <h1 className="text-xl font-black tracking-tight sm:text-2xl">Неотложка · СМП</h1>
        <p className="text-sm text-white/90">
          Слово → готовый гайд: симптомы, анализы, действия, препараты. Своя KB +
          полка КР. Не диагноз. Не вводите ПДн пациентов.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="инфаркт, инсульт, остановка сердца, кровотечение…"
          aria-label="Запрос к базе неотложки"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") void ask(query);
          }}
        />
        <Button onClick={() => void ask(query)} disabled={loading || query.trim().length < 2}>
          {loading ? "Ищем…" : "Спросить"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Быстрые темы">
        {QUICK.map((q) => {
          const active = activeQ === q || activeQ.includes(q);
          return (
            <Button
              key={q}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className="rounded-full"
              aria-pressed={active}
              onClick={() => void ask(q)}
            >
              {q}
            </Button>
          );
        })}
      </div>

      {!result && !loading && !error ? (
        <p className="rounded-xl border border-dashed border-[var(--clinical-border)] p-4 text-sm text-[var(--clinical-foreground-muted)]">
          Выберите тему выше или введите состояние — откроется структурированный гайд для врача.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      {result?.conflicts.length ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {result.draftDisclaimer}
        </p>
      ) : null}

      {article ? <EmergencyClinicalGuide article={article} /> : null}

      {!article && result && !loading ? (
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          {result.draftDisclaimer} Уверенность: {result.confidence}.
        </p>
      ) : null}

      {others.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--clinical-foreground-muted)]">Ещё по запросу</h2>
          <ul className="overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]">
            {others.map((a, i) => (
              <li key={a.id} className={i > 0 ? "border-t border-[var(--clinical-border)]" : undefined}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-[var(--clinical-muted)]"
                  onClick={() => void ask(a.aliases?.[0] ?? a.title)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{a.title}</span>
                    <span className="mt-0.5 block text-xs text-[var(--clinical-foreground-muted)]">
                      {a.summary.slice(0, 110)}
                      {a.summary.length > 110 ? "…" : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
