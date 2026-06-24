/** Part 11 — AI Colposcopy provider interfaces (production extension points). */

export type IfcpcPrediction = {
  signId: string;
  probability: number;
};

export type LesionMask = {
  format: "rle" | "polygon" | "bitmap_url";
  data: string;
  width: number;
  height: number;
};

export type AiColposcopyAnalysis = {
  providerId: string;
  analyzedAt: string;
  lesionMask: LesionMask | null;
  heatmapUrl: string | null;
  ifcpcPredictions: IfcpcPrediction[];
  cin2PlusProbability: number | null;
  cin3PlusProbability: number | null;
  modelVersion: string | null;
};

export interface ImageAnalysisProvider {
  readonly id: string;
  analyzeImage(input: { imageUrl: string; caseId: string }): Promise<AiColposcopyAnalysis>;
}

export interface LesionDetectionProvider {
  readonly id: string;
  detectLesions(input: { imageUrl: string }): Promise<LesionMask | null>;
}

export interface RiskPredictionProvider {
  readonly id: string;
  predictRisk(input: { imageUrl: string; ifcpcSignIds: string[] }): Promise<{
    cin2Plus: number;
    cin3Plus: number;
  }>;
}

/** Returns null analysis when AI pipeline is not configured (no mock probabilities). */
export class UnconfiguredAiColposcopyProvider implements ImageAnalysisProvider {
  readonly id = "unconfigured";

  async analyzeImage(): Promise<AiColposcopyAnalysis> {
    return {
      providerId: this.id,
      analyzedAt: new Date().toISOString(),
      lesionMask: null,
      heatmapUrl: null,
      ifcpcPredictions: [],
      cin2PlusProbability: null,
      cin3PlusProbability: null,
      modelVersion: null,
    };
  }
}
