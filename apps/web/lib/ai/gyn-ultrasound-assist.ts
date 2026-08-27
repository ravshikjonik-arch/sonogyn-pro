import { randomUUID } from "node:crypto";

import {
  runOradsAssistPipeline,
  type OradsAssistPipelineResult,
} from "@repo/orads-us/assist/runOradsAssistPipeline";

import type { UsVisionAnalysisResult } from "@/lib/ai/us-vision/types";
import { analyzeFramesWithWorker, readUsAiWorkerConfig } from "@/lib/ai/us-vision/worker-client";

export type GynAiAssistInput = {
  freeText?: string;
  clinicalContext?: string;
  menopause?: "pre" | "post";
  profileAgeYears?: number;
  frames?: Array<{
    fileName: string;
    mimeType: string;
    base64: string;
  }>;
};

export type GynAiAssistResult = OradsAssistPipelineResult & {
  pipeline: string;
  workerSummary?: string;
  workerImpression?: string;
  workerRecommendations?: string[];
  workerScorecard?: string | null;
  workerFindings?: string[];
  mergedText: string;
  visionDescription: string;
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
  }
  return parts.join(". ");
}

/** УЗИ придатков / МТП: US AI Worker (domain gyn) → локальный O-RADS assist pipeline. */
export async function analyzeGynUltrasoundAssist(input: GynAiAssistInput): Promise<GynAiAssistResult> {
  let pipeline = "orads-photo-local";
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
        [input.clinicalContext, input.freeText, "УЗИ органов малого таза, O-RADS US ACR v2022"].filter(Boolean).join("\n") ||
        "УЗИ придатков, O-RADS US",
      domain: "gyn",
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

  const mergedText = [input.freeText, visionText].filter(Boolean).join("\n\n").trim();
  const assistText =
    mergedText ||
    "образование яичника без детализации — уточните размер, солидный компонент, перегородки и кровоток";

  const orads = runOradsAssistPipeline(assistText, {
    uiMenopause: input.menopause,
    profileAgeYears: input.profileAgeYears,
  });

  return {
    ...orads,
    pipeline,
    workerSummary,
    workerImpression,
    workerRecommendations,
    workerScorecard,
    workerFindings,
    mergedText: assistText,
    visionDescription: visionText,
  };
}
