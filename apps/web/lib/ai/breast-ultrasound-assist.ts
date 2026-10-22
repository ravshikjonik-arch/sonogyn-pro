import {
  assistFromFreeText,
  type BiradsBrochureInput,
  type NlpAssistResult,
} from "@repo/birads-us";
import { randomUUID } from "node:crypto";

import type { UsVisionAnalysisResult } from "@/lib/ai/us-vision/types";
import { analyzeFramesWithWorker, readUsAiWorkerConfig } from "@/lib/ai/us-vision/worker-client";

export type BreastAiAssistInput = {
  freeText?: string;
  clinicalContext?: string;
  frames?: Array<{
    fileName: string;
    mimeType: string;
    base64: string;
  }>;
};

export type BreastAiAssistResult = NlpAssistResult & {
  pipeline: string;
  workerSummary?: string;
  workerImpression?: string;
  workerRecommendations?: string[];
  workerScorecard?: string | null;
  workerBiradsHints?: string[];
  mergedText: string;
  parsedInput: BiradsBrochureInput;
};

function visionToFreeText(vision: UsVisionAnalysisResult): string {
  const parts: string[] = [];
  if (vision.studySummary) parts.push(vision.studySummary);
  if (vision.impression) parts.push(vision.impression);
  if (vision.scorecard) parts.push(vision.scorecard);
  for (const frame of vision.frames) {
    if (frame.planeGuess) parts.push(frame.planeGuess);
    parts.push(...frame.findings);
    // BI-RADS category from vision is not merged — NLP/rule engine after physician confirmation.
  }
  return parts.join(". ");
}

export async function analyzeBreastUltrasoundAssist(input: BreastAiAssistInput): Promise<BreastAiAssistResult> {
  let pipeline = "nlp-assist-v1";
  let workerSummary: string | undefined;
  let workerImpression: string | undefined;
  let workerRecommendations: string[] | undefined;
  let workerScorecard: string | null | undefined;
  let visionText = "";

  const frames = input.frames ?? [];
  if (frames.length > 0 && readUsAiWorkerConfig()) {
    const mediaIds = frames.map(() => randomUUID());
    const workerResult = await analyzeFramesWithWorker({
      clinicalContext: [input.clinicalContext, input.freeText].filter(Boolean).join("\n") || "УЗИ молочной железы",
      domain: "breast",
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
      visionText = visionToFreeText(workerResult);
    }
  }

  const mergedText = [input.freeText, visionText].filter(Boolean).join("\n\n");
  const nlp = assistFromFreeText(mergedText || input.freeText || "");
  const parsedInput = nlp.parsedInput;
  const report = nlp.report;
  const keywords = [...nlp.detectedKeywords];

  return {
    ...nlp,
    parsedInput,
    detectedKeywords: [...new Set([...nlp.detectedKeywords, ...keywords])],
    report,
    pipeline,
    workerSummary,
    workerImpression,
    workerRecommendations,
    workerScorecard,
    workerBiradsHints: [],
    mergedText,
  };
}
