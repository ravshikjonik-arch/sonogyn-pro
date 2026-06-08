"use client";

import { Brain, ClipboardList, ImageIcon, Video } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  analyzeNosologyUltrasoundAssist,
  type NosologyAiAssistResult,
} from "@/lib/ai/nosology-ultrasound-assist";
import {
  extractUltrasoundImageMetrics,
  extractUltrasoundVideoFrameMetrics,
  type UltrasoundImageMetrics,
} from "@/lib/ai/ultrasound-image-metrics";
import type { NosologyAssistContext } from "@/lib/clinical-assistant/nosology-assist-context";

type Props = {
  context: NosologyAssistContext;
  voiceTranscript?: string;
  onApplyProtocol?: (text: string) => void;
};

export function ClinicalImageAiAssistPanel({ context, voiceTranscript = "", onApplyProtocol }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video_frame" | "none">("none");
  const [metrics, setMetrics] = useState<UltrasoundImageMetrics | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<NosologyAiAssistResult | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setResult(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setBusy(true);
      try {
        if (file.type.startsWith("video/")) {
          setMediaType("video_frame");
          const m = await extractUltrasoundVideoFrameMetrics(file);
          setMetrics(m);
          toast.success("Кадр из видео извлечён");
        } else if (file.type.startsWith("image/")) {
          setMediaType("image");
          const m = await extractUltrasoundImageMetrics(file);
          setMetrics(m);
          toast.success("Снимок загружен");
        } else {
          toast.error("Нужен файл изображения или видео");
        }
      } catch {
        toast.error("Не удалось обработать файл");
      } finally {
        setBusy(false);
      }
    },
    [previewUrl],
  );

  const runAssist = useCallback(async () => {
    setBusy(true);
    const input = {
      context,
      userNotes: notes,
      voiceTranscript: voiceTranscript.trim() || undefined,
      imageMetrics: metrics ?? undefined,
      mediaType,
    };
    try {
      const res = await fetch("/api/ai/nosology-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("assist failed");
      const json = (await res.json()) as { result: NosologyAiAssistResult };
      setResult(json.result);
    } catch {
      setResult(analyzeNosologyUltrasoundAssist(input));
    } finally {
      setBusy(false);
    }
  }, [context, notes, voiceTranscript, metrics, mediaType]);

  const copySnippet = useCallback(async () => {
    if (!result?.protocolSnippetRu) return;
    try {
      await navigator.clipboard.writeText(result.protocolSnippetRu);
      toast.success("Фрагмент протокола скопирован");
    } catch {
      toast.error("Не удалось скопировать");
    }
  }, [result]);

  return (
    <div className="space-y-4 rounded-2xl border border-violet-200/60 bg-violet-50/30 p-4 dark:border-violet-900/50 dark:bg-violet-950/25">
      <div className="flex flex-wrap items-center gap-2">
        <Brain className="h-4 w-4 text-violet-600 dark:text-violet-300" />
        <p className="text-sm font-black text-violet-950 dark:text-violet-100">ИИ · помощь по снимку</p>
        <Badge variant="outline" className="text-[10px]">
          {context.code ?? "УЗИ"}
        </Badge>
      </div>
      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        {context.title}: чеклист описания, red flags и черновик протокола по фото/видео и диктовке.
      </p>

      <div>
        <label className="text-xs font-bold">Комментарий врача</label>
        <Input
          className="mt-1"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="дополнительно к голосу…"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-violet-300 px-3 py-2 text-xs font-semibold hover:bg-violet-50 dark:hover:bg-violet-950/30">
          <ImageIcon className="h-4 w-4" />
          Фото УЗИ
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-violet-300 px-3 py-2 text-xs font-semibold hover:bg-violet-50 dark:hover:bg-violet-950/30">
          <Video className="h-4 w-4" />
          Видео (кадр)
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <Button type="button" size="sm" disabled={busy} onClick={() => void runAssist()}>
          {busy ? "Анализ…" : "ИИ-оценка"}
        </Button>
      </div>

      {previewUrl ? (
        <div className="relative mx-auto max-h-40 overflow-hidden rounded-xl border bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Загруженный снимок" className="mx-auto max-h-40 object-contain" />
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3 rounded-xl bg-violet-50/80 p-4 dark:bg-violet-950/40">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-violet-950 dark:text-violet-100">{result.patternLabelRu}</p>
            <Badge variant="outline" className="text-[10px]">
              {result.confidence === "medium" ? "средняя уверенность" : "нужен контекст"}
            </Badge>
          </div>
          <p className="text-xs text-[var(--clinical-foreground-muted)]">{result.summaryRu}</p>

          {result.alertsRu.length > 0 ? (
            <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-200">
              {result.alertsRu.map((line) => (
                <li key={line}>⚠ {line}</li>
              ))}
            </ul>
          ) : null}

          <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed">
            {result.checklistRu.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          {result.ultrasoundHintsRu.length > 0 ? (
            <div className="text-xs text-[var(--clinical-foreground-muted)]">
              <span className="font-bold">По кадру: </span>
              {result.ultrasoundHintsRu.join(" ")}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" size="sm" variant="secondary" className="gap-1.5" onClick={() => void copySnippet()}>
              <ClipboardList className="h-3.5 w-3.5" />
              Копировать черновик
            </Button>
            {onApplyProtocol ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onApplyProtocol(result.protocolSnippetRu)}>
                В протокол
              </Button>
            ) : null}
          </div>

          <p className="text-[10px] text-[var(--clinical-foreground-muted)]">{result.disclaimerRu}</p>
        </div>
      ) : null}
    </div>
  );
}
