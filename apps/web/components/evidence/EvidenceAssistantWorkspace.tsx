"use client";

import type {
  AssistantAnswer,
  EvidenceCorpusMode,
  EvidenceRecord,
  UnifiedSearchResult,
} from "@repo/evidence-retrieval";
import {
  EVIDENCE_CORPUS_MODE_LABELS,
  EVIDENCE_CORPUS_MODES,
  formatEvidenceAnswerForClipboard,
} from "@repo/evidence-retrieval";
import { Copy, ExternalLink, Loader2, Search, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

const STRENGTH_STYLE: Record<AssistantAnswer["evidenceStrength"], string> = {
  high: "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300",
  moderate: "bg-amber-600/15 text-amber-900 dark:text-amber-200",
  low: "bg-orange-600/15 text-orange-900 dark:text-orange-200",
  insufficient: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
};

const PROVIDER_LABEL: Record<string, string> = {
  pubmed: "PubMed",
  europe_pmc: "Europe PMC",
  cochrane: "Cochrane",
  semantic_scholar: "Semantic Scholar",
  clinical_trials: "ClinicalTrials.gov",
  kr_mz_rf: "КР МЗ РФ",
  static_corpus: "SonoEvidence",
  openfda: "OpenFDA",
  dailymed: "DailyMed",
  who: "WHO",
  nice: "NICE",
  ema: "EMA",
};

type BookmarkRow = {
  id: string;
  record_id: string;
  provider: string;
  title: string;
  url: string;
  created_at: string;
};

type HistoryRow = {
  id: string;
  query: string;
  sources: string[];
  result_count: number;
  synthesis_mode: string;
  evidence_strength: string | null;
  created_at: string;
};

type EvidenceAssistantAnswer = AssistantAnswer & {
  sourceTranslations?: { id: string; titleRu: string; keyPointRu: string }[];
};

const SUGGESTED = [
  "O-RADS 3 тактика наблюдения",
  "Миома матки УЗИ диагностика",
  "Амоксициллин при беременности — доказательства",
  "Преэклампсия профилактика аспирин",
  "Скрининг I триместра ISUOG 2023",
];

const CORPUS_HINT: Record<EvidenceCorpusMode, string> = {
  all: "PubMed, Cochrane, КР МЗ РФ, WHO/NICE и др.",
  rf_kr: "Только клинические рекомендации МЗ РФ — со ссылкой на раздел.",
  rf_npa: "Приказы ДЗМ / МЗ РФ (НПА).",
  rf_all: "КР + приказы + протоколы РФ (без PubMed).",
};

function RecordRow({
  record,
  bookmarked,
  onToggleBookmark,
}: {
  record: EvidenceRecord;
  bookmarked?: boolean;
  onToggleBookmark?: (record: EvidenceRecord) => void;
}) {
  return (
    <li className="rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-surface)] p-3">
      <div className="flex flex-wrap items-start gap-2">
        <Badge variant="outline" className="text-[10px]">
          {PROVIDER_LABEL[record.provider] ?? record.provider}
        </Badge>
        {record.year ? (
          <span className="text-[10px] text-[var(--clinical-foreground-muted)]">{record.year}</span>
        ) : null}
        {record.evidenceLevel ? (
          <Badge variant="secondary" className="text-[10px]">
            Level {record.evidenceLevel}
          </Badge>
        ) : null}
        {onToggleBookmark ? (
          <button
            type="button"
            onClick={() => onToggleBookmark(record)}
            className="ml-auto rounded p-1 text-[var(--clinical-foreground-muted)] transition hover:text-amber-500"
            aria-label={bookmarked ? "Убрать из закладок" : "В закладки"}
          >
            <Star className={cn("h-4 w-4", bookmarked && "fill-amber-500 text-amber-500")} />
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-sm font-medium leading-snug">{record.title}</p>
      {record.section ? (
        <p className="mt-1 text-xs font-medium text-[var(--clinical-primary)]">Раздел: {record.section}</p>
      ) : null}
      {record.quote ? (
        <p className="mt-1 line-clamp-4 text-xs italic text-[var(--clinical-foreground-muted)]">
          «{record.quote}»
        </p>
      ) : record.abstract ? (
        <p className="mt-1 line-clamp-3 text-xs text-[var(--clinical-foreground-muted)]">{record.abstract}</p>
      ) : null}
      <a
        href={record.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--clinical-primary)] underline"
      >
        Источник <ExternalLink className="h-3 w-3" />
      </a>
    </li>
  );
}

/** Dev-only mock states for UI screenshots (?demo=idle|success|empty|search|loading). */
function applyDemoState(
  demo: string | null,
  setters: {
    setQuery: (v: string) => void;
    setMode: (v: "assistant" | "search") => void;
    setCorpusMode: (v: EvidenceCorpusMode) => void;
    setAnswer: (v: EvidenceAssistantAnswer | null) => void;
    setSearchResult: (v: UnifiedSearchResult | null) => void;
    setLoading: (v: boolean) => void;
    setError: (v: string | null) => void;
    setHistory: (v: HistoryRow[]) => void;
  },
) {
  if (process.env.NODE_ENV !== "development" || !demo) return;
  setters.setError(null);
  setters.setLoading(demo === "loading");
  setters.setCorpusMode("rf_kr");

  if (demo === "idle" || demo === "loading") {
    setters.setQuery(demo === "loading" ? "O-RADS 3 тактика наблюдения" : "");
    setters.setMode("assistant");
    setters.setAnswer(null);
    setters.setSearchResult(null);
    return;
  }

  if (demo === "empty") {
    setters.setQuery("zzzz несуществующий запрос xyz");
    setters.setMode("assistant");
    setters.setSearchResult(null);
    setters.setAnswer({
      query: "zzzz несуществующий запрос xyz",
      summary:
        "В режиме «КР МЗ РФ» по запросу «zzzz несуществующий запрос xyz» релевантных документов не найдено. Ответ не сформирован — нет данных в выбранном корпусе. Уточните формулировку или переключитесь на «Все источники».",
      evidenceStrength: "insufficient",
      gradeLabel: "Недостаточно данных",
      recommendations: [],
      contraindications: [],
      alternatives: [],
      citations: [],
      guidelines: [],
      disclaimers: [
        "Справочная информация (CDS). Не заменяет клиническое суждение врача. Проверяйте первоисточники и локальные протоколы.",
      ],
      sourcesUsed: { kr_mz_rf: "ok" },
      searchedAt: new Date().toISOString(),
      synthesisMode: "rules",
      corpusMode: "rf_kr",
    });
    return;
  }

  if (demo === "search") {
    setters.setQuery("миома матки УЗИ");
    setters.setMode("search");
    setters.setAnswer(null);
    setters.setSearchResult({
      query: "миома матки УЗИ",
      totalBeforeDedup: 2,
      searchedAt: new Date().toISOString(),
      providers: [{ provider: "kr_mz_rf", status: "ok", records: [], latencyMs: 12 }],
      records: [
        {
          id: "kr_mz_rf:kr-mz-myoma",
          provider: "kr_mz_rf",
          sourceId: "kr-mz-myoma",
          recordType: "guideline",
          title: "Лейомиома матки",
          abstract: "Диагностика, наблюдение и лечение миомы матки. УЗИ, FIGO, тактика.",
          year: 2024,
          url: "https://cr.minzdrav.gov.ru/",
          evidenceLevel: "I",
          retrievedAt: new Date().toISOString(),
          relevanceScore: 0.9,
          section: "Диагностика (УЗИ)",
          quote: "ТВ-УЗИ — метод первой линии; оценка количества, размеров, локализации узлов (FIGO).",
          guidelineShelf: "kr_mz_rf",
        },
      ],
    });
    return;
  }

  if (demo === "success") {
    setters.setQuery("O-RADS 3 тактика наблюдения");
    setters.setMode("assistant");
    setters.setSearchResult(null);
    setters.setHistory([
      {
        id: "demo-h1",
        query: "O-RADS 3 тактика наблюдения",
        sources: ["kr_mz_rf"],
        result_count: 1,
        synthesis_mode: "rules",
        evidence_strength: "moderate",
        created_at: new Date().toISOString(),
      },
    ]);
    setters.setAnswer({
      query: "O-RADS 3 тактика наблюдения",
      summary:
        "По запросу «O-RADS 3 тактика наблюдения» найдено 1 релевантных источников (умеренная сила).\n\nКлючевые источники:\n1. Ультразвуковая диагностика в гинекологии (обобщающие КР) (2024) · O-RADS / IOTA — тактика\n   «O-RADS 3: низкий риск — наблюдение по локальному протоколу; при росте или новых признаках — повторная оценка / эскалация.»",
      evidenceStrength: "moderate",
      gradeLabel: "Умеренная сила доказательств",
      recommendations: [
        "Ориентируйтесь на действующие КР/НПА (1 найдено) — см. разделы в цитатах.",
      ],
      contraindications: [],
      alternatives: [],
      citations: [
        {
          id: "kr_mz_rf:kr-mz-gynecologic-us",
          provider: "kr_mz_rf",
          sourceId: "kr-mz-gynecologic-us",
          recordType: "guideline",
          title: "Ультразвуковая диагностика в гинекологии (обобщающие КР)",
          abstract: "Стандарт описания органов малого таза, IOTA, O-RADS, документирование.",
          year: 2024,
          url: "https://cr.minzdrav.gov.ru/",
          evidenceLevel: "I",
          retrievedAt: new Date().toISOString(),
          relevanceScore: 0.95,
          section: "O-RADS / IOTA — тактика",
          quote:
            "O-RADS 3: низкий риск — наблюдение по локальному протоколу; при росте или новых признаках — повторная оценка / эскалация.",
          guidelineShelf: "kr_mz_rf",
        },
      ],
      guidelines: [
        {
          title: "Ультразвуковая диагностика в гинекологии (обобщающие КР)",
          url: "https://cr.minzdrav.gov.ru/",
          org: "МЗ РФ",
          section: "O-RADS / IOTA — тактика",
        },
      ],
      disclaimers: [
        "Справочная информация (CDS). Не заменяет клиническое суждение врача. Проверяйте первоисточники и локальные протоколы.",
      ],
      sourcesUsed: { kr_mz_rf: "ok" },
      searchedAt: new Date().toISOString(),
      synthesisMode: "rules",
      corpusMode: "rf_kr",
    });
  }
}

export function EvidenceAssistantWorkspace() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"assistant" | "search">("assistant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<EvidenceAssistantAnswer | null>(null);
  const [searchResult, setSearchResult] = useState<UnifiedSearchResult | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [rateLimitHint, setRateLimitHint] = useState<string | null>(null);
  const [translateToRussian, setTranslateToRussian] = useState(true);
  const [corpusMode, setCorpusMode] = useState<EvidenceCorpusMode>("rf_kr");

  const loadBookmarks = useCallback(async () => {
    try {
      const res = await fetch("/api/evidence/bookmarks", { credentials: "same-origin" });
      if (!res.ok) return;
      const data = (await res.json()) as { bookmarks?: BookmarkRow[] };
      const rows = data.bookmarks ?? [];
      setBookmarks(rows);
      setBookmarkIds(new Set(rows.map((b) => b.record_id)));
    } catch {
      /* guest or offline */
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/evidence/history?limit=15", { credentials: "same-origin" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        history?: HistoryRow[];
        rateLimitHint?: { assistantLimit: number; assistantWindowSec: number };
      };
      setHistory(data.history ?? []);
      if (data.rateLimitHint) {
        setRateLimitHint(
          `Лимит: до ${data.rateLimitHint.assistantLimit} запросов / ${data.rateLimitHint.assistantWindowSec} с на пользователя.`,
        );
      }
    } catch {
      /* guest or offline */
    }
  }, []);

  useEffect(() => {
    void loadBookmarks();
    void loadHistory();
  }, [loadBookmarks, loadHistory]);

  useEffect(() => {
    applyDemoState(searchParams.get("demo"), {
      setQuery,
      setMode,
      setCorpusMode,
      setAnswer,
      setSearchResult,
      setLoading,
      setError,
      setHistory,
    });
  }, [searchParams]);

  const toggleBookmark = useCallback(
    async (record: EvidenceRecord) => {
      const isSaved = bookmarkIds.has(record.id);
      try {
        if (isSaved) {
          const res = await fetch(
            `/api/evidence/bookmarks?recordId=${encodeURIComponent(record.id)}`,
            { method: "DELETE", credentials: "same-origin" },
          );
          if (!res.ok) throw new Error("Не удалось удалить закладку");
          setBookmarkIds((prev) => {
            const next = new Set(prev);
            next.delete(record.id);
            return next;
          });
          setBookmarks((prev) => prev.filter((b) => b.record_id !== record.id));
          toast.success("Удалено из закладок");
        } else {
          const res = await fetch("/api/evidence/bookmarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              recordId: record.id,
              provider: record.provider,
              title: record.title,
              url: record.url,
              payload: { year: record.year, recordType: record.recordType },
            }),
          });
          const data = (await res.json()) as { bookmark?: BookmarkRow; error?: string };
          if (!res.ok) throw new Error(data.error ?? "Не удалось сохранить");
          if (data.bookmark) {
            setBookmarks((prev) => [data.bookmark!, ...prev]);
            setBookmarkIds((prev) => new Set(prev).add(record.id));
          }
          toast.success("Добавлено в закладки");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Ошибка закладок");
      }
    },
    [bookmarkIds],
  );

  const runAssistant = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    setAnswer(null);
    setSearchResult(null);
    try {
      const res = await fetch("/api/evidence/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, useLlm: true, translateToRussian, corpusMode }),
      });
      const data = (await res.json()) as EvidenceAssistantAnswer & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setAnswer(data);
      void loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка запроса");
    } finally {
      setLoading(false);
    }
  }, [translateToRussian, corpusMode, loadHistory]);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    setAnswer(null);
    setSearchResult(null);
    try {
      const params = new URLSearchParams({ q, limit: "25", corpusMode });
      const res = await fetch(`/api/evidence/search?${params.toString()}`);
      const data = (await res.json()) as UnifiedSearchResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSearchResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка поиска");
    } finally {
      setLoading(false);
    }
  }, [corpusMode]);

  const copyAnswer = useCallback(async () => {
    if (!answer) return;
    try {
      await navigator.clipboard.writeText(formatEvidenceAnswerForClipboard(answer));
      toast.success("Карточка ответа скопирована");
    } catch {
      toast.error("Не удалось скопировать");
    }
  }, [answer]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3) return;
    if (mode === "assistant") void runAssistant(q);
    else void runSearch(q);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-[var(--clinical-primary)]" />
          <h1 className="text-2xl font-semibold tracking-tight">Evidence Assistant</h1>
        </div>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Навигатор по КР/НПА и литературе: ответ со ссылкой на раздел источника. Режим «КР МЗ РФ» — как IQDOC, но
          глубже в УЗИ/АГ.
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          <Link href="/tools/refs/evidence" className="underline">
            SonoEvidence · база знаний
          </Link>{" "}
          — статический корпус; здесь — live-retrieval + AI-резюме.
        </p>
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
          CDS / справочная помощь. Не ставит диагноз и не заменяет клиническое решение специалиста.
          {rateLimitHint ? ` ${rateLimitHint}` : ""}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={mode === "assistant" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("assistant")}
        >
          AI-ассистент
        </Button>
        <Button
          type="button"
          variant={mode === "search" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("search")}
        >
          Unified search
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
          Корпус
        </p>
        <div className="flex flex-wrap gap-2">
          {EVIDENCE_CORPUS_MODES.map((m) => (
            <Button
              key={m}
              type="button"
              variant={corpusMode === m ? "default" : "outline"}
              size="sm"
              onClick={() => setCorpusMode(m)}
            >
              {EVIDENCE_CORPUS_MODE_LABELS[m]}
            </Button>
          ))}
        </div>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">{CORPUS_HINT[corpusMode]}</p>
      </div>

      {mode === "assistant" ? (
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={translateToRussian}
            onChange={(event) => setTranslateToRussian(event.target.checked)}
          />
          <span>Русский перевод источников</span>
        </label>
      ) : null}

      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Например: амоксициллин при беременности"
          className="flex-1"
          maxLength={800}
        />
        <Button type="submit" disabled={loading || query.trim().length < 3}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">{mode === "assistant" ? "Спросить" : "Искать"}</span>
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED.map((s) => (
          <button
            key={s}
            type="button"
            className="rounded-full border border-[var(--clinical-border)] px-3 py-1 text-xs hover:bg-[var(--clinical-surface)]"
            onClick={() => {
              setQuery(s);
              if (mode === "assistant") void runAssistant(s);
              else void runSearch(s);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {answer ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">Ответ</CardTitle>
              <Badge className={cn("text-xs", STRENGTH_STYLE[answer.evidenceStrength])}>
                {answer.gradeLabel}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {answer.synthesisMode === "llm" ? "AI + citations" : "rules"}
              </Badge>
              {answer.corpusMode ? (
                <Badge variant="outline" className="text-[10px]">
                  {EVIDENCE_CORPUS_MODE_LABELS[answer.corpusMode]}
                </Badge>
              ) : null}
              <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={() => void copyAnswer()}>
                <Copy className="mr-1 h-3.5 w-3.5" />
                Копировать
              </Button>
            </div>
            <CardDescription>{answer.query}</CardDescription>
          </CardHeader>
          {answer.citations.length === 0 ? (
            <CardContent className="space-y-2">
              <p className="rounded-lg border border-zinc-300/60 bg-zinc-500/10 px-3 py-3 text-sm whitespace-pre-wrap">
                {answer.summary}
              </p>
              <p className="text-xs text-[var(--clinical-foreground-muted)]">
                Честный empty-state: без документов в выбранном корпусе ответ не выдумывается.
              </p>
            </CardContent>
          ) : (
            <CardContent className="space-y-4 text-sm whitespace-pre-wrap">{answer.summary}</CardContent>
          )}
          {answer.recommendations.length > 0 ? (
            <CardContent className="border-t pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
                Рекомендации
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {answer.recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </CardContent>
          ) : null}
          {answer.contraindications.length > 0 ? (
            <CardContent className="border-t pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">Противопоказания / осторожность</p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {answer.contraindications.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </CardContent>
          ) : null}
          {answer.guidelines.length > 0 ? (
            <CardContent className="border-t pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
                Клинические рекомендации
              </p>
              <ul className="space-y-2">
                {answer.guidelines.map((g) => (
                  <li key={g.url}>
                    <a href={g.url} target="_blank" rel="noopener noreferrer" className="text-sm underline">
                      {g.title}
                    </a>
                    <span className="ml-2 text-xs text-[var(--clinical-foreground-muted)]">{g.org}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          ) : null}
          {answer.sourceTranslations?.length ? (
            <CardContent className="border-t pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
                Перевод / пояснение источников
              </p>
              <ul className="space-y-2">
                {answer.sourceTranslations.map((item) => {
                  const source = answer.citations.find((c) => c.id === item.id);
                  return (
                    <li
                      key={item.id}
                      className="rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-3"
                    >
                      <p className="text-sm font-semibold">{item.titleRu}</p>
                      <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
                        {item.keyPointRu}
                      </p>
                      {source ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--clinical-primary)] underline"
                        >
                          Оригинал <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[11px] text-[var(--clinical-foreground-muted)]">
                Это русский перевод-пояснение по названию/резюме источника; юридически и научно первичным остаётся оригинал по ссылке.
              </p>
            </CardContent>
          ) : null}
          <CardContent className="border-t pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
              Цитаты ({answer.citations.length})
            </p>
            {answer.citations.length === 0 ? (
              <p className="text-sm text-[var(--clinical-foreground-muted)]">
                Источники не найдены. Смените корпус на «Все источники» или уточните вопрос.
              </p>
            ) : (
              <ul className="space-y-2">
                {answer.citations.map((c) => (
                  <RecordRow
                    key={c.id}
                    record={c}
                    bookmarked={bookmarkIds.has(c.id)}
                    onToggleBookmark={toggleBookmark}
                  />
                ))}
              </ul>
            )}
          </CardContent>
          <CardContent className="border-t space-y-1 pt-2 text-[11px] text-[var(--clinical-foreground-muted)]">
            {answer.disclaimers.map((d) => (
              <p key={d}>{d}</p>
            ))}
            <p>Не диагноз. Интерпретация и решение — за лечащим врачом.</p>
          </CardContent>
        </Card>
      ) : null}

      {history.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">История запросов</CardTitle>
            <CardDescription>Последние вопросы к Evidence Assistant (только ваши)</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-[var(--clinical-border)] px-3 py-2 text-left text-sm hover:bg-[var(--clinical-surface)]"
                    onClick={() => {
                      setQuery(h.query);
                      setMode("assistant");
                      void runAssistant(h.query);
                    }}
                  >
                    <span className="font-medium">{h.query}</span>
                    <span className="mt-1 block text-[11px] text-[var(--clinical-foreground-muted)]">
                      {new Date(h.created_at).toLocaleString("ru-RU")} · {h.synthesis_mode}
                      {h.evidence_strength ? ` · ${h.evidence_strength}` : ""} · цитат: {h.result_count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {searchResult ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Результаты поиска</CardTitle>
            <CardDescription>
              {searchResult.records.length} записей · до dedup: {searchResult.totalBeforeDedup} ·{" "}
              {EVIDENCE_CORPUS_MODE_LABELS[corpusMode]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchResult.records.length === 0 ? (
              <p className="rounded-lg border border-zinc-300/60 bg-zinc-500/10 px-3 py-3 text-sm">
                В выбранном корпусе совпадений нет. Ответ не формируется без источников.
              </p>
            ) : (
              <ul className="space-y-2">
                {searchResult.records.map((r) => (
                  <RecordRow
                    key={r.id}
                    record={r}
                    bookmarked={bookmarkIds.has(r.id)}
                    onToggleBookmark={toggleBookmark}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      {bookmarks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Закладки</CardTitle>
            <CardDescription>{bookmarks.length} сохранённых источников</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {bookmarks.map((b) => (
                <li
                  key={b.id}
                  className="flex items-start gap-2 rounded-lg border border-[var(--clinical-border)] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <Badge variant="outline" className="text-[10px]">
                      {PROVIDER_LABEL[b.provider] ?? b.provider}
                    </Badge>
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-sm font-medium underline"
                    >
                      {b.title}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void toggleBookmark({
                        id: b.record_id,
                        provider: b.provider as EvidenceRecord["provider"],
                        title: b.title,
                        url: b.url,
                      } as EvidenceRecord)
                    }
                    className="shrink-0 rounded p-1 text-amber-500"
                    aria-label="Убрать из закладок"
                  >
                    <Star className="h-4 w-4 fill-amber-500" />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
