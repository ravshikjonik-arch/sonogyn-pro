import { applyMedicalGlossary } from "../glossary/medical-glossary.ru";
import type { PostProcessOptions } from "../types";
import { normalizeClinicalUnits } from "./normalize-units";
import { applyVoiceCommands, type VoiceCommandSideEffect } from "./voice-commands";

export type PostProcessResult = {
  text: string;
  sideEffect: VoiceCommandSideEffect;
};

export function postProcessDictation(raw: string, options: PostProcessOptions = {}): PostProcessResult {
  const {
    applyGlossary = true,
    applyVoiceCommands: useCommands = true,
    normalizeUnits = true,
  } = options;

  let text = raw.trim();
  let sideEffect: VoiceCommandSideEffect = null;

  if (useCommands) {
    const cmd = applyVoiceCommands(text);
    text = cmd.text;
    sideEffect = cmd.sideEffect;
    if (sideEffect === "clear") return { text: "", sideEffect: "clear" };
  }

  if (applyGlossary) text = applyMedicalGlossary(text);
  if (normalizeUnits) text = normalizeClinicalUnits(text);

  return { text, sideEffect };
}
