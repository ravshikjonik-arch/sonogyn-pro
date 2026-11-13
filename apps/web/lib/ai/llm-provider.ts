/**
 * @deprecated Import from `@/lib/ai/gateway` for new code.
 * Kept as thin re-export so existing Evidence / chat / tutor callers keep working.
 *
 * Stage 2 AI Gateway: Colibri + Perplexity + OpenRouter, failover, cost meter.
 */

export type { GatewayProviderId as LlmProviderId, LlmPurpose, ResolvedLlm } from "./gateway/types";
export {
  hasAnyLlmConfigured,
  llmSupportsJsonObjectMode,
  resolveLlmProvider,
  resolveProviderChain,
} from "./gateway/resolve";
