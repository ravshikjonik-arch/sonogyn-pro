"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { ClinicalImageAiAssistPanel } from "@/components/clinical-assistant/ClinicalImageAiAssistPanel";
import { ClinicalVoiceAssistPanel } from "@/components/clinical-assistant/ClinicalVoiceAssistPanel";
import type { NosologyAssistContext } from "@/lib/clinical-assistant/nosology-assist-context";
import { cn } from "@/lib/utils/cn";

type Props = {
  context: NosologyAssistContext;
  compact?: boolean;
  className?: string;
  onApplyProtocol?: (text: string) => void;
};

export function ClinicalAssistStrip({ context, compact, className, onApplyProtocol }: Props) {
  const [voiceTranscript, setVoiceTranscript] = useState("");

  return (
    <section
      className={cn(
        "sonogyn-glass-card space-y-4 rounded-2xl border border-[var(--clinical-border)] p-4 sm:p-5",
        className,
      )}
      aria-label="Голос и ИИ-помощь по УЗИ"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--clinical-primary)]" />
        <p className="text-sm font-black text-[var(--clinical-foreground)]">
          Голос + ИИ · {context.code ? `${context.code} · ` : ""}
          {context.title}
        </p>
      </div>

      <div className={cn("grid gap-4", compact ? "grid-cols-1" : "lg:grid-cols-2")}>
        <ClinicalVoiceAssistPanel
          context={context}
          transcript={voiceTranscript}
          onTranscriptChange={setVoiceTranscript}
        />
        <ClinicalImageAiAssistPanel
          context={context}
          voiceTranscript={voiceTranscript}
          onApplyProtocol={onApplyProtocol}
        />
      </div>
    </section>
  );
}
