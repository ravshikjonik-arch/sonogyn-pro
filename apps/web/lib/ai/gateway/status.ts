import {
  colibriChatUrl,
  isColibriEnabled,
  listConfiguredProviderIds,
  resolveProviderChain,
} from "./resolve";
import type { GatewayProviderId, GatewayProviderStatus, LlmPurpose } from "./types";

async function pingOpenAiCompatible(url: string, apiKey: string): Promise<{ ok: boolean; detail: string }> {
  const modelsUrl = url.replace(/\/chat\/completions\/?$/, "/models");
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(modelsUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) return { ok: true, detail: `models ${res.status}` };
    // Some local servers lack /models — treat 404 as reachable
    if (res.status === 404) return { ok: true, detail: "reachable (no /models)" };
    return { ok: false, detail: `HTTP ${res.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, detail: msg.includes("Abort") ? "timeout" : msg.slice(0, 120) };
  }
}

export async function getGatewayStatus(purpose: LlmPurpose = "text"): Promise<{
  purpose: LlmPurpose;
  configured: GatewayProviderId[];
  chain: Array<{ provider: GatewayProviderId; model: string; isLocal?: boolean }>;
  providers: GatewayProviderStatus[];
}> {
  const configured = listConfiguredProviderIds();
  const chain = resolveProviderChain(purpose).map((c) => ({
    provider: c.provider,
    model: c.model,
    isLocal: c.isLocal,
  }));

  const providers: GatewayProviderStatus[] = [];

  // Colibri — ping only when explicitly enabled (never blocks chat hot path).
  {
    const model = process.env.COLIBRI_MODEL?.trim() || null;
    const enabled = isColibriEnabled();
    const configuredColibri = configured.includes("colibri");
    let healthy: boolean | null = null;
    let detail = enabled
      ? configuredColibri
        ? "enabled"
        : "enabled but incomplete config"
      : "disabled (COLIBRI_ENABLED off / unset)";
    if (enabled && configuredColibri) {
      const ping = await pingOpenAiCompatible(
        colibriChatUrl(),
        process.env.COLIBRI_API_KEY?.trim() || "colibri-local",
      );
      healthy = ping.ok;
      detail = ping.detail;
    }
    providers.push({
      id: "colibri",
      configured: configuredColibri,
      healthy,
      model: enabled ? model : null,
      detail,
    });
  }

  // Perplexity — key presence only (no live ping; billed)
  providers.push({
    id: "perplexity",
    configured: Boolean(process.env.PERPLEXITY_API_KEY?.trim()),
    healthy: process.env.PERPLEXITY_API_KEY?.trim() ? true : null,
    model: process.env.PERPLEXITY_MODEL?.trim() || "sonar-pro",
    detail: process.env.PERPLEXITY_API_KEY?.trim() ? "api key set" : "missing PERPLEXITY_API_KEY",
  });

  // OpenRouter
  providers.push({
    id: "openrouter",
    configured: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    healthy: process.env.OPENROUTER_API_KEY?.trim() ? true : null,
    model: process.env.OPENROUTER_ORADS_MODEL?.trim() || "openai/gpt-4o-mini",
    detail: process.env.OPENROUTER_API_KEY?.trim() ? "api key set" : "missing OPENROUTER_API_KEY",
  });

  return { purpose, configured, chain, providers };
}
