"use client";

import { Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const MAX_BYTES = 2 * 1024 * 1024 * 1024;
const ACCEPT = ".mp4,.webm";

type VideoUploaderProps = {
  courseId: string;
  lessonId: string;
  processingStatus?: string | null;
  onUploaded?: (info: { videoFileUrl: string; processingStatus: string }) => void;
};

type UploadPhase = "idle" | "uploading" | "processing" | "ready" | "failed";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} ГБ`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  return `${Math.round(bytes / 1024)} КБ`;
}

function mimeForFile(file: File): string | null {
  if (file.type === "video/mp4" || file.type === "video/webm") return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  return null;
}

async function putPart(
  url: string,
  chunk: Blob,
  onPartProgress: (loaded: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) onPartProgress(ev.loaded);
    };
    xhr.onload = () => {
      const etag = xhr.getResponseHeader("ETag");
      if (xhr.status >= 200 && xhr.status < 300 && etag) resolve(etag);
      else reject(new Error(`Ошибка загрузки части (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Сеть недоступна"));
    xhr.send(chunk);
  });
}

export function VideoUploader({ courseId, lessonId, processingStatus, onUploaded }: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<UploadPhase>(() => {
    if (processingStatus === "ready") return "ready";
    if (processingStatus === "processing" || processingStatus === "uploading") return "processing";
    if (processingStatus === "failed") return "failed";
    return "idle";
  });
  const [error, setError] = useState("");

  const apiBase = `/api/author/courses/${courseId}/lessons/${lessonId}/video/upload`;

  const validateFile = useCallback((candidate: File): string | null => {
    if (candidate.size > MAX_BYTES) return "Максимальный размер — 2 ГБ.";
    if (!mimeForFile(candidate)) return "Допустимы только .mp4 и .webm.";
    return null;
  }, []);

  const pickFile = useCallback(
    (candidate: File | null) => {
      if (!candidate) return;
      const err = validateFile(candidate);
      if (err) {
        setError(err);
        return;
      }
      setError("");
      setFile(candidate);
      setPhase("idle");
      setProgress(0);
    },
    [validateFile],
  );

  async function startUpload() {
    if (!file) return;
    const mimeType = mimeForFile(file);
    if (!mimeType) {
      setError("Неподдерживаемый формат.");
      return;
    }

    setPhase("uploading");
    setProgress(0);
    setError("");

    try {
      const initRes = await fetch(`${apiBase}/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType,
        }),
      });
      const initBody = (await initRes.json()) as {
        ok?: boolean;
        uploadId?: string;
        key?: string;
        partSize?: number;
        partCount?: number;
        error?: string;
      };
      if (!initRes.ok || !initBody.ok || !initBody.uploadId || !initBody.key || !initBody.partSize) {
        throw new Error(typeof initBody.error === "string" ? initBody.error : "Не удалось начать загрузку");
      }

      const partSize = initBody.partSize;
      const partCount = initBody.partCount ?? Math.ceil(file.size / partSize);
      const parts: { PartNumber: number; ETag: string }[] = [];
      let uploaded = 0;

      for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
        const start = (partNumber - 1) * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);

        const signRes = await fetch(`${apiBase}/sign-part`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            key: initBody.key,
            uploadId: initBody.uploadId,
            partNumber,
          }),
        });
        const signBody = (await signRes.json()) as { ok?: boolean; url?: string; error?: string };
        if (!signRes.ok || !signBody.url) {
          throw new Error(typeof signBody.error === "string" ? signBody.error : "Presign failed");
        }

        const etag = await putPart(signBody.url, chunk, (loaded) => {
          const totalLoaded = uploaded + loaded;
          setProgress(Math.min(99, Math.round((totalLoaded / file.size) * 100)));
        });

        uploaded += chunk.size;
        setProgress(Math.min(99, Math.round((uploaded / file.size) * 100)));
        parts.push({ PartNumber: partNumber, ETag: etag });
      }

      const completeRes = await fetch(`${apiBase}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          key: initBody.key,
          uploadId: initBody.uploadId,
          parts,
          fileName: file.name,
          fileSize: file.size,
          mimeType,
        }),
      });
      const completeBody = (await completeRes.json()) as {
        ok?: boolean;
        videoFileUrl?: string;
        processingStatus?: string;
        error?: string;
      };

      if (!completeRes.ok || !completeBody.ok) {
        throw new Error(typeof completeBody.error === "string" ? completeBody.error : "Ошибка завершения");
      }

      setProgress(100);
      const nextPhase = completeBody.processingStatus === "ready" ? "ready" : "processing";
      setPhase(nextPhase);
      onUploaded?.({
        videoFileUrl: completeBody.videoFileUrl ?? initBody.key,
        processingStatus: completeBody.processingStatus ?? nextPhase,
      });
    } catch (e) {
      setPhase("failed");
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    }
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pickFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragOver
            ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)]/5"
            : "border-slate-300 dark:border-slate-700"
        }`}
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-slate-400" />
        <p className="text-sm font-medium">Перетащите .mp4 / .webm сюда или нажмите для выбора</p>
        <p className="mt-1 text-xs text-slate-500">До 2 ГБ · загрузка напрямую в Object Storage</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {file ? (
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900/50">
          <span className="truncate">{file.name} · {formatBytes(file.size)}</span>
          <button
            type="button"
            className="text-slate-500 hover:text-slate-800"
            onClick={() => {
              setFile(null);
              setProgress(0);
              setPhase("idle");
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {phase === "uploading" || progress > 0 ? (
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>{phase === "uploading" ? "Загрузка…" : "Готово"}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[var(--clinical-primary)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {phase === "processing" ? (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Видео загружено. Идёт подготовка HLS — обновите страницу через несколько минут.
        </p>
      ) : null}

      {phase === "ready" ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">Видео готово к просмотру.</p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {file && phase !== "uploading" && phase !== "processing" && phase !== "ready" ? (
        <button
          type="button"
          className="rounded-xl bg-[var(--clinical-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={() => void startUpload()}
        >
          Загрузить видео
        </button>
      ) : null}
    </div>
  );
}
