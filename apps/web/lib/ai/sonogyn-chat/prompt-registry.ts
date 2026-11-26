import type { SonogynClinicalDomain } from "./rag-context";
import { FMF_AI_RULES, FMF_ASSESSMENT_TOOL_DESCRIPTIONS } from "@/lib/fmf/fmf-tool-descriptions";

/** Versioned prompt bundles — persisted in ai_chat_events / messages. */
export const SONOGYN_PROMPT_VERSION = "2026.08.30-hardening-v1";

export type PromptBundleKey = "gynecology" | "obstetric" | "general";

const OBSTETRIC_DOMAINS = new Set<SonogynClinicalDomain>(["obstetric"]);

export function resolvePromptBundle(domain: SonogynClinicalDomain): PromptBundleKey {
  if (OBSTETRIC_DOMAINS.has(domain)) return "obstetric";
  if (domain === "general") return "general";
  return "gynecology";
}

export function promptVersionLabel(bundle: PromptBundleKey): string {
  return `${SONOGYN_PROMPT_VERSION}:${bundle}`;
}

/** FMF 11–13: tool-call catalog (descriptions only; execution on /tools/refs/fmf-11-13). */
export function fmfAssistantToolCatalogBlock(): string {
  const lines = FMF_ASSESSMENT_TOOL_DESCRIPTIONS.map(
    (t) => `- ${t.id}: ${t.title} — ${t.source}`,
  );
  return ["FMF assessment tools (stage 1, описание без исполнения в чате):", ...lines, ...FMF_AI_RULES].join(
    "\n",
  );
}
