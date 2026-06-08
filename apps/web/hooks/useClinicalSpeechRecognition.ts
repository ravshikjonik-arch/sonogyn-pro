"use client";

import { useCallback, useRef, useState } from "react";

type Options = {
  lang?: string;
  /** Накапливать фразы (диктовка протокола) */
  continuous?: boolean;
};

export function useClinicalSpeechRecognition(options: Options = {}) {
  const { lang = "ru-RU", continuous = false } = options;
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  const supported =
    typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stop = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
    setInterim("");
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript("");
    setError(null);
  }, [stop]);

  const start = useCallback(() => {
    setError(null);
    const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
    if (!SR) {
      setError("Голос поддерживается в Chrome / Edge на десктопе.");
      return;
    }
    stop();
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = continuous;
    rec.continuous = continuous;
    rec.maxAlternatives = 1;
    recRef.current = rec;
    setListening(true);

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const part = event.results[i]?.[0]?.transcript ?? "";
        if (event.results[i]?.isFinal) finalChunk += part;
        else interimChunk += part;
      }
      if (finalChunk) {
        setTranscript((prev) => (continuous && prev ? `${prev} ${finalChunk.trim()}` : finalChunk.trim()));
      }
      setInterim(interimChunk);
    };

    rec.onerror = () => {
      setError("Не удалось распознать речь. Повторите или введите текст.");
      setListening(false);
      setInterim("");
    };

    rec.onend = () => {
      setListening(false);
      setInterim("");
      recRef.current = null;
    };

    rec.start();
  }, [continuous, lang, stop]);

  return {
    supported,
    listening,
    transcript,
    interim,
    error,
    start,
    stop,
    reset,
    setTranscript,
  };
}
