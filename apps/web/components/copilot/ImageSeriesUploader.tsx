"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSupabase } from "@/app/providers";
import {
  buildImageStoragePath,
  inferModalityHint,
} from "@/lib/copilot/storage-path";
import { ULTRASOUND_MEDIA_BUCKET } from "@/lib/copilot/types";

type SeriesRow = {
  id: string;
  label: string | null;
  plane_or_region: string | null;
  sort_order: number | null;
};

export function ImageSeriesUploader(props: {
  studyId: string;
  series: SeriesRow[];
}) {
  const supabase = useSupabase();
  const router = useRouter();
  const [seriesId, setSeriesId] = useState("");
  const [newSeriesLabel, setNewSeriesLabel] = useState("");
  const [creatingSeries, setCreatingSeries] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const seriesOptions = props.series;
  const resolvedSeriesId = seriesId || props.series[0]?.id || "";

  async function ensureSeriesSelected() {
    if (resolvedSeriesId) return resolvedSeriesId;

    const response = await fetch(`/api/copilot/studies/${props.studyId}/series`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "Series 1" }),
    });

    const payload = (await response.json()) as {
      series?: { id: string };
      error?: string;
    };

    if (!response.ok || !payload.series?.id) {
      throw new Error(payload.error ?? "Не удалось создать серию");
    }

    setSeriesId(payload.series.id);
    router.refresh();
    return payload.series.id;
  }

  async function createSeries() {
    setCreatingSeries(true);
    setMessage(null);

    try {
      const label =
        newSeriesLabel.trim().length > 0 ? newSeriesLabel.trim() : "Новая серия";

      const response = await fetch(`/api/copilot/studies/${props.studyId}/series`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });

      const payload = (await response.json()) as {
        series?: { id: string };
        error?: string;
      };

      if (!response.ok || !payload.series?.id) {
        throw new Error(payload.error ?? "Ошибка создания серии");
      }

      setSeriesId(payload.series.id);
      setNewSeriesLabel("");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Ошибка серии");
    } finally {
      setCreatingSeries(false);
    }
  }

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    setMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Требуется авторизация");
      }

      const sid = await ensureSeriesSelected();

      let uploaded = 0;

      for (let i = 0; i < fileList.length; i += 1) {
        const file = fileList.item(i);
        if (!file) continue;

        const { bucket, path } = buildImageStoragePath({
          userId: user.id,
          studyId: props.studyId,
          seriesId: sid,
          originalFileName: file.name,
        });

        const storage = supabase.storage.from(bucket);
        const { error: upErr } = await storage.upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

        if (upErr) {
          throw new Error(upErr.message);
        }

        const register = await fetch("/api/copilot/images/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studyId: props.studyId,
            seriesId: sid,
            storagePath: path,
            fileName: file.name,
            contentType: file.type || null,
            byteSize: file.size,
            modalityHint: inferModalityHint(file),
            frameIndex: i,
          }),
        });

        const regPayload = (await register.json()) as { error?: string };

        if (!register.ok) {
          throw new Error(regPayload.error ?? "Ошибка регистрации файла");
        }

        uploaded += 1;
      }

      setMessage(`Загружено кадров: ${uploaded}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-[240px] flex-1">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Активная серия
          </label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 focus:ring-2"
            value={resolvedSeriesId}
            onChange={(e) => setSeriesId(e.target.value)}
          >
            {seriesOptions.length === 0 ? (
              <option value="">Создайте серию ниже</option>
            ) : null}
            {seriesOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label ?? "Series"} · {s.plane_or_region ?? "регион не указан"}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-2 lg:max-w-md">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Новая серия (cine/stack)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 focus:ring-2"
              placeholder="Например: длинная ось шейки матки"
              value={newSeriesLabel}
              onChange={(e) => setNewSeriesLabel(e.target.value)}
            />
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={creatingSeries}
              type="button"
              onClick={() => void createSeries()}
            >
              {creatingSeries ? "..." : "Добавить серию"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
        <p className="text-sm font-semibold text-slate-800">
          Перетащите файлы сюда или выберите серию кадров
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Поддерживаются типичные форматы УЗИ (PNG/JPEG/WebP). Bucket:{" "}
          {ULTRASOUND_MEDIA_BUCKET}. Путь:{" "}
          <span className="font-mono text-[11px]">{"{user}/{study}/{series}/"}</span>
        </p>

        <input
          className="mt-4 block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-700"
          disabled={uploading}
          multiple
          type="file"
          accept="image/*,.dcm"
          onChange={(e) => void uploadFiles(e.target.files)}
        />
      </div>

      {message ? (
        <p className="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
          {message}
        </p>
      ) : null}

      {uploading ? (
        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-blue-600">
          Загрузка...
        </p>
      ) : null}
    </section>
  );
}
