"use client";

import { Brain, CheckSquare, Download, Loader2, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { US_DOMAIN_LABELS } from "@/lib/ai/us-vision/infer-domain";
import type { UsVisionAnalysisResult } from "@/lib/ai/us-vision/types";
import type { CaseMediaRow } from "@/lib/supabase/case-media-storage";

type Props = {
  caseId: string;
  canAnalyze: boolean;
};

type AnalysisPoll = {
  id: string;
  status: string;
  results: UsVisionAnalysisResult | null;
  error_message: string | null;
};

function hasSonoNet(result: UsVisionAnalysisResult): boolean {
  return (
    result.sononetAvailable === true ||
    (result.cvModels?.some((m) => m.toLowerCase().includes("sononet")) ?? false) ||
    result.frames.some((f) => f.sononet != null)
  );
}

function downloadMarkdown(markdown: string, caseId: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sonogyn-ai-${caseId.slice(0, 8)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CaseAiAnalysisPanel({ caseId, canAnalyze }: Props) {
  const supabase = useSupabase();
  const [media, setMedia] = useState<CaseMediaRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [result, setResult] = useState<UsVisionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshMedia = useCallback(async () => {
    setLoadingMedia(true);
    const { data, error: qErr } = await supabase
      .from("case_media")
      .select("id,case_id,storage_path,media_type,order_index,uploaded_at")
      .eq("case_id", caseId)
      .order("order_index", { ascending: true });
    if (qErr) {
      toast.error("Не удалось загрузить список снимков");
      setMedia([]);
    } else {
      const rows = (data ?? []) as CaseMediaRow[];
      setMedia(rows);
      setSelected(new Set(rows.map((r) => r.id)));
    }
    setLoadingMedia(false);
  }, [caseId, supabase]);

  useEffect(() => {
    queueMicrotask(() => void refreshMedia());
  }, [refreshMedia]);

  const allSelected = useMemo(
    () => media.length > 0 && media.every((m) => selected.has(m.id)),
    [media, selected],
  );

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(media.map((m) => m.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function pollJob(id: string) {
    setPolling(true);
    setError(null);
    for (let i = 0; i < 45; i += 1) {
      const res = await fetch(`/api/ai/analyze/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Ошибка опроса (${res.status})`);
        setPolling(false);
        return;
      }
      const body = (await res.json()) as { analysis: AnalysisPoll };
      const analysis = body.analysis;
      if (analysis.status === "completed" && analysis.results) {
        setResult(analysis.results as UsVisionAnalysisResult);
        setPolling(false);
        toast.success("ИИ-разбор готов");
        return;
      }
      if (analysis.status === "failed") {
        setError(analysis.error_message ?? "Анализ не удался");
        setPolling(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setError("Таймаут ожидания — обновите страницу позже");
    setPolling(false);
  }

  async function onAnalyze() {
    const mediaIds = Array.from(selected);
    if (mediaIds.length === 0) {
      toast.error("Выберите хотя бы один снимок");
      return;
    }
    setResult(null);
    setError(null);
    setJobId(null);

    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, mediaIds }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      jobId?: string;
      error?: string;
    };

    if (res.status === 402) {
      setError("Нужна подписка PRO или активный trial.");
      toast.error("ИИ-разбор доступен в PRO");
      return;
    }

    if (!res.ok || !body.jobId) {
      setError(body.error ?? "Не удалось запустить анализ");
      toast.error(body.error ?? "Ошибка запуска");
      return;
    }

    setJobId(body.jobId);
    toast.message("ИИ анализирует снимки…");
    await pollJob(body.jobId);
  }

  if (!canAnalyze) return null;

  const sononetUsed = result ? hasSonoNet(result) : false;

  return (
    <Card className="border-[var(--clinical-border)]">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-[var(--clinical-primary-deep)]" />
          ИИ-разбор снимков
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {result?.reportMarkdown ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => downloadMarkdown(result.reportMarkdown!, caseId)}
            >
              <Download className="mr-2 h-4 w-4" />
              Отчёт .md
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            disabled={polling || loadingMedia || media.length === 0}
            onClick={() => void onAnalyze()}
          >
            {polling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Анализ…
              </>
            ) : (
              "Запустить (PRO)"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Черновик ассистента: плоскости, BI-RADS/O-RADS, качество кадра. Не диагноз.
        </p>

        {loadingMedia ? (
          <p className="flex items-center gap-2 text-[var(--clinical-foreground-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка списка…
          </p>
        ) : media.length === 0 ? (
          <p className="text-[var(--clinical-foreground-muted)]">
            Сначала загрузите фото, видео или DICOM в блок выше.
          </p>
        ) : (
          <div className="space-y-2 rounded-xl border border-[var(--clinical-border)] p-3">
            <button
              type="button"
              className="flex items-center gap-2 text-xs font-semibold text-[var(--clinical-primary-deep)]"
              onClick={toggleAll}
            >
              {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {allSelected ? "Снять выделение" : "Выбрать все"}
            </button>
            <ul className="space-y-1 text-xs">
              {media.map((m) => (
                <li key={m.id}>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={() => toggleOne(m.id)}
                    />
                    <span>
                      {m.media_type} · {m.storage_path.split("/").pop()}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {jobId ? (
          <p className="text-[10px] text-[var(--clinical-foreground-muted)]">Задача: {jobId}</p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="flex flex-wrap gap-2">
              {result.domain ? (
                <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                  {US_DOMAIN_LABELS[result.domain] ?? result.domain}
                </span>
              ) : null}
              {sononetUsed ? (
                <span className="rounded-full bg-sky-200/80 px-2 py-0.5 text-[10px] font-semibold text-sky-900 dark:bg-sky-900 dark:text-sky-100">
                  SonoNet
                </span>
              ) : null}
              {result.scorecard ? (
                <span className="rounded-full bg-violet-200/80 px-2 py-0.5 text-[10px] font-semibold text-violet-900 dark:bg-violet-900 dark:text-violet-100">
                  {result.scorecard}
                </span>
              ) : null}
            </div>

            <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">{result.disclaimer}</p>
            <p>
              <span className="font-semibold">Сводка:</span> {result.studySummary}
            </p>
            <p>
              <span className="font-semibold">Впечатление:</span> {result.impression}
            </p>
            {result.recommendations.length > 0 ? (
              <div>
                <p className="font-semibold">Рекомендации:</p>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {result.recommendations.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.frames.length > 0 ? (
              <div className="space-y-2">
                <p className="font-semibold">По кадрам:</p>
                {result.frames.map((f) => (
                  <div
                    key={f.mediaId}
                    className="rounded-lg border border-emerald-200/80 bg-white/60 p-2 text-xs dark:border-emerald-800 dark:bg-black/20"
                  >
                    <p className="font-medium">
                      {f.planeGuess ?? "плоскость не определена"} · уверенность{" "}
                      {Math.round((f.confidence ?? 0) * 100)}%
                    </p>
                    {f.sononet ? (
                      <p className="mt-1 text-sky-800 dark:text-sky-200">
                        SonoNet: {f.sononet.labelRu} ({f.sononet.labelEn}) —{" "}
                        {Math.round((f.sononet.confidence ?? 0) * 100)}%
                      </p>
                    ) : null}
                    {f.birads ? (
                      <p className="mt-1 font-medium text-violet-800 dark:text-violet-200">
                        BI-RADS: {f.birads}
                      </p>
                    ) : null}
                    {f.orads ? (
                      <p className="mt-1 font-medium text-violet-800 dark:text-violet-200">
                        O-RADS: {f.orads}
                      </p>
                    ) : null}
                    {f.findings.length > 0 ? (
                      <p className="mt-1">Находки: {f.findings.join("; ")}</p>
                    ) : null}
                    {f.scanErrors.length > 0 ? (
                      <p className="mt-1 text-amber-800 dark:text-amber-200">
                        Ошибки сканирования: {f.scanErrors.join("; ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
            <p className="text-[10px] text-[var(--clinical-foreground-muted)]">
              pipeline: {result.pipeline} · {result.modelVersion}
              {result.cvModels?.length ? ` · CV: ${result.cvModels.join(", ")}` : ""}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
