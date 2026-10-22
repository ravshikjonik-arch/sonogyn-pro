export * from "./types";
export { speechErrorMessageRu } from "./errors";
export { applyMedicalGlossary, MEDICAL_GLOSSARY_REPLACEMENTS } from "./glossary/medical-glossary.ru";
export { applyVoiceCommands, type VoiceCommandSideEffect } from "./postprocess/voice-commands";
export { normalizeClinicalUnits, findMeasurementSpans } from "./postprocess/normalize-units";
export { postProcessDictation } from "./postprocess/pipeline";
export { WebSpeechEngine } from "./engines/web-speech-engine";
export { ServerWhisperEngine } from "./engines/server-whisper-engine";
export {
  createSpeechEngine,
  isWebSpeechSupported,
  isServerWhisperCaptureSupported,
  resolveSpeechEngineAvailability,
  type CreateSpeechEngineOptions,
} from "./provider/create-speech-engine";
export { loadDictationDraft, saveDictationDraft, clearDictationDraft } from "./draft/storage";
