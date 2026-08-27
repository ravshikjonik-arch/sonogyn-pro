"use client";

import { Camera, ImageIcon, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { OradsAssistFeedback } from "@/components/calculators/orads/wizard/OradsAssistFeedback";
import { Button } from "@/components/ui/button";
import type { GynAiAssistResult } from "@/lib/ai/gyn-ultrasound-assist";
import { createOradsEvent } from "@/lib/orads/oradsEventsApi";
import type { UseOradsNavigatorReturn } from "@repo/orads-us";

type Props = {
  nav: UseOradsNavigatorReturn;
  profileAgeYears?: number;
};

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

/** O-RADS: загрузка снимка УЗИ → US AI Worker (gyn) → подсказки в wizard. */
export function OradsPhotoPanel({ nav, profileAgeYears }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GynAiAssistResult | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [menopause, setMenopause] = useState<"pre" | "post">("pre");
  const [notes, setNotes] = useState("");

  const manualCategory = nav.view.kind === "result" ? nav.view.result.categoryNumber : null;

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Нужен файл изображения (PNG/JPEG/WebP)");
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setResult(null);
      setEventId(null);
      setBusy(true);

      try {
        const base64 = await fileToBase64(file);
        const res = await fetch("/api/ai/gyn-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            freeText: notes.trim() || undefined,
            clinicalContext: "Трансвагинальное УЗИ придатков, O-RADS US v2022",
            menopause,
            profileAgeYears,
            frames: [{ fileName: file.name, mimeType: file.type, base64 }],
          }),
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(typeof err.error === "string" ? err.error : `HTTP ${res.status}`);
        }

        const json = (await res.json()) as { result: GynAiAssistResult };
        setResult(json.result);

        const event = await createOradsEvent({
          platform: "web",
          sourceText: json.result.mergedText,
          extracted: json.result.extracted as unknown as Record<string, unknown>,
          hints: json.result.hints,
          unresolvedNodes: json.result.unresolvedNodes,
          aiCategoryNumber: json.result.categoryNumber,
          aiCompletePath: json.result.completePath,
          ageYears: json.result.context.ageYears ?? null,
          ageSource: json.result.context.ageSource ?? null,
          menopause: json.result.context.menopause,
          menopauseSource: json.result.context.menopauseSource,
          protocolDraft: json.result.protocolDraft,
          protocolDraftSource: "local",
        });
        setEventId(event?.id ?? null);

        toast.success(
          json.result.pipeline.includes("us-ai-worker")
            ? "Снимок разобран · US AI Worker + O-RADS"
            : "Локальный разбор (worker недоступен)",
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : "Не удалось проанализировать снимок";
        setError(message);
        toast.error(message);
      } finally {
        setBusy(false);
      }
    },
    [menopause, notes, previewUrl, profileAgeYears],
  );

  function onApplyHints(autoHighOnly: boolean) {
    if (!result?.hints.length) return;
    nav.applyHints(result.hints, autoHighOnly);
    toast.success(autoHighOnly ? "Подсказки (high) применены в wizard" : "Подсказки применены в wizard");
  }

  return (
    <div className="space-y-4 rounded-2xl border border-teal-200/80 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/20">
      <div className="flex flex-wrap items-center gap-2">
        <Camera className="h-4 w-4 text-teal-800 dark:text-teal-200" />
        <p className="text-sm font-black text-teal-950 dark:text-teal-100">По фото снимка</p>
      </div>

      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Загрузите фото или скрин УЗИ придатков (без PHI). ИИ извлечёт признаки — итоговую категорию O-RADS считает
        калькулятор после вашего подтверждения в пошаговом режиме.
      </p>

      <textarea
        className="min-h-[72px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Комментарий врача (необязательно): сторона, контекст цикла…"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-teal-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-teal-50 dark:border-teal-800 dark:bg-slate-950 dark:hover:bg-teal-950/30">
          <ImageIcon className="h-4 w-4" />
          {busy ? "Анализ…" : "Фото УЗИ"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          Менопауза
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
            value={menopause}
            onChange={(e) => setMenopause(e.target.value as "pre" | "post")}
          >
            <option value="pre">Пременопауза</option>
            <option value="post">Постменопауза</option>
          </select>
        </label>
      </div>

      {previewUrl ? (
        <div className="relative mx-auto max-h-52 overflow-hidden rounded-xl border border-teal-200/80 bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Снимок для O-RADS" className="mx-auto max-h-52 object-contain" />
        </div>
      ) : null}

      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}

      {result ? (
        <div className="space-y-3 rounded-xl border border-teal-100 bg-white/85 p-3 dark:border-teal-900/30 dark:bg-slate-950/60">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300" />
            <p className="text-xs font-bold uppercase tracking-wide text-teal-900 dark:text-teal-100">
              Результат по снимку · {result.pipeline.includes("us-ai-worker") ? "US AI Worker" : "локально"}
            </p>
          </div>

          {result.workerSummary ? (
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">{result.workerSummary}</p>
          ) : null}

          {result.mergedText ? (
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
                Извлечённое описание для O-RADS
              </summary>
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-100 p-2 text-[11px] leading-relaxed dark:bg-slate-900">
                {result.mergedText}
              </p>
            </details>
          ) : null}

          {result.categoryNumber !== null ? (
            <p className="text-sm font-bold text-[var(--clinical-primary-deep)]">
              Черновик калькулятора: O-RADS {result.categoryNumber}
            </p>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Не все шаги определены — примените подсказки и пройдите wizard.
            </p>
          )}

          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {result.clinicalReasoning.summary}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => onApplyHints(true)}>
              Заполнить wizard (high)
            </Button>
            <Button type="button" size="sm" onClick={() => onApplyHints(false)}>
              Все подсказки в wizard
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setResult(null);
                setEventId(null);
                setError(null);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }}
            >
              Другой снимок
            </Button>
          </div>

          <OradsAssistFeedback
            eventId={eventId}
            aiCategoryNumber={result.categoryNumber}
            manualCategoryNumber={manualCategory}
          />

          <p className="text-[10px] leading-relaxed text-slate-500">
            CDS: не диагноз. Проверьте признаки по ACR O-RADS US v2022 и переключитесь на «Пошагово» для финальной категории.
          </p>
        </div>
      ) : null}
    </div>
  );
}
