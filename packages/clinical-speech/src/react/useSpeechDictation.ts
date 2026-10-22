"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { startMicLevelMonitor, type MicMonitor } from "../audio/mic-monitor";
import { clearDictationDraft, loadDictationDraft, saveDictationDraft } from "../draft/storage";
import { postProcessDictation } from "../postprocess/pipeline";
import { createSpeechEngine } from "../provider/create-speech-engine";
import type { VoiceCommandSideEffect } from "../postprocess/voice-commands";
import type { SpeechDictationStatus, SpeechEngineMode, SpeechRecognitionEngine } from "../types";

export type UseSpeechDictationOptions = {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  engineMode?: SpeechEngineMode;
  transcribeUrl?: string;
  /** GET /api/ai/speech/transcribe → available; false скрывает server в auto */
  serverTranscribeAvailable?: boolean;
  draftKey?: string;
  draftAutosaveMs?: number;
  enableMicLevel?: boolean;
  onSideEffect?: (effect: VoiceCommandSideEffect) => void;
};

const engineRef = { current: null as SpeechRecognitionEngine | null };

export function useSpeechDictation(options: UseSpeechDictationOptions = {}) {
  const {
    lang = "ru-RU",
    continuous = false,
    interimResults = continuous,
    engineMode = "auto",
    transcribeUrl,
    serverTranscribeAvailable = true,
    draftKey,
    draftAutosaveMs = 4000,
    enableMicLevel = true,
    onSideEffect,
  } = options;

  const [status, setStatus] = useState<SpeechDictationStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [activeEngineId, setActiveEngineId] = useState<SpeechRecognitionEngine["id"] | null>(null);

  const micRef = useRef<MicMonitor | null>(null);
  const transcriptRef = useRef("");

  const supported = createSpeechEngine(engineMode, {
    transcribeUrl,
    serverTranscribeAvailable,
  }) !== null;

  useEffect(() => {
    if (!draftKey) return;
    const saved = loadDictationDraft(draftKey);
    if (saved) {
      setTranscript(saved);
      transcriptRef.current = saved;
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey || !transcript) return;
    const t = window.setTimeout(() => saveDictationDraft(draftKey, transcript), draftAutosaveMs);
    return () => clearTimeout(t);
  }, [draftKey, draftAutosaveMs, transcript]);

  const appendFinal = useCallback(
    (chunk: string) => {
      const { text, sideEffect } = postProcessDictation(chunk);
      if (sideEffect === "clear") {
        setTranscript("");
        transcriptRef.current = "";
        onSideEffect?.("clear");
        return;
      }
      if (sideEffect === "read") onSideEffect?.("read");

      setTranscript((prev) => {
        const merged = continuous && prev ? `${prev} ${text}`.trim() : text;
        transcriptRef.current = merged;
        return merged;
      });
      setInterim("");
    },
    [continuous, onSideEffect],
  );

  const stop = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    micRef.current?.stop();
    micRef.current = null;
    setLevel(0);
    setStatus("idle");
    setInterim("");
    setActiveEngineId(null);
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript("");
    transcriptRef.current = "";
    setError(null);
    if (draftKey) clearDictationDraft(draftKey);
  }, [draftKey, stop]);

  const start = useCallback(async () => {
    setError(null);
    const engine = createSpeechEngine(engineMode, {
      transcribeUrl,
      serverTranscribeAvailable,
    });
    if (!engine) {
      setError(
        engineMode === "server"
          ? "Серверная диктовка недоступна (микрофон или STT на сервере)."
          : "Голос не поддерживается. Chrome/Edge, Safari с входом в аккаунт или HTTPS.",
      );
      setStatus("error");
      return;
    }

    engineRef.current = engine;
    setActiveEngineId(engine.id);
    engine.setCallbacks({
      onInterim: (t) => {
        setInterim(t);
        setStatus("listening");
      },
      onFinal: (t) => appendFinal(t),
      onError: (msg) => {
        setError(msg);
        setStatus("error");
        stop();
      },
      onEnd: () => {
        if (engineRef.current === engine) {
          setStatus("idle");
          setActiveEngineId(null);
        }
      },
    });

    if (enableMicLevel) {
      micRef.current?.stop();
      micRef.current = await startMicLevelMonitor(setLevel);
    }

    setStatus("listening");
    engine.start({ lang, continuous, interimResults });
  }, [
    appendFinal,
    continuous,
    enableMicLevel,
    engineMode,
    interimResults,
    lang,
    serverTranscribeAvailable,
    stop,
    transcribeUrl,
  ]);

  return {
    supported,
    status,
    listening: status === "listening",
    transcript,
    interim,
    error,
    level,
    activeEngineId,
    start,
    stop,
    reset,
    setTranscript: (value: string) => {
      setTranscript(value);
      transcriptRef.current = value;
    },
  };
}
