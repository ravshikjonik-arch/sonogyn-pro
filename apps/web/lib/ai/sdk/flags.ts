/** Server: Vercel AI SDK path for `/api/ai/chat` streaming. */
export function isAiSdkEnabled(): boolean {
  const v = process.env.AI_SDK_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true";
}

/** Client: prefer AI SDK text stream consumer in Sonogyn Copilot. */
export function isAiSdkEnabledClient(): boolean {
  const v = process.env.NEXT_PUBLIC_AI_SDK_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true";
}
