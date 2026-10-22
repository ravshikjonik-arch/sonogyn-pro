import { randomUUID } from "node:crypto";

import {
  runOradsAssistPipeline,
  type OradsAssistPipelineResult,
} from "@repo/orads-us/assist/runOradsAssistPipeline";

import type { LexiconFeature } from "@/lib/ai/imaging-cds/lexicon-schemas";
import type { OradsApplicabilityResult } from "@/lib/ai/imaging-cds/orads-applicability";
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
  lexiconFeatures?: LexiconFeature[];
  applicability?: OradsApplicabilityResult;
  mergedText: string;
  visionDescription: string;
};

function collectLexiconFeatures(vision: UsVisionAnalysisResult): LexiconFeature[] {
  const out: LexiconFeature[] = [];
  for (const frame of vision.frames) {
    for (const feat of frame.lexiconFeatures ?? []) {
      out.push({
        id: feat.id,
        labelRu: feat.labelRu,
        value: feat.value,
        confidence: feat.confidence,
        notAssessableOnFrame: feat.notAssessableOnFrame,
      });
    }
  }
  return out;
}

function visionToFreeText(vision: UsVisionAnalysisResult): string {
  const parts: string[] = [];
  if (vision.studySummary) parts.push(vision.studySummary);
  if (vision.impression) parts.push(vision.impression);
  if (vision.scorecard) parts.push(vision.scorecard);
  for (const frame of vision.frames) {
    if (frame.planeGuess) parts.push(frame.planeGuess);
    parts.push(...frame.findings);
    for (const feat of frame.lexiconFeatures ?? []) {
      parts.push(`${feat.labelRu}: ${String(feat.value)}`);
    }
    // Category numbers from vision are intentionally omitted — rule engine only after physician confirmation.
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
  let lexiconFeatures: LexiconFeature[] = [];
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
      lexiconFeatures = collectLexiconFeatures(workerResult);
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
    lexiconFeatures,
    mergedText: assistText,
    visionDescription: visionText,
  };
}

export function buildGynAssistBlockedResult(
  applicability: OradsApplicabilityResult,
): GynAiAssistResult {
  return {
    extracted: { sourceText: "" },
    hints: [],
    completePath: null,
    unresolvedNodes: [],
    ascitesModifierSuggested: false,
    categoryNumber: null,
    context: {
      menopause: "pre",
      menopauseSource: "ui",
      postMenopauseHint: false,
    },
    clinicalReasoning: {
      summary: applicability.messageRu,
      workingCategory: applicability.suggestedOradsZero === "inadequate" ? "O-RADS 0" : "O-RADS: не применимо",
      reasoningSteps: [],
      missingQuestions: [],
      memoryInsights: [],
      safetyFlags: [applicability.code],
      nextActions: ["Уточните клинический контекст или выберите другой инструмент."],
      physicianGuardrail: "Авто-анализ O-RADS не выполнен — решение только за врачом.",
    },
    protocolDraft: "",
    protocolDraftSource: "local",
    pipeline: "applicability-gate",
    applicability,
    mergedText: "",
    visionDescription: "",
  };
}
