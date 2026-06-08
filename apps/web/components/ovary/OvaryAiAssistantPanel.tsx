"use client";

import { Brain, ImageIcon, Video } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  analyzeOvaryUltrasoundAssist,
  extractOvaryImageMetrics,
  extractVideoFrameMetrics,
  type OvaryAiAssistResult,
  type OvaryImageMetrics,
} from "@/lib/ai/ovary-ultrasound-assist";
import type { OvaryMorphologyPreset, OvaryTopographyMarker } from "@repo/clinical-3d";

type Props = {
  morphology: OvaryMorphologyPreset;
  markers: OvaryTopographyMarker[];
  onApplyAiMarkers?: (side: "left" | "right", kinds: import("@repo/clinical-3d").OvaryMarkerKind[]) => void;
};

export function OvaryAiAssistantPanel({ morphology, markers, onApplyAiMarkers }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video_frame" | "none">("none");
  const [metrics, setMetrics] = useState<OvaryImageMetrics | null>(null);
  const [cycleDay, setCycleDay] = useState("");
  const [afc, setAfc] = useState("");
  const [volume, setVolume] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<OvaryAiAssistResult | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setBusy(true);
    try {
      if (file.type.startsWith("video/")) {
        setMediaType("video_frame");
        const m = await extractVideoFrameMetrics(file);
        setMetrics(m);
        toast.success("Кадр из видео извлечён для подсказки ИИ");
      } else if (file.type.startsWith("image/")) {
        setMediaType("image");
        const m = await extractOvaryImageMetrics(file);
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
  }, [previewUrl]);

  const runAssist = useCallback(async () => {
    setBusy(true);
    try {
      const input = {
        morphology,
        markers,
        cycleDay: cycleDay ? Number(cycleDay) : undefined,
        afcCount: afc ? Number(afc) : undefined,
        ovaryVolumeMl: volume ? Number(volume) : undefined,
        userNotes: notes,
        imageMetrics: metrics ?? undefined,
        mediaType,
      };
      const res = await fetch("/api/ai/ovary-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("assist failed");
      const json = (await res.json()) as { result: OvaryAiAssistResult };
      setResult(json.result);
    } catch {
      const local = analyzeOvaryUltrasoundAssist({
        morphology,
        markers,
        cycleDay: cycleDay ? Number(cycleDay) : undefined,
        afcCount: afc ? Number(afc) : undefined,
        ovaryVolumeMl: volume ? Number(volume) : undefined,
        userNotes: notes,
        imageMetrics: metrics ?? undefined,
        mediaType,
      });
      setResult(local);
    } finally {
      setBusy(false);
    }
  }, [morphology, markers, cycleDay, afc, volume, notes, metrics, mediaType]);

  return (
    <div className="sonogyn-glass-card space-y-4 rounded-2xl border border-violet-200/60 p-5 dark:border-violet-900/50">
      <div className="flex flex-wrap items-center gap-2">
        <Brain className="h-5 w-5 text-violet-600" />
        <p className="text-sm font-black text-violet-950 dark:text-violet-100">ИИ-помощник · яичник</p>
        <Badge variant="outline" className="text-[10px]">
          фото / видео
        </Badge>
      </div>
      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Подсказка по рисунку: мультифолликулярный / норма / тип кисты. Сопоставьте с эхограммой и O-RADS Pro.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-xs font-bold">День цикла</label>
          <Input className="mt-1" inputMode="numeric" value={cycleDay} onChange={(e) => setCycleDay(e.target.value)} placeholder="напр. 12" />
        </div>
        <div>
          <label className="text-xs font-bold">AFC (суммарно)</label>
          <Input className="mt-1" inputMode="numeric" value={afc} onChange={(e) => setAfc(e.target.value)} placeholder="≥12 → СПКЯ?" />
        </div>
        <div>
          <label className="text-xs font-bold">Объём яичника, мл</label>
          <Input className="mt-1" inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="мл" />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold">Комментарий врача</label>
        <Input className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="стимуляция, СПКЯ, боль…" />
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
        <Button variant="outline" size="sm" asChild>
          <Link href="/calculators/o-rads">O-RADS Pro →</Link>
        </Button>
      </div>

      {previewUrl ? (
        <div className="relative mx-auto max-h-48 overflow-hidden rounded-xl border bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Загруженный снимок" className="mx-auto max-h-48 object-contain" />
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3 rounded-xl bg-violet-50/80 p-4 dark:bg-violet-950/40">
          <p className="text-sm font-bold text-violet-950 dark:text-violet-100">{result.patternLabelRu}</p>
          <p className="text-xs text-[var(--clinical-foreground-muted)]">{result.summaryRu}</p>
          <Badge>{result.oradsHint}</Badge>
          <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed">
            {result.checklistRu.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {onApplyAiMarkers && result.suggestedMarkerKinds.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onApplyAiMarkers("right", result.suggestedMarkerKinds)}
              >
                Подсказки на правый яичник
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onApplyAiMarkers("left", result.suggestedMarkerKinds)}
              >
                Подсказки на левый
              </Button>
            </div>
          ) : null}
          <p className="text-[10px] text-[var(--clinical-foreground-muted)]">{result.disclaimerRu}</p>
        </div>
      ) : null}
    </div>
  );
}
