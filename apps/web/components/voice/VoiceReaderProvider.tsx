"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

type VoiceReaderContextValue = ReturnType<typeof useSpeechSynthesis> & {
  pageTextOverride: string | null;
  setPageTextOverride: (text: string | null) => void;
  speakPage: () => void;
  speakSelection: () => void;
  speakText: (text: string, label?: string) => void;
};

const VoiceReaderContext = createContext<VoiceReaderContextValue | null>(null);

function extractMainReadableText(): string {
  if (typeof document === "undefined") return "";

  const root =
    document.querySelector<HTMLElement>("[data-voice-content]") ??
    document.querySelector<HTMLElement>("main");

  if (!root) return "";

  const clone = root.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      "script, style, nav, button, svg, [data-voice-ignore], [aria-hidden='true']",
    )
    .forEach((node) => node.remove());

  return clone.innerText.replace(/\n{3,}/g, "\n\n").trim();
}

function getBrowserSelectionText(): string {
  if (typeof window === "undefined") return "";
  return window.getSelection()?.toString().trim() ?? "";
}

export function VoiceReaderProvider({ children }: { children: ReactNode }) {
  const tts = useSpeechSynthesis();
  const [pageTextOverride, setPageTextOverride] = useState<string | null>(null);

  const speakText = useCallback(
    (text: string, label?: string) => {
      tts.speak(text, { label: label ?? "Текст", topicId: "__custom__" });
    },
    [tts],
  );

  const speakPage = useCallback(() => {
    const text = pageTextOverride?.trim() || extractMainReadableText();
    if (!text) return;
    speakText(text, pageTextOverride ? "Контент страницы" : "Страница");
  }, [pageTextOverride, speakText]);

  const speakSelection = useCallback(() => {
    const selected = getBrowserSelectionText();
    if (!selected) return;
    speakText(selected, "Выделение");
  }, [speakText]);

  const value = useMemo(
    () => ({
      ...tts,
      pageTextOverride,
      setPageTextOverride,
      speakPage,
      speakSelection,
      speakText,
    }),
    [tts, pageTextOverride, speakPage, speakSelection, speakText],
  );

  return <VoiceReaderContext.Provider value={value}>{children}</VoiceReaderContext.Provider>;
}

export function VoiceReaderRouteSync({ pathname }: { pathname: string }) {
  const ctx = useVoiceReaderContext();
  useEffect(() => {
    ctx.setPageTextOverride(null);
    ctx.stop();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function useVoiceReaderContext(): VoiceReaderContextValue {
  const ctx = useContext(VoiceReaderContext);
  if (!ctx) {
    throw new Error("useVoiceReaderContext must be used within VoiceReaderProvider");
  }
  return ctx;
}

export function useOptionalVoiceReader(): VoiceReaderContextValue | null {
  return useContext(VoiceReaderContext);
}

export function useVoicePageText(text: string | null | undefined) {
  const ctx = useOptionalVoiceReader();
  useEffect(() => {
    if (!ctx) return;
    ctx.setPageTextOverride(text?.trim() ? text.trim() : null);
    return () => ctx.setPageTextOverride(null);
  }, [ctx, text]);
}
