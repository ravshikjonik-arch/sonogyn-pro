import type { SupabaseClient } from "@supabase/supabase-js";

import { downloadCaseMediaRows, toMediaForAnalysis } from "@/lib/ai/us-vision/fetch-case-media";
import { US_VISION_DISCLAIMER_RU } from "@/lib/ai/us-vision/prompts";
import type { UsVisionAnalysisResult } from "@/lib/ai/us-vision/types";
import { analyzeFramesWithOpenRouter } from "@/lib/ai/us-vision/vision-provider";
import { analyzeFramesWithWorker, readUsAiWorkerConfig } from "@/lib/ai/us-vision/worker-client";
import type { CaseMediaRow } from "@/lib/supabase/case-media-storage";

export type RunCaseAnalysisInput = {
  admin: SupabaseClient;
  mediaRows: CaseMediaRow[];
  mediaIds: string[];
  clinicalContext: string;
};

function buildClinicalContext(caseRow: {
  title?: string | null;
  description?: string | null;
  anatomy?: string | null;
  pathology?: string | null;
}): string {
  return [
    caseRow.title ? `Заголовок: ${caseRow.title}` : null,
    caseRow.anatomy ? `Область: ${caseRow.anatomy}` : null,
    caseRow.pathology ? `Патология (заявлено): ${caseRow.pathology}` : null,
    caseRow.description ? `Описание: ${caseRow.description}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function fetchCaseClinicalContext(
  admin: SupabaseClient,
  caseId: string,
): Promise<string> {
  const { data } = await admin
    .from("cases")
    .select("title, description, anatomy, pathology")
    .eq("id", caseId)
    .maybeSingle();
  if (!data) return "";
  return buildClinicalContext(data);
}

export async function runCaseUsVisionAnalysis(
  input: RunCaseAnalysisInput,
): Promise<UsVisionAnalysisResult | { error: string }> {
  const selected = input.mediaRows.filter((r) => input.mediaIds.includes(r.id));
  if (selected.length === 0) {
    return { error: "Нет медиа для анализа" };
  }

  const frames = await downloadCaseMediaRows(input.admin, toMediaForAnalysis(selected));
  if (frames.length === 0) {
    return { error: "Не удалось скачать файлы из хранилища" };
  }

  const workerCfg = readUsAiWorkerConfig();
  let workerSkipNote: string | null = null;

  if (workerCfg) {
    const workerResult = await analyzeFramesWithWorker({
      clinicalContext: input.clinicalContext,
      frames,
      mediaIds: input.mediaIds,
    });
    if (!("error" in workerResult)) return workerResult;
    workerSkipNote = workerResult.error;
  }

  const visionResult = await analyzeFramesWithOpenRouter({
    clinicalContext: input.clinicalContext,
    frames,
    mediaIds: input.mediaIds,
  });

  if (!("error" in visionResult)) {
    const hasDicom = frames.some((f) => f.mediaType === "dicom");
    const workerDown = Boolean(workerSkipNote);
    if (hasDicom && (!workerCfg || workerDown)) {
      const workerHint = workerDown
        ? `Worker временно недоступен (${workerSkipNote}). DICOM не разобран; использован облачный vision только для растровых кадров.`
        : "DICOM пропущен без worker. SonoNet недоступен на Vercel.";
      return {
        ...visionResult,
        studySummary: `${visionResult.studySummary}\n\n${workerHint}`,
        recommendations: [
          ...visionResult.recommendations,
          workerDown
            ? "Поднимите US AI Worker (Railway/Fly) или задайте US_AI_WORKER_ENABLED=false на Vercel, пока worker в ремонте."
            : "Для DICOM + SonoNet: US_AI_WORKER_URL → services/us-ai-worker (см. docs/FLY-DEPLOY-RU.md).",
        ],
      };
    }
    if (workerDown && !hasDicom) {
      return {
        ...visionResult,
        recommendations: [
          ...visionResult.recommendations,
          `Разбор через OpenRouter (worker: ${workerSkipNote}).`,
        ],
      };
    }
    return visionResult;
  }

  return {
    modelVersion: "heuristic-v1",
    pipeline: "heuristic-fallback",
    locale: "ru",
    disclaimer: US_VISION_DISCLAIMER_RU,
    studySummary:
      "ИИ-анализ недоступен. Нужен OPENROUTER_API_KEY (Vercel) или US_AI_WORKER_URL (SonoNet + DICOM).",
    frames: input.mediaIds.map((id) => ({
      mediaId: id,
      findings: ["Автоматический разбор не выполнен."],
      scanErrors: [],
      biometryHints: [],
      confidence: 0.1,
    })),
    impression: visionResult.error,
    recommendations: [
      "Vercel: OPENROUTER_API_KEY + OPENROUTER_US_VISION_MODEL=openai/gpt-4o-mini",
      "Локально: cd services/us-ai-worker && docker compose up (SonoNet + DICOM + vision)",
    ],
    mediaIds: input.mediaIds,
    clinicalContext: input.clinicalContext,
  };
}
