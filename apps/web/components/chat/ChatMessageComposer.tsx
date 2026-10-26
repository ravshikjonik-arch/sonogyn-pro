"use client";

import { ImageIcon, Loader2, Mic, Send, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

type Props = {
  placeholder?: string;
  busy?: boolean;
  onSend: (payload: { text: string; file: File | null }) => Promise<boolean | void>;
  /** Called when user types (debounce/throttle in parent). */
  onTyping?: () => void;
  /** When set, replaces composer text once (e.g. AI suggest insert). */
  insertDraft?: string | null;
  onInsertDraftApplied?: () => void;
  replyLabel?: string | null;
  onCancelReply?: () => void;
  className?: string;
};

export function ChatMessageComposer({
  placeholder = "Сообщение коллегам…",
  busy = false,
  onSend,
  onTyping,
  insertDraft,
  onInsertDraftApplied,
  replyLabel,
  onCancelReply,
  className,
}: Props) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (insertDraft == null || insertDraft === "") return;
    setText(insertDraft);
    onInsertDraftApplied?.();
  }, [insertDraft, onInsertDraftApplied]);

  function pickFile(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  async function toggleVoice() {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return;
    }
    const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const voice = new File(chunksRef.current, `voice-${Date.now()}.webm`, { type: "video/webm" });
      void onSend({ text: "", file: voice });
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !file) return;
    const sent = await onSend({ text: text.trim(), file });
    if (sent === false) return;
    setText("");
    pickFile(null);
    if (imageRef.current) imageRef.current.value = "";
    if (videoRef.current) videoRef.current.value = "";
  }

  return (
    <form className={cn("space-y-2", className)} onSubmit={(e) => void submit(e)}>
      {replyLabel ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)] px-3 py-2 text-xs">
          <span className="truncate">Ответ: {replyLabel}</span>
          <button type="button" onClick={onCancelReply} aria-label="Отменить ответ">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
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
          className="border-[var(--clinical-border)] text-[var(--clinical-foreground)]"
          disabled={busy}
          onClick={() => imageRef.current?.click()}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-[var(--clinical-border)] text-[var(--clinical-foreground)]"
          disabled={busy}
          onClick={() => videoRef.current?.click()}
        >
          <Video className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={recording ? "default" : "outline"}
          className="border-[var(--clinical-border)]"
          disabled={busy}
          onClick={() => void toggleVoice()}
          aria-label={recording ? "Остановить запись" : "Голосовое сообщение"}
        >
          <Mic className={cn("h-4 w-4", recording && "animate-pulse")} />
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          className="doctor-chat-input flex-1"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value.trim()) onTyping?.();
          }}
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
