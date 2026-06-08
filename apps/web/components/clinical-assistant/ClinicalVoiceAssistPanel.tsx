"use client";

import { AlertTriangle, Copy, Mic, MicOff, Trash2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClinicalSpeechRecognition } from "@/hooks/useClinicalSpeechRecognition";
import type { NosologyAssistContext } from "@/lib/clinical-assistant/nosology-assist-context";
import { parseVoiceProtocol } from "../../../mobile/src/features/fmf/logic/voiceNlp";

type Props = {
  context: NosologyAssistContext;
  transcript: string;
  onTranscriptChange: (value: string) => void;
  placeholder?: string;
};

export function ClinicalVoiceAssistPanel({
  context,
  transcript,
  onTranscriptChange,
  placeholder = "Диктуйте находки УЗИ или жалобы…",
}: Props) {
  const dictation = useClinicalSpeechRecognition({ continuous: true });
  const phrase = useClinicalSpeechRecognition({ continuous: false });

  useEffect(() => {
    if (dictation.transcript) onTranscriptChange(dictation.transcript);
  }, [dictation.transcript, onTranscriptChange]);

  useEffect(() => {
    if (phrase.transcript) {
      onTranscriptChange(
        transcript ? `${transcript} ${phrase.transcript}`.trim() : phrase.transcript,
      );
    }
  }, [phrase.transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmfParsed =
    context.voiceProfile === "fmf" && transcript.trim().length > 8
      ? parseVoiceProtocol(transcript)
      : null;

  const copyTranscript = useCallback(async () => {
    if (!transcript.trim()) return;
    try {
      await navigator.clipboard.writeText(transcript);
      toast.success("Текст скопирован");
    } catch {
      toast.error("Не удалось скопировать");
    }
  }, [transcript]);

  const error = dictation.error ?? phrase.error;

  return (
    <div className="space-y-3 rounded-2xl border border-sky-200/70 bg-sky-50/40 p-4 dark:border-sky-900/50 dark:bg-sky-950/25">
      <div className="flex flex-wrap items-center gap-2">
        <Mic className="h-4 w-4 text-sky-700 dark:text-sky-300" />
        <p className="text-sm font-black text-sky-950 dark:text-sky-100">Голосовой ввод</p>
        <Badge variant="outline" className="text-[10px]">
          {context.voiceProfile === "fmf" ? "FMF NLP" : "диктовка"}
        </Badge>
      </div>
      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Диктуйте протокол или ключевые измерения. Текст попадёт в ИИ-подсказку по снимку.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={dictation.listening ? "default" : "outline"}
          className="gap-1.5"
          disabled={!dictation.supported}
          onClick={() => (dictation.listening ? dictation.stop() : dictation.start())}
        >
          {dictation.listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          {dictation.listening ? "Стоп · диктовка" : "Диктовка"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={phrase.listening ? "default" : "outline"}
          className="gap-1.5"
          disabled={!phrase.supported || dictation.listening}
          onClick={() => (phrase.listening ? phrase.stop() : phrase.start())}
        >
          {phrase.listening ? "Слушаю…" : "Фраза"}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={() => void copyTranscript()}>
          <Copy className="h-3.5 w-3.5" />
          Копировать
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="gap-1.5"
          onClick={() => {
            dictation.reset();
            phrase.reset();
            onTranscriptChange("");
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Очистить
        </Button>
      </div>

      {error ? <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p> : null}
      {dictation.interim ? (
        <p className="text-xs italic text-[var(--clinical-foreground-muted)]">{dictation.interim}</p>
      ) : null}

      <Input
        value={transcript}
        onChange={(e) => onTranscriptChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Текст голосовой диктовки"
      />

      {fmfParsed && fmfParsed.alerts.length > 0 ? (
        <div className="space-y-1 rounded-xl border border-amber-300/60 bg-amber-50/80 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-100">
            <AlertTriangle className="h-3.5 w-3.5" />
            FMF · сигналы из диктовки
          </p>
          <ul className="list-inside list-disc text-xs leading-relaxed text-amber-950 dark:text-amber-100">
            {fmfParsed.alerts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {fmfParsed && Object.keys(fmfParsed.data).length > 0 ? (
        <p className="text-[10px] text-[var(--clinical-foreground-muted)]">
          Распознано:{" "}
          {Object.entries(fmfParsed.data)
            .slice(0, 8)
            .map(([k, v]) => `${k}=${String(v)}`)
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
