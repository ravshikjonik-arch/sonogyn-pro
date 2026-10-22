import { postProcessDictation } from "@repo/clinical-speech";

/** Склеить распознанный фрагмент с полем протокола (общая постобработка web/mobile). */
export function appendDictationText(previous: string, rawChunk: string): string {
  const { text, sideEffect } = postProcessDictation(rawChunk);
  if (sideEffect === "clear") return "";
  const chunk = text.trim();
  if (!chunk) return previous;
  return previous.trim() ? `${previous.trim()} ${chunk}` : chunk;
}
