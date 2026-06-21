"use client";

import { ImageIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { BreastAiAssistResult } from "@/lib/ai/breast-ultrasound-assist";

type Props = {
  freeText?: string;
  onResult: (result: BreastAiAssistResult) => void;
  disabled?: boolean;
};

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

/** Загрузка снимка УЗИ МЖ → US AI Worker (domain breast) + BI-RADS NLP. */
export function BiradsImageAssistPanel({ freeText, onResult, disabled }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Нужен файл изображения (PNG/JPEG/WebP)");
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setBusy(true);
      try {
        const base64 = await fileToBase64(file);
        const res = await fetch("/api/ai/breast-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            freeText,
            clinicalContext: "УЗИ молочной железы, BI-RADS US",
            frames: [{ fileName: file.name, mimeType: file.type, base64 }],
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const json = (await res.json()) as { result: BreastAiAssistResult };
        onResult(json.result);
        toast.success(
          json.result.pipeline.includes("us-ai-worker")
            ? "Анализ US AI Worker + BI-RADS"
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
    <div className="space-y-3 rounded-xl border border-dashed border-rose-300 bg-rose-50/40 p-3">
      <p className="text-xs font-bold text-rose-900">Загрузка снимка УЗИ (US AI Worker · breast)</p>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-rose-50">
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
          <img src={previewUrl} alt="Снимок МЖ" className="mx-auto max-h-44 object-contain" />
        </div>
      ) : null}
    </div>
  );
}
