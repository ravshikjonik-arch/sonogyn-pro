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

/**
 * Both flags must agree: the server flag selects the transport, the client flag is inlined at build time.
 * The client also follows the `X-Sonogyn-Ai-Transport` header, so a mismatch degrades to a logged warning.
 */
export function aiSdkFlagState(): { server: boolean; client: boolean; consistent: boolean } {
  const server = isAiSdkEnabled();
  const client = isAiSdkEnabledClient();
  return { server, client, consistent: server === client };
}
