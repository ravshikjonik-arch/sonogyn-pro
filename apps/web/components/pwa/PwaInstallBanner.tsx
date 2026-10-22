"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { openPwaInstall } from "@/lib/pwa/install-bus";
import {
  markInstallPromptDismissed,
  shouldShowAutoInstallPrompt,
} from "@/lib/pwa/install-prompt-storage";

/**
 * Авто-предложение установки (production): beforeinstallprompt или iOS Safari, cadence 7 дней.
 */
export function PwaInstallBanner() {
  const { offerInstall, installed, canNativeInstall, showIosInstructions } = usePwaInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (installed || !offerInstall) return;
    if (!canNativeInstall && !showIosInstructions) return;
    if (!shouldShowAutoInstallPrompt()) return;

    const timer = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(timer);
  }, [offerInstall, installed, canNativeInstall, showIosInstructions]);

  if (!visible) return null;

  function dismiss() {
    markInstallPromptDismissed();
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-banner-title"
      className="fixed bottom-20 left-4 right-4 z-[90] mx-auto flex max-w-md flex-col gap-3 rounded-[var(--radius-card,12px)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 shadow-lg sm:bottom-4 sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p id="pwa-install-banner-title" className="text-sm font-semibold text-[var(--text-primary)]">
          Установить SonoGyn Pro
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          Быстрый доступ к калькуляторам с рабочего стола. Чат и AI — только онлайн.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            openPwaInstall({ source: "banner" });
            dismiss();
          }}
        >
          Как установить
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          aria-label="Закрыть предложение установки"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
