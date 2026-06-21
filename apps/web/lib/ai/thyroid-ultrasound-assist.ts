import { randomUUID } from "node:crypto";

import {
  assistFromTiradsText,
  type TiradsAcrInput,
  type TiradsNlpResult,
} from "@repo/tirads-acr";

import type { UsVisionAnalysisResult } from "@/lib/ai/us-vision/types";
import { analyzeFramesWithWorker, readUsAiWorkerConfig } from "@/lib/ai/us-vision/worker-client";

export type ThyroidAiAssistInput = {
  freeText?: string;
  clinicalContext?: string;
  frames?: Array<{
    fileName: string;
    mimeType: string;
    base64: string;
  }>;
};

export type ThyroidAiAssistResult = TiradsNlpResult & {
  pipeline: string;
  workerSummary?: string;
  workerImpression?: string;
  workerRecommendations?: string[];
  workerScorecard?: string | null;
  workerFindings?: string[];
  mergedText: string;
  parsedInput: TiradsAcrInput;
};

function visionToFreeText(vision: UsVisionAnalysisResult): string {
  const parts: string[] = [];
  if (vision.studySummary) parts.push(vision.studySummary);
  if (vision.impression) parts.push(vision.impression);
  if (vision.scorecard) parts.push(vision.scorecard);
  for (const frame of vision.frames) {
    if (frame.planeGuess) parts.push(frame.planeGuess);
    parts.push(...frame.findings);
    if (frame.orads) parts.push(`O-RADS ${frame.orads}`);
    if (frame.birads) parts.push(`BI-RADS ${frame.birads}`);
  }
  return parts.join(". ");
}

export async function analyzeThyroidUltrasoundAssist(input: ThyroidAiAssistInput): Promise<ThyroidAiAssistResult> {
  let pipeline = "tirads-nlp-assist-v1";
  let workerSummary: string | undefined;
  let workerImpression: string | undefined;
  let workerRecommendations: string[] | undefined;
  let workerScorecard: string | null | undefined;
  let workerFindings: string[] = [];
  let visionText = "";

  const frames = input.frames ?? [];
  if (frames.length > 0 && readUsAiWorkerConfig()) {
    const mediaIds = frames.map(() => randomUUID());
    const workerResult = await analyzeFramesWithWorker({
      clinicalContext:
        [input.clinicalContext, input.freeText, "УЗИ щитовидной железы, TI-RADS ACR"].filter(Boolean).join("\n") ||
        "УЗИ щитовидной железы, TI-RADS",
      domain: "auto",
      mediaIds,
      frames: frames.map((f, i) => ({
        mediaId: mediaIds[i]!,
        fileName: f.fileName,
        mediaType: "image" as const,
        mimeType: f.mimeType,
        base64: f.base64,
      })),
    });

    if (!("error" in workerResult)) {
      pipeline = `us-ai-worker+${workerResult.pipeline}`;
      workerSummary = workerResult.studySummary;
      workerImpression = workerResult.impression;
      workerRecommendations = workerResult.recommendations;
      workerScorecard = workerResult.scorecard ?? null;
      workerFindings = workerResult.frames.flatMap((f) => f.findings);
      visionText = visionToFreeText(workerResult);
    }
  }

  const mergedText = [input.freeText, visionText].filter(Boolean).join("\n\n");
  const nlp = assistFromTiradsText(mergedText || input.freeText || "");
  const keywords = [...nlp.detectedKeywords];
  if (workerFindings.length) {
    keywords.push(...workerFindings.slice(0, 5).map((f) => `worker: ${f}`));
  }

  return {
    ...nlp,
    parsedInput: nlp.parsedInput,
    detectedKeywords: [...new Set(keywords)],
    report: nlp.report,
    pipeline,
    workerSummary,
    workerImpression,
    workerRecommendations,
    workerScorecard,
    workerFindings,
    mergedText,
  };
}
