"use client";

import { Volume2 } from "lucide-react";

import { useOptionalVoiceReader } from "@/components/voice/VoiceReaderProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type SpeakButtonProps = {
  text: string;
  label: string;
  className?: string;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary" | "ghost";
};

export function SpeakButton({
  text,
  label,
  className,
  size = "sm",
  variant = "outline",
}: SpeakButtonProps) {
  const voice = useOptionalVoiceReader();
  if (!voice?.supported) return null;

  const trimmed = text.trim();
  if (!trimmed) return null;

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn("gap-1.5", className)}
      onClick={() => voice.speakText(trimmed, label)}
    >
      <Volume2 className="h-3.5 w-3.5" />
      Озвучить
    </Button>
  );
}
