import { speechErrorMessageRu } from "../errors";
import type { SpeechRecognitionCallbacks, SpeechRecognitionEngine } from "../types";

const DEFAULT_SEGMENT_MS = 7000;

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

export type ServerWhisperEngineOptions = {
  transcribeUrl?: string;
  segmentMs?: number;
};

export class ServerWhisperEngine implements SpeechRecognitionEngine {
  readonly id = "server-whisper" as const;
  readonly label = "Серверное распознавание (Whisper)";

  private readonly transcribeUrl: string;
  private readonly segmentMs: number;
  private callbacks: SpeechRecognitionCallbacks = {};
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private shouldRun = false;
  private continuous = false;
  private lang = "ru-RU";
  private segmentTimer: ReturnType<typeof setTimeout> | null = null;
  private capturing = false;

  constructor(options: ServerWhisperEngineOptions = {}) {
    this.transcribeUrl = options.transcribeUrl ?? "/api/ai/speech/transcribe";
    this.segmentMs = options.segmentMs ?? DEFAULT_SEGMENT_MS;
  }

  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== "undefined" &&
      Boolean(pickRecorderMime())
    );
  }

  setCallbacks(callbacks: SpeechRecognitionCallbacks): void {
    this.callbacks = callbacks;
  }

  start(options: { lang: string; continuous: boolean; interimResults: boolean }): void {
    void this.beginCapture(options);
  }

  stop(): void {
    this.shouldRun = false;
    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer);
      this.segmentTimer = null;
    }
    try {
      if (this.recorder?.state === "recording") this.recorder.stop();
    } catch {
      /* noop */
    }
  }

  abort(): void {
    this.shouldRun = false;
    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer);
      this.segmentTimer = null;
    }
    try {
      this.recorder?.stop();
    } catch {
      /* noop */
    }
    this.cleanupStream();
    this.recorder = null;
    this.chunks = [];
  }

  private cleanupStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private async beginCapture(options: {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
  }): Promise<void> {
    if (this.capturing) return;
    this.capturing = true;
    this.lang = options.lang;
    this.continuous = options.continuous;
    this.shouldRun = true;

    const mime = pickRecorderMime();
    if (!mime) {
      this.capturing = false;
      this.callbacks.onError?.(
        speechErrorMessageRu(undefined, "Запись аудио не поддерживается в этом браузере."),
        "unsupported",
      );
      return;
    }

    try {
      this.cleanupStream();
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      this.capturing = false;
      this.callbacks.onError?.(
        speechErrorMessageRu("not-allowed", "Разрешите микрофон для серверной диктовки."),
        "not-allowed",
      );
      return;
    }

    this.chunks = [];
    const recorder = new MediaRecorder(this.stream, { mimeType: mime });
    this.recorder = recorder;

    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) this.chunks.push(ev.data);
    };

    recorder.onerror = () => {
      this.callbacks.onError?.(
        speechErrorMessageRu(undefined, "Ошибка записи. Повторите диктовку."),
        "recorder-error",
      );
      this.abort();
    };

    recorder.onstop = () => {
      void this.flushSegment(mime);
    };

    recorder.start(250);
    this.callbacks.onInterim?.(options.interimResults ? "Запись…" : "");

    if (this.continuous) {
      this.segmentTimer = setTimeout(() => {
        if (this.recorder?.state === "recording") this.recorder.stop();
      }, this.segmentMs);
    }
  }

  private async flushSegment(mime: string): Promise<void> {
    this.capturing = false;
    const blob = new Blob(this.chunks, { type: mime });
    this.chunks = [];
    this.cleanupStream();
    this.recorder = null;

    if (!this.shouldRun && blob.size === 0) {
      this.callbacks.onEnd?.();
      return;
    }

    if (blob.size > 0) {
      this.callbacks.onInterim?.("Распознавание…");
      try {
        const text = await this.transcribe(blob);
        if (text.trim()) this.callbacks.onFinal?.(text.trim());
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Не удалось распознать аудио.";
        this.callbacks.onError?.(msg, "transcribe-failed");
        this.shouldRun = false;
        this.callbacks.onEnd?.();
        return;
      }
    }

    if (this.shouldRun && this.continuous) {
      await this.beginCapture({ lang: this.lang, continuous: true, interimResults: true });
      return;
    }

    this.callbacks.onEnd?.();
  }

  private async transcribe(blob: Blob): Promise<string> {
    const form = new FormData();
    form.append("audio", blob, "dictation.webm");
    form.append("lang", this.lang);

    const res = await fetch(this.transcribeUrl, {
      method: "POST",
      body: form,
      credentials: "include",
    });

    const json = (await res.json().catch(() => ({}))) as { text?: string; error?: string; code?: string };

    if (res.status === 401) {
      throw new Error("Войдите в аккаунт для серверной диктовки.");
    }
    if (res.status === 503 || json.code === "stt_unavailable") {
      throw new Error("Серверное STT недоступно. Используйте Chrome/Edge или позже.");
    }
    if (res.status === 400 && json.code === "phi_detected") {
      throw new Error("В тексте возможны персональные данные — удалите их и повторите.");
    }
    if (!res.ok) {
      throw new Error(json.error ?? "Ошибка сервера распознавания.");
    }

    return json.text ?? "";
  }
}
