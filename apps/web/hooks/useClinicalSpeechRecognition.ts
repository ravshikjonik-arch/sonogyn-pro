"use client";

import { useSpeechDictation } from "@repo/clinical-speech/react";

type Options = {
  lang?: string;
  /** Накапливать фразы (диктовка протокола) */
  continuous?: boolean;
  draftKey?: string;
  enableMicLevel?: boolean;
};

/** @deprecated Prefer `@repo/clinical-speech/react` useSpeechDictation for mic level + drafts */
export function useClinicalSpeechRecognition(options: Options = {}) {
  const { lang = "ru-RU", continuous = false, draftKey, enableMicLevel = false } = options;
  const dictation = useSpeechDictation({
    lang,
    continuous,
    interimResults: continuous,
    draftKey,
    enableMicLevel,
  });

  return {
    supported: dictation.supported,
    listening: dictation.listening,
    transcript: dictation.transcript,
    interim: dictation.interim,
    error: dictation.error,
    level: dictation.level,
    start: dictation.start,
    stop: dictation.stop,
    reset: dictation.reset,
    setTranscript: dictation.setTranscript,
  };
}
