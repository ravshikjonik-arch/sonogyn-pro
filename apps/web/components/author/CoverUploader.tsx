"use client";

import { Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type CoverUploaderProps = {
  coverUrl: string | null;
  onUpload: (file: File) => Promise<void>;
};

export function CoverUploader({ coverUrl, onUpload }: CoverUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file || !file.type.startsWith("image/")) return;
      setUploading(true);
      try {
        await onUpload(file);
      } finally {
        setUploading(false);
      }
    },
    [onUpload],
  );

  return (
    <div className="space-y-3">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" className="aspect-video w-full rounded-xl object-cover" />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500 dark:bg-slate-900">
          Нет обложки
        </div>
      )}
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
          void handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center text-sm transition ${
          dragOver
            ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)]/5"
            : "border-slate-300 dark:border-slate-700"
        }`}
      >
        <Upload className="mx-auto mb-2 h-5 w-5 text-slate-400" />
        {uploading ? "Загрузка…" : "Перетащите JPEG/PNG/WebP или нажмите"}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          e.target.value = "";
          void handleFile(f);
        }}
      />
    </div>
  );
}
