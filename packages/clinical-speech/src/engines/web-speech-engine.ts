/// <reference path="./web-speech-globals.d.ts" />
import { speechErrorMessageRu } from "../errors";
import type { SpeechRecognitionCallbacks, SpeechRecognitionEngine } from "../types";

type WebSpeechRecognition = SpeechRecognition;

function getSpeechRecognitionCtor(): (new () => WebSpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export class WebSpeechEngine implements SpeechRecognitionEngine {
  readonly id = "web-speech" as const;
  readonly label = "Web Speech API (устройство)";

  private rec: WebSpeechRecognition | null = null;
  private callbacks: SpeechRecognitionCallbacks = {};
  private shouldRestart = false;
  private continuous = false;

  isSupported(): boolean {
    return getSpeechRecognitionCtor() !== null;
  }

  start(options: {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
  }): void {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      this.callbacks.onError?.(
        speechErrorMessageRu(undefined, "Голос не поддерживается в этом браузере. Chrome/Edge или серверный режим."),
        "unsupported",
      );
      return;
    }

    this.stopInternal(false);
    this.continuous = options.continuous;
    this.shouldRestart = true;

    const rec = new Ctor();
    rec.lang = options.lang;
    rec.continuous = options.continuous;
    rec.interimResults = options.interimResults;
    rec.maxAlternatives = 1;
    this.rec = rec;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const part = result?.[0]?.transcript ?? "";
        const confidence = result?.[0]?.confidence;
        if (result?.isFinal) {
          finalChunk += part;
          if (part.trim()) this.callbacks.onFinal?.(part.trim(), confidence);
        } else interimChunk += part;
      }
      if (interimChunk) this.callbacks.onInterim?.(interimChunk);
      if (finalChunk && !options.interimResults) {
        this.callbacks.onFinal?.(finalChunk.trim());
      }
    };

    rec.onerror = (event) => {
      const code = (event as SpeechRecognitionErrorEvent).error;
      if (code === "aborted") return;
      this.shouldRestart = false;
      this.callbacks.onError?.(speechErrorMessageRu(code), code);
    };

    rec.onend = () => {
      this.rec = null;
      this.callbacks.onEnd?.();
      if (this.shouldRestart && this.continuous) {
        try {
          this.start(options);
        } catch {
          this.shouldRestart = false;
        }
      }
    };

    try {
      rec.start();
    } catch {
      this.callbacks.onError?.(
        speechErrorMessageRu(undefined, "Не удалось запустить микрофон. Нажмите ещё раз."),
        "start-failed",
      );
    }
  }

  stop(): void {
    this.shouldRestart = false;
    this.stopInternal(true);
  }

  abort(): void {
    this.shouldRestart = false;
    this.stopInternal(false);
    try {
      this.rec?.abort();
    } catch {
      /* noop */
    }
    this.rec = null;
  }

  setCallbacks(callbacks: SpeechRecognitionCallbacks): void {
    this.callbacks = callbacks;
  }

  private stopInternal(callStop: boolean): void {
    if (!this.rec) return;
    try {
      if (callStop) this.rec.stop();
    } catch {
      /* noop */
    }
  }
}
