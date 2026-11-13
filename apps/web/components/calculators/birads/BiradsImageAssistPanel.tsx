"use client";

import { ImageIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { LexiconFeaturesList } from "@/components/calculators/orads/LexiconFeaturesList";
import { LexiconImageOverlay } from "@/components/calculators/orads/LexiconImageOverlay";
import { Button } from "@/components/ui/button";
import type { BreastAiAssistResult } from "@/lib/ai/breast-ultrasound-assist";
import {
  assistHttpErrorMessage,
  prepareClientImagingFrame,
} from "@/lib/ai/imaging-cds/prepare-client-frame";

type Props = {
  freeText?: string;
  onResult: (result: BreastAiAssistResult) => void;
  disabled?: boolean;
};

/** Загрузка снимка УЗИ МЖ → US AI Worker (domain breast) + BI-RADS NLP. */
export function BiradsImageAssistPanel({ freeText, onResult, disabled }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<BreastAiAssistResult | null>(null);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setBusy(true);
      setLastResult(null);
      try {
        const frame = await prepareClientImagingFrame(file);
        setPreviewUrl(frame.previewUrl);
        const res = await fetch("/api/ai/breast-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            freeText,
            clinicalContext: "УЗИ молочной железы, BI-RADS US",
            frames: [{ fileName: frame.fileName, mimeType: frame.mimeType, base64: frame.base64 }],
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(assistHttpErrorMessage(res.status, err.error));
        }
        const json = (await res.json()) as { result: BreastAiAssistResult };
        setLastResult(json.result);
        onResult(json.result);
        toast.success(
          json.result.pipeline.includes("us-ai-worker")
            ? "Анализ US AI Worker + BI-RADS"
            : json.result.pipeline.includes("applicability")
              ? "Контекст вне BI-RADS US"
              : "Анализ по тексту (worker недоступен)",
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Не удалось проанализировать снимок");
      } finally {
        setBusy(false);
      }
    },
    [freeText, onResult, previewUrl],
  );

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-rose-300 bg-rose-50/40 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
      <p className="text-xs font-bold text-rose-900 dark:text-rose-100">Загрузка снимка УЗИ (US AI Worker · breast)</p>
      <p className="text-[10px] leading-relaxed text-[var(--clinical-foreground-muted)]">
        Категорию BI-RADS подтверждает врач в калькуляторе. ИИ — только дескрипторы.
      </p>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-950 dark:hover:bg-rose-950/30">
          <ImageIcon className="h-4 w-4" />
          {busy ? "Анализ…" : "Фото / DICOM→PNG"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled || busy}
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      {previewUrl ? (
        <div className="relative mx-auto max-h-44 overflow-hidden rounded-lg border bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <LexiconImageOverlay
            imageUrl={previewUrl}
            imageAlt="Снимок МЖ"
            features={lastResult?.lexiconFeatures ?? []}
          />
        </div>
      ) : null}

      {lastResult?.applicability && !lastResult.applicability.applicable ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-2 text-xs font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {lastResult.applicability.messageRu}
        </p>
      ) : null}

      {lastResult?.lexiconFeatures?.length ? (
        <LexiconFeaturesList features={lastResult.lexiconFeatures} title="Дескрипторы BI-RADS US (ИИ)" />
      ) : null}

      {lastResult && !lastResult.applicability?.blockAnalysis ? (
        <Button type="button" size="sm" variant="ghost" onClick={() => setLastResult(null)}>
          Сбросить снимок
        </Button>
      ) : null}
    </div>
  );
}
