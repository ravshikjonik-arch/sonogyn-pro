"use client";

/**
 * Voice reader stub — full TTS/STT feature is not yet implemented.
 * Provider and route-sync are no-ops until the voice feature is built out.
 */
export function VoiceReaderProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function VoiceReaderRouteSync(_props: { pathname: string }) {
  return null;
}
