import { postProcessDictation, type VoiceCommandSideEffect } from "@repo/clinical-speech";

export type AppendDictationResult = {
  text: string;
  sideEffect: VoiceCommandSideEffect;
};

/** Склеить распознанный фрагмент с полем протокола (общая постобработка web/mobile). */
export function appendDictationText(previous: string, rawChunk: string): AppendDictationResult {
  const { text, sideEffect } = postProcessDictation(rawChunk);
  if (sideEffect === "clear") return { text: "", sideEffect: "clear" };
  const chunk = text.trim();
  if (!chunk) return { text: previous, sideEffect };
  const merged = previous.trim() ? `${previous.trim()} ${chunk}` : chunk;
  return { text: merged, sideEffect };
}
