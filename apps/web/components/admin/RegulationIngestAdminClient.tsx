"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type RegulationQueueRow = {
  id: string;
  source: string;
  title: string;
  source_url: string;
  status: string;
  fetched_at: string;
  raw_snippet: string | null;
};

export type RegulationExtractionRow = {
  id: string;
  queue_id: string;
  extracted_json: unknown;
  model: string | null;
  confidence: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type Props = {
  initialQueue: RegulationQueueRow[];
  initialExtractions: RegulationExtractionRow[];
};

export function RegulationIngestAdminClient({ initialQueue, initialExtractions }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const latestByQueue = useMemo(() => {
    const map = new Map<string, RegulationExtractionRow>();
    for (const ex of initialExtractions) {
      if (!map.has(ex.queue_id)) map.set(ex.queue_id, ex);
    }
    return map;
  }, [initialExtractions]);

  async function runIngestNow() {
    setBusy("ingest");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/regulations/run-ingest", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setMessage("Мониторинг источников завершён. Обновите список ниже.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function runImport() {
    setBusy("import");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/regulations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: importUrl.trim(),
          rawText: importText.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setMessage(`Добавлено в очередь: ${json.item?.title ?? "OK"}`);
      setImportUrl("");
      setImportText("");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function runExtract(queueId: string) {
    setBusy(queueId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/regulations/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setMessage(`AI-черновик: ${json.draftTitle} (${json.confidence})`);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function runPublish(queueId: string, extractionId: string) {
    setBusy(`pub-${queueId}`);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/regulations/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId, extractionId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      if (json.tsModule && typeof navigator?.clipboard?.writeText === "function") {
        await navigator.clipboard.writeText(json.tsModule);
        setMessage(`Опубликовано в Evidence (${json.guidelineId}). TS-модуль скопирован в буфер. ${json.hint ?? ""}`);
      } else {
        setMessage(`Опубликовано: ${json.guidelineId}. ${json.hint ?? ""}`);
      }
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function runReview(queueId: string, extractionId: string, decision: "approved" | "rejected") {
    setBusy(`${decision}-${queueId}`);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/regulations/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId, extractionId, decision }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setMessage(json.hint ?? `Статус: ${json.status}`);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border-[var(--clinical-border)]">
        <CardHeader>
          <CardTitle className="text-lg">Импорт вручную (URL или текст)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="https://cr.minzdrav.gov.ru/… или приказ"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            aria-label="URL документа"
          />
          <Textarea
            placeholder="Или вставьте фрагмент текста приказа/КР (≥40 символов)"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={4}
          />
          <Button type="button" disabled={busy !== null || !importUrl.trim()} onClick={runImport}>
            {busy === "import" ? "Загрузка…" : "В очередь"}
          </Button>
          <p className="text-xs text-[var(--clinical-foreground-muted)]">
            Учебный контент. AI-извлечение не публикуется автоматически — только после вашего review. Не
            заменяет официальный текст документа.
          </p>
        </CardContent>
      </Card>

      {message ? (
        <p className="rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy !== null} onClick={runIngestNow}>
          {busy === "ingest" ? "Мониторинг…" : "Запустить мониторинг источников"}
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/tools/refs/guidelines">Каталог guidelines →</Link>
        </Button>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
          Очередь ({initialQueue.length})
        </h2>
        {initialQueue.length === 0 ? (
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Пусто. Запустите cron <code className="text-xs">ingest-rf-regulations</code> или импорт URL выше.
          </p>
        ) : (
          initialQueue.map((row) => {
            const ex = latestByQueue.get(row.id);
            return (
              <Card key={row.id} className="border-[var(--clinical-border)]">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base leading-snug">{row.title}</CardTitle>
                      <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
                        {row.source} · {row.status} ·{" "}
                        <a href={row.source_url} className="underline" target="_blank" rel="noreferrer">
                          источник
                        </a>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busy !== null}
                        onClick={() => runExtract(row.id)}
                      >
                        {busy === row.id ? "AI…" : "Извлечь AI"}
                      </Button>
                      {ex && !ex.reviewed_at ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy !== null}
                            onClick={() => runReview(row.id, ex.id, "approved")}
                          >
                            Одобрить
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy !== null}
                            onClick={() => runReview(row.id, ex.id, "rejected")}
                          >
                            Отклонить
                          </Button>
                        </>
                      ) : null}
                      {ex && row.status === "approved" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          disabled={busy !== null}
                          onClick={() => runPublish(row.id, ex.id)}
                        >
                          {busy === `pub-${row.id}` ? "…" : "Опубликовать в Evidence"}
                        </Button>
                      ) : null}
                      {row.status === "published" ? (
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">published</span>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {row.raw_snippet ? (
                    <p className="line-clamp-3 text-xs text-[var(--clinical-foreground-muted)]">{row.raw_snippet}</p>
                  ) : null}
                  {ex ? (
                    <pre className="max-h-64 overflow-auto rounded-lg bg-black/[0.04] p-3 text-[11px] leading-relaxed dark:bg-white/[0.06]">
                      {JSON.stringify(ex.extracted_json, null, 2)}
                    </pre>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
