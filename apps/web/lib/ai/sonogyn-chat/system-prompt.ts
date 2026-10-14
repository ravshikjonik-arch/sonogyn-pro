import { buildObstetricSystemInstructions } from "./system-prompt-obstetric";
import { buildGynecologySystemInstructions } from "./system-prompt-gynecology";
import { buildRagContext, type SonogynClinicalDomain } from "./rag-context";
import { promptVersionLabel, resolvePromptBundle } from "./prompt-registry";

export function buildSonogynSystemPrompt(params: {
  domain: SonogynClinicalDomain;
  userText: string;
  hasImages: boolean;
}): { prompt: string; promptVersion: string } {
  const bundle = resolvePromptBundle(params.domain);
  const base =
    bundle === "obstetric"
      ? buildObstetricSystemInstructions(params.hasImages)
      : buildGynecologySystemInstructions(params.hasImages);

  const rag = buildRagContext(params.domain, params.userText);

  const prompt = [
    base,
    "",
    "Справочный контекст приложения (источник истины, не выдумывай пороги):",
    rag || "(общий режим — уточни орган и классификацию)",
  ].join("\n");

  return { prompt, promptVersion: promptVersionLabel(bundle) };
}
