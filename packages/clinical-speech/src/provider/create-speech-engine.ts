import { ServerWhisperEngine } from "../engines/server-whisper-engine";
import { WebSpeechEngine } from "../engines/web-speech-engine";
import type { SpeechEngineMode, SpeechRecognitionEngine } from "../types";

export type CreateSpeechEngineOptions = {
  transcribeUrl?: string;
  /** false — не выбирать server в auto (API недоступен) */
  serverTranscribeAvailable?: boolean;
};

export function createSpeechEngine(
  mode: SpeechEngineMode,
  options: CreateSpeechEngineOptions = {},
): SpeechRecognitionEngine | null {
  const web = new WebSpeechEngine();
  const server = new ServerWhisperEngine({ transcribeUrl: options.transcribeUrl });

  if (mode === "device") {
    return web.isSupported() ? web : null;
  }

  if (mode === "server") {
    return server.isSupported() ? server : null;
  }

  // auto — устройство быстрее; Safari/Firefox без Web Speech → сервер
  if (web.isSupported()) return web;
  if (server.isSupported() && options.serverTranscribeAvailable !== false) {
    return server;
  }
  return server.isSupported() ? server : null;
}

export function isWebSpeechSupported(): boolean {
  return new WebSpeechEngine().isSupported();
}

export function isServerWhisperCaptureSupported(): boolean {
  return new ServerWhisperEngine().isSupported();
}

export function resolveSpeechEngineAvailability(
  mode: SpeechEngineMode,
  options: CreateSpeechEngineOptions = {},
): boolean {
  return createSpeechEngine(mode, options) !== null;
}
