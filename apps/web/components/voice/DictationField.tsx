"use client";

import { useSpeechDictation } from "@repo/clinical-speech/react";
import { willUseCloudServerStt, type SpeechEngineMode } from "@repo/clinical-speech";
import { Copy, Mic, MicOff, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useOptionalVoiceReader } from "@/components/voice/VoiceReaderProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { grantCloudSttConsent, hasCloudSttConsent } from "@/lib/voice/cloud-stt-consent";
import { cn } from "@/lib/utils/cn";

function MicLevelBar({ level, active }: { level: number; active: boolean }) {
  if (!active) return null;
  const pct = Math.round(Math.min(1, Math.max(0, level)) * 100);
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--clinical-border)]"
      aria-hidden
    >
      <div
        className="h-full rounded-full bg-sky-500 transition-[width] duration-75 motion-reduce:transition-none dark:bg-sky-400"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export type DictationFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** sessionStorage ключ черновика */
  draftKey?: string;
  placeholder?: string;
  ariaLabel?: string;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  enablePhrase?: boolean;
  showCommandHint?: boolean;
  onClear?: () => void;
};

export function DictationField({
  value,
  onChange,
  draftKey,
  placeholder,
  ariaLabel = "Текст диктовки",
  multiline = false,
  className,
  inputClassName,
  enablePhrase = false,
  showCommandHint = false,
  onClear,
}: DictationFieldProps) {
  const voice = useOptionalVoiceReader();
  const valueRef = useRef(value);
  valueRef.current = value;

  const [serverSttAvailable, setServerSttAvailable] = useState(true);
  const [cloudConsent, setCloudConsent] = useState(false);
  const engineMode =
    (process.env.NEXT_PUBLIC_SPEECH_STT_MODE as SpeechEngineMode | undefined) ?? "auto";

  useEffect(() => {
    setCloudConsent(hasCloudSttConsent());
  }, []);

  useEffect(() => {
    fetch("/api/ai/speech/transcribe", { credentials: "include" })
      .then(async (res) => {
        if (res.status === 401) {
          setServerSttAvailable(false);
          return;
        }
        if (!res.ok) {
          setServerSttAvailable(false);
          return;
        }
        const data = (await res.json()) as { available?: boolean };
        setServerSttAvailable(Boolean(data.available));
      })
      .catch(() => setServerSttAvailable(false));
  }, []);

  const handleSideEffect = useCallback(
    (effect: "read" | "clear" | null) => {
      if (effect === "clear") {
        onChange("");
        onClear?.();
      }
      if (effect === "read") {
        const text = valueRef.current.trim();
        if (text) voice?.speakText(text, "Диктовка");
        else toast.message("Нет текста для озвучки");
      }
    },
    [onChange, onClear, voice],
  );

  const serverAllowed =
    serverSttAvailable &&
    (!willUseCloudServerStt(engineMode, { serverTranscribeAvailable: serverSttAvailable }) ||
      cloudConsent);

  const needsCloudConsent =
    serverSttAvailable &&
    willUseCloudServerStt(engineMode, { serverTranscribeAvailable: serverSttAvailable }) &&
    !cloudConsent;

  const dictation = useSpeechDictation({
    continuous: true,
    interimResults: true,
    draftKey,
    enableMicLevel: true,
    engineMode,
    serverTranscribeAvailable: serverAllowed,
    onSideEffect: handleSideEffect,
  });

  const phrase = useSpeechDictation({
    continuous: false,
    interimResults: false,
    enableMicLevel: false,
    engineMode,
    serverTranscribeAvailable: serverAllowed,
  });

  useEffect(() => {
    if (dictation.transcript !== valueRef.current) {
      onChange(dictation.transcript);
    }
  }, [dictation.transcript, onChange]);

  const setTranscript = dictation.setTranscript;
  const resetPhrase = phrase.reset;

  useEffect(() => {
    if (!phrase.transcript.trim()) return;
    const merged = valueRef.current.trim()
      ? `${valueRef.current.trim()} ${phrase.transcript.trim()}`
      : phrase.transcript.trim();
    setTranscript(merged);
    onChange(merged);
    resetPhrase();
  }, [onChange, phrase.transcript, resetPhrase, setTranscript]);

  const handleFieldChange = (next: string) => {
    dictation.setTranscript(next);
    onChange(next);
  };

  const copyText = async () => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Текст скопирован");
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  const clearAll = () => {
    dictation.reset();
    phrase.reset();
    onChange("");
    onClear?.();
  };

  const error = dictation.error ?? phrase.error;
  const listening = dictation.listening || phrase.listening;

  const onGrantCloudConsent = () => {
    grantCloudSttConsent();
    setCloudConsent(true);
  };

  const startDictation = () => {
    if (needsCloudConsent) {
      toast.message("Подтвердите отправку аудио на сервер для расшифровки.");
      return;
    }
    void dictation.start();
  };

  return (
    <div className={cn("space-y-2", className)} data-e2e="dictation-field">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={dictation.listening ? "default" : "outline"}
          className="gap-1.5"
          disabled={!dictation.supported}
          onClick={() => (dictation.listening ? dictation.stop() : startDictation())}
        >
          {dictation.listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          {dictation.listening ? "Стоп · диктовка" : "Диктовка"}
        </Button>
        {enablePhrase ? (
          <Button
            type="button"
            size="sm"
            variant={phrase.listening ? "default" : "outline"}
            className="gap-1.5"
            disabled={!phrase.supported || dictation.listening}
            onClick={() => (phrase.listening ? phrase.stop() : void phrase.start())}
          >
            {phrase.listening ? "Слушаю…" : "Фраза"}
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={() => void copyText()}>
          <Copy className="h-3.5 w-3.5" />
          Копировать
        </Button>
        <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={clearAll}>
          <Trash2 className="h-3.5 w-3.5" />
          Очистить
        </Button>
      </div>

      <MicLevelBar level={dictation.level} active={dictation.listening} />

      {needsCloudConsent ? (
        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-amber-300/70 bg-amber-50/90 p-3 text-xs leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-amber-400"
            checked={cloudConsent}
            onChange={(e) => {
              if (e.target.checked) onGrantCloudConsent();
            }}
            data-e2e="cloud-stt-consent"
          />
          <span>
            Аудио будет отправлено на сервер SonoGyn Pro / провайдера STT для расшифровки (Whisper). Не
            диктуйте ФИО, телефон, полис и другие персональные данные. Согласие действует до закрытия вкладки.
          </span>
        </label>
      ) : null}

      {dictation.activeEngineId === "server-whisper" ? (
        <p className="text-[10px] text-[var(--clinical-foreground-muted)]">
          Серверное STT (Whisper) · не диктуйте ФИО, телефон и номера документов.
        </p>
      ) : null}

      {error ? <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p> : null}
      {dictation.interim ? (
        <p className="text-xs italic text-[var(--clinical-foreground-muted)]" aria-live="polite">
          {dictation.interim}
        </p>
      ) : null}

      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => handleFieldChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={cn("min-h-[120px]", inputClassName)}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => handleFieldChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={inputClassName}
        />
      )}

      {showCommandHint ? (
        <p className="text-[10px] leading-relaxed text-[var(--clinical-foreground-muted)]">
          Голосом: «точка», «запятая», «новая строка», «очистить», «прочитать», «отменить» (последнее слово).
        </p>
      ) : null}

      {listening ? (
        <span className="sr-only" aria-live="polite">
          Идёт запись с микрофона
        </span>
      ) : null}
    </div>
  );
}
