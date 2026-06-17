"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { readAppLocale, type AppLocale } from "@/lib/i18n/locale";
import { speechLangForAppLocale } from "@/lib/voice/speech-locale";
import type { VoiceTopic } from "@/lib/voice/types";

export type { VoiceTopic };

export type VoiceGender = "female" | "male";

export type UseSpeechSynthesisOptions = {
  /** Локаль UI → BCP-47 для utterance.lang */
  locale?: AppLocale;
  initialRate?: number;
  initialGender?: VoiceGender;
};

const FEMALE_HINT = /milena|katya|anna|elena|irina|zira|samantha|victoria|female|жен|woman|girl|femme|paola|alice|marie/i;
const MALE_HINT = /yuri|dmitri|alex|pavel|david|daniel|thomas|male|муж|man|boy|homme|marco|luca|maged/i;

function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

function filterVoicesByLang(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice[] {
  const prefix = lang.split("-")[0]?.toLowerCase() ?? lang;
  const exact = voices.filter((v) => v.lang.replace("_", "-").toLowerCase() === lang.toLowerCase());
  if (exact.length > 0) return exact;
  return voices.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(prefix));
}

export function pickVoiceForLang(
  voices: SpeechSynthesisVoice[],
  lang: string,
  gender: VoiceGender,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const localized = filterVoicesByLang(voices, lang);
  const pool = localized.length > 0 ? localized : voices;

  if (gender === "female") {
    const female = pool.find((v) => FEMALE_HINT.test(v.name));
    if (female) return female;
  }
  if (gender === "male") {
    const male = pool.find((v) => MALE_HINT.test(v.name));
    if (male) return male;
  }

  const defaultVoice = pool.find((v) => v.default);
  return defaultVoice ?? pool[0] ?? null;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const [locale, setLocale] = useState<AppLocale>(() => options.locale ?? readAppLocale());
  const [rate, setRate] = useState(options.initialRate ?? 1);
  const [gender, setGender] = useState<VoiceGender>(options.initialGender ?? "female");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const supported = isSpeechSynthesisSupported();

  const speechLang = speechLangForAppLocale(locale);

  const refreshVoices = useCallback(() => {
    if (!supported) return;
    const list = window.speechSynthesis.getVoices();
    if (list.length > 0) setVoices([...list]);
  }, [supported]);

  useEffect(() => {
    if (!supported) return;

    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, [refreshVoices, supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setActiveTopicId(null);
    setActiveLabel(null);
  }, [supported]);

  const speak = useCallback(
    (text: string, meta?: { topicId?: string; label?: string }) => {
      if (!supported) {
        setError("Озвучивание не поддерживается в этом браузере. Попробуйте Chrome или Edge на десктопе.");
        return;
      }

      const trimmed = text.trim();
      if (!trimmed) {
        setError("Нет текста для озвучивания.");
        return;
      }

      setError(null);
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = speechLang;
      utterance.rate = Math.min(1.2, Math.max(0.8, rate));
      utterance.pitch = 1;
      utterance.volume = 1;

      const voiceList = window.speechSynthesis.getVoices();
      const picked = pickVoiceForLang(voiceList.length ? voiceList : voices, speechLang, gender);
      if (picked) utterance.voice = picked;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setActiveTopicId(meta?.topicId ?? null);
        setActiveLabel(meta?.label ?? meta?.topicId ?? "Текст");
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setActiveTopicId(null);
        setActiveLabel(null);
        utteranceRef.current = null;
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setActiveTopicId(null);
        setActiveLabel(null);
        utteranceRef.current = null;
        setError("Ошибка синтеза речи. Проверьте громкость и разрешения браузера.");
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);

      // Safari: иногда нужен повторный вызов после загрузки голосов
      if (voiceList.length === 0) {
        window.setTimeout(() => {
          const retryVoices = window.speechSynthesis.getVoices();
          if (retryVoices.length > 0 && utteranceRef.current === utterance) {
            const retryVoice = pickVoiceForLang(retryVoices, speechLang, gender);
            if (retryVoice) utterance.voice = retryVoice;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
          }
        }, 250);
      }
    },
    [gender, rate, speechLang, supported, voices],
  );

  const availableVoices = filterVoicesByLang(voices, speechLang);
  const selectedVoice = pickVoiceForLang(voices, speechLang, gender);

  return {
    supported,
    locale,
    setLocale,
    speechLang,
    rate,
    setRate,
    gender,
    setGender,
    voices: availableVoices,
    selectedVoice,
    isSpeaking,
    activeTopicId,
    activeLabel,
    error,
    speak,
    stop,
    refreshVoices,
  };
}
