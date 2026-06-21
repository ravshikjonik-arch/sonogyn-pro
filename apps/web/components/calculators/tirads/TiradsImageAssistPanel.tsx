"use client";

import { ImageIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ThyroidAiAssistResult } from "@/lib/ai/thyroid-ultrasound-assist";

type Props = {
  freeText?: string;
  onResult: (result: ThyroidAiAssistResult) => void;
  disabled?: boolean;
};

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

/** Загрузка снимка УЗИ ЩЖ → US AI Worker + ACR TI-RADS NLP. */
export function TiradsImageAssistPanel({ freeText, onResult, disabled }: Props) {
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
        const res = await fetch("/api/ai/thyroid-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            freeText,
            clinicalContext: "УЗИ щитовидной железы, ACR TI-RADS",
            frames: [{ fileName: file.name, mimeType: file.type, base64 }],
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const json = (await res.json()) as { result: ThyroidAiAssistResult };
        onResult(json.result);
        toast.success(
          json.result.pipeline.includes("us-ai-worker")
            ? "US AI Worker + ACR TI-RADS"
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
    <div className="space-y-3 rounded-xl border border-dashed border-sky-300 bg-sky-50/40 p-3">
      <p className="text-xs font-bold text-sky-900">Загрузка снимка УЗИ (US AI Worker · thyroid)</p>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-sky-50">
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
          <img src={previewUrl} alt="Снимок ЩЖ" className="mx-auto max-h-44 object-contain" />
        </div>
      ) : null}
    </div>
  );
}
