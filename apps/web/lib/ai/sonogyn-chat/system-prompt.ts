import { buildObstetricSystemInstructions } from "./system-prompt-obstetric";
import { buildGynecologySystemInstructions } from "./system-prompt-gynecology";
import { buildRagContext, type SonogynClinicalDomain } from "./rag-context";
import { promptVersionLabel, resolvePromptBundle } from "./prompt-registry";

export function buildSonogynSystemPrompt(params: {
  domain: SonogynClinicalDomain;
  userText: string;
  hasImages: boolean;
  /** Server clinical tools are attached to this request (AI SDK path). Default: no tools. */
  toolsAvailable?: boolean;
}): { prompt: string; promptVersion: string } {
  const bundle = resolvePromptBundle(params.domain);
  const toolsAvailable = params.toolsAvailable ?? false;
  const base =
    bundle === "obstetric"
      ? buildObstetricSystemInstructions(params.hasImages, toolsAvailable)
      : buildGynecologySystemInstructions(params.hasImages, toolsAvailable);

  const rag = buildRagContext(params.domain, params.userText);

  const prompt = [
    base,
    "",
    "Справочный контекст приложения (источник истины, не выдумывай пороги):",
    rag || "(общий режим — уточни орган и классификацию)",
  ].join("\n");

  return { prompt, promptVersion: promptVersionLabel(bundle) };
}
