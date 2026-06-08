"use client";

import { ImageIcon, Loader2, Send, Video, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

type Props = {
  placeholder?: string;
  busy?: boolean;
  onSend: (payload: { text: string; file: File | null }) => Promise<void>;
  className?: string;
};

export function ChatMessageComposer({
  placeholder = "Сообщение коллегам…",
  busy = false,
  onSend,
  className,
}: Props) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  function pickFile(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !file) return;
    await onSend({ text: text.trim(), file });
    setText("");
    pickFile(null);
    if (imageRef.current) imageRef.current.value = "";
    if (videoRef.current) videoRef.current.value = "";
  }

  return (
    <form className={cn("space-y-2", className)} onSubmit={(e) => void submit(e)}>
      {preview ? (
        <div className="relative inline-block max-w-full">
          {file?.type.startsWith("video/") ? (
            <video src={preview} className="max-h-32 rounded-xl border" controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Превью" className="max-h-32 rounded-xl border object-contain" />
          )}
          <button
            type="button"
            className="absolute -right-2 -top-2 rounded-full bg-slate-800 p-1 text-white shadow"
            onClick={() => pickFile(null)}
            aria-label="Убрать вложение"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          ref={imageRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          className="sr-only"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => imageRef.current?.click()}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => videoRef.current?.click()}
        >
          <Video className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          className="flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={busy}
        />
        <Button
          type="submit"
          disabled={busy || (!text.trim() && !file)}
          className="shrink-0 gap-1.5"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Отправить
        </Button>
      </div>
    </form>
  );
}
