/**
 * SonoGyn AI Gateway — shared types (Stage 2).
 * UI / routes depend on this layer, not on a single vendor.
 */

export type LlmPurpose = "text" | "vision" | "evidence";

/** Cloud + local OpenAI-compatible endpoints. */
export type GatewayProviderId = "colibri" | "perplexity" | "openrouter";

export type ResolvedLlm = {
  provider: GatewayProviderId;
  apiKey: string;
  url: string;
  model: string;
  /** Local sidecar — no cloud $ (still meter tokens if returned). */
  isLocal?: boolean;
};

export type GatewayChatMessage =
  | { role: string; content: string }
  | {
      role: string;
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

export type GatewayUsage = {
  promptTokens: number | null;
  completionTokens: number | null;
  estimatedCostUsd: number | null;
};

export type GatewayChatSuccess = {
  ok: true;
  provider: GatewayProviderId;
  model: string;
  content: string;
  raw: unknown;
  usage: GatewayUsage;
  attempts: number;
  usedFallback: boolean;
};

export type GatewayChatFailure = {
  ok: false;
  error: string;
  attempts: number;
  tried: GatewayProviderId[];
};

export type GatewayChatResult = GatewayChatSuccess | GatewayChatFailure;

export type GatewayProviderStatus = {
  id: GatewayProviderId;
  configured: boolean;
  healthy: boolean | null;
  model: string | null;
  detail: string;
};
