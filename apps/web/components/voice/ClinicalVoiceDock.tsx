"use client";

import { ChevronDown, ChevronUp, Square, TextSelect, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

import { useVoiceReaderContext } from "@/components/voice/VoiceReaderProvider";
import { APP_LOCALES, type AppLocale } from "@/lib/i18n/locale";
import type { VoiceGender } from "@/hooks/useSpeechSynthesis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function ClinicalVoiceDock() {
  const [open, setOpen] = useState(false);
  const voice = useVoiceReaderContext();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
      data-voice-ignore
    >
      {open ? (
        <div
          className={cn(
            "w-[min(100vw-2rem,22rem)] rounded-2xl border border-[var(--clinical-border)]",
            "bg-[var(--clinical-card)] p-4 shadow-[var(--clinical-card-shadow)]",
            "sonogyn-enter",
          )}
          role="region"
          aria-label="Озвучивание текста"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-[var(--clinical-foreground)]">Озвучивание</p>
              <p className="text-[11px] text-[var(--clinical-foreground-muted)]">
                {voice.speechLang} · Web Speech API
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setOpen(false)}
              aria-label="Свернуть"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {!voice.supported ? (
            <p className="mb-3 rounded-lg border border-amber-400/40 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              TTS недоступен. Chrome или Edge на десктопе.
            </p>
          ) : null}

          {voice.isSpeaking ? (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-[var(--clinical-primary-muted)]/40 px-3 py-2 text-xs">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--clinical-primary)]" />
              <span className="flex-1 truncate font-medium">Читаю: {voice.activeLabel}</span>
            </div>
          ) : null}

          {voice.error ? (
            <p className="mb-3 text-xs text-red-600 dark:text-red-300">{voice.error}</p>
          ) : null}

          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!voice.supported}
              onClick={voice.speakPage}
              className="gap-1.5"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Страница
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!voice.supported}
              onClick={voice.speakSelection}
              className="gap-1.5"
            >
              <TextSelect className="h-3.5 w-3.5" />
              Выделение
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!voice.isSpeaking}
              onClick={voice.stop}
              className="gap-1.5"
            >
              <Square className="h-3.5 w-3.5" />
              Стоп
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            <label className="block space-y-1">
              <span className="font-medium text-[var(--clinical-foreground-muted)]">Язык</span>
              <select
                className="h-9 w-full rounded-lg border border-[var(--clinical-border)] bg-white px-2 dark:bg-[var(--clinical-muted)]"
                value={voice.locale}
                disabled={voice.isSpeaking}
                onChange={(e) => voice.setLocale(e.target.value as AppLocale)}
              >
                {APP_LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="font-medium text-[var(--clinical-foreground-muted)]">Голос</span>
              <select
                className="h-9 w-full rounded-lg border border-[var(--clinical-border)] bg-white px-2 dark:bg-[var(--clinical-muted)]"
                value={voice.gender}
                disabled={voice.isSpeaking}
                onChange={(e) => voice.setGender(e.target.value as VoiceGender)}
              >
                <option value="female">Женский</option>
                <option value="male">Мужской</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--clinical-foreground-muted)]">Скорость</span>
                <Badge variant="outline" className="text-[10px]">
                  {voice.rate.toFixed(1)}×
                </Badge>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.2}
                step={0.1}
                value={voice.rate}
                disabled={voice.isSpeaking}
                onChange={(e) => voice.setRate(Number(e.target.value))}
                className="h-1.5 w-full accent-[var(--clinical-primary)]"
              />
            </label>
          </div>
        </div>
      ) : null}

      <Button
        type="button"
        size="icon"
        className={cn(
          "h-12 w-12 rounded-full shadow-lg",
          voice.isSpeaking && "ring-2 ring-[var(--clinical-primary)] ring-offset-2",
        )}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Свернуть озвучивание" : "Открыть озвучивание"}
      >
        {voice.isSpeaking ? (
          <VolumeX className="h-5 w-5 animate-pulse" />
        ) : open ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
