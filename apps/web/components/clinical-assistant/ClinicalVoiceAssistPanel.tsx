"use client";

import { AlertTriangle, Mic } from "lucide-react";
import { useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { DictationField } from "@/components/voice/DictationField";
import type { NosologyAssistContext } from "@/lib/clinical-assistant/nosology-assist-context";
import { parseVoiceProtocol } from "@repo/fmf/voice-protocol";

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
  const draftKey = `clinical-voice-${context.code ?? context.title.slice(0, 32)}`;

  const fmfParsed =
    context.voiceProfile === "fmf" && transcript.trim().length > 8
      ? parseVoiceProtocol(transcript)
      : null;

  const onClear = useCallback(() => {
    onTranscriptChange("");
  }, [onTranscriptChange]);

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

      <DictationField
        value={transcript}
        onChange={onTranscriptChange}
        onClear={onClear}
        draftKey={draftKey}
        placeholder={placeholder}
        enablePhrase
        showCommandHint
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
