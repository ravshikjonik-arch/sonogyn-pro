export type SpeechEngineMode = "auto" | "device" | "server";

export type SpeechDictationStatus = "idle" | "listening" | "processing" | "error";

export type SpeechRecognitionCallbacks = {
  onInterim?: (text: string) => void;
  onFinal?: (text: string, confidence?: number) => void;
  onError?: (message: string, code?: string) => void;
  onLevel?: (level: number) => void;
  onEnd?: () => void;
};

export interface SpeechRecognitionEngine {
  readonly id: "web-speech" | "server-whisper";
  readonly label: string;
  isSupported(): boolean;
  start(options: {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
  }): void;
  stop(): void;
  abort(): void;
  setCallbacks(callbacks: SpeechRecognitionCallbacks): void;
}

export type PostProcessOptions = {
  applyGlossary?: boolean;
  applyVoiceCommands?: boolean;
  normalizeUnits?: boolean;
};
