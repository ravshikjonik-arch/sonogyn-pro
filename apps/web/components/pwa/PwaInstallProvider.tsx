"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  canShowNativeInstallPrompt,
  isStandaloneDisplayMode,
  shouldShowIosInstallInstructions,
} from "@/lib/pwa/install-capability";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaInstallContextValue = {
  installed: boolean;
  canNativeInstall: boolean;
  showIosInstructions: boolean;
  offerInstall: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ua, setUa] = useState("");

  useEffect(() => {
    setInstalled(isStandaloneDisplayMode());
    setUa(navigator.userAgent);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const canNativeInstall = useMemo(
    () => canShowNativeInstallPrompt(Boolean(deferredPrompt), ua),
    [deferredPrompt, ua],
  );

  const showIosInstructions = useMemo(() => shouldShowIosInstallInstructions(ua), [ua]);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!deferredPrompt) return "unavailable";
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      setInstalled(true);
    }
    return choice.outcome;
  }, [deferredPrompt]);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      installed,
      canNativeInstall,
      showIosInstructions,
      offerInstall: !installed,
      promptInstall,
    }),
    [installed, canNativeInstall, showIosInstructions, promptInstall],
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall(): PwaInstallContextValue {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }
  return ctx;
}
