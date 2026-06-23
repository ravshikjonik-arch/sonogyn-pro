import type { AiColposcopyAnalysis, ImageAnalysisProvider } from "./providers";
import { UnconfiguredAiColposcopyProvider } from "./providers";

export type AiColposcopyAnalyzeInput = {
  imageUrl: string;
  caseId: string;
  ifcpcSignIds?: string[];
};

export type AiColposcopyServiceResult = {
  configured: boolean;
  providerId: string;
  analysis: AiColposcopyAnalysis;
};

/** HTTP provider — calls CPI_AI_COLPOSCOPY_URL when configured in production. */
export class HttpAiColposcopyProvider implements ImageAnalysisProvider {
  readonly id = "http-remote";

  constructor(
    private readonly endpoint: string,
    private readonly apiKey?: string,
  ) {}

  async analyzeImage(input: AiColposcopyAnalyzeInput): Promise<AiColposcopyAnalysis> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        imageUrl: input.imageUrl,
        caseId: input.caseId,
        ifcpcSignIds: input.ifcpcSignIds ?? [],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      throw new Error(`AI colposcopy HTTP ${res.status}`);
    }

    const json = (await res.json()) as Partial<AiColposcopyAnalysis>;
    return {
      providerId: this.id,
      analyzedAt: json.analyzedAt ?? new Date().toISOString(),
      lesionMask: json.lesionMask ?? null,
      heatmapUrl: json.heatmapUrl ?? null,
      ifcpcPredictions: json.ifcpcPredictions ?? [],
      cin2PlusProbability: json.cin2PlusProbability ?? null,
      cin3PlusProbability: json.cin3PlusProbability ?? null,
      modelVersion: json.modelVersion ?? null,
    };
  }
}

let activeProvider: ImageAnalysisProvider | null = null;

/** Resolve provider from env (server-side). Returns unconfigured stub when env absent. */
export function resolveAiColposcopyProvider(env: {
  CPI_AI_COLPOSCOPY_URL?: string;
  CPI_AI_COLPOSCOPY_API_KEY?: string;
} = process.env as Record<string, string | undefined>): ImageAnalysisProvider {
  if (activeProvider) return activeProvider;

  const url = env.CPI_AI_COLPOSCOPY_URL?.trim();
  if (url) {
    activeProvider = new HttpAiColposcopyProvider(url, env.CPI_AI_COLPOSCOPY_API_KEY?.trim());
    return activeProvider;
  }

  activeProvider = new UnconfiguredAiColposcopyProvider();
  return activeProvider;
}

/** For tests — inject custom provider. */
export function setAiColposcopyProvider(provider: ImageAnalysisProvider | null): void {
  activeProvider = provider;
}

/** Part 11 — AI colposcopy orchestration (no mock probabilities when unconfigured). */
export async function analyzeColposcopyImage(
  input: AiColposcopyAnalyzeInput,
  env?: Record<string, string | undefined>,
): Promise<AiColposcopyServiceResult> {
  const provider = resolveAiColposcopyProvider(env);
  const analysis = await provider.analyzeImage(input);
  return {
    configured: provider.id !== "unconfigured",
    providerId: provider.id,
    analysis,
  };
}

/** Merge AI IFCPC predictions into colposcopy finding ids (deduped, threshold ≥ 0.5). */
export function mergeAiIfcpcPredictions(
  existingIds: string[],
  analysis: AiColposcopyAnalysis,
  threshold = 0.5,
): string[] {
  const aiIds = analysis.ifcpcPredictions
    .filter((p) => p.probability >= threshold)
    .map((p) => p.signId);
  return [...new Set([...existingIds, ...aiIds])];
}
