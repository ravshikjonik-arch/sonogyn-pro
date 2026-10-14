import type { SonogynClinicalDomain } from "./rag-context";

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
