import { z } from "zod";

import {
  buildUsVisionSystemPrompt,
  buildUsVisionUserPrompt,
  US_VISION_DISCLAIMER_RU,
} from "@/lib/ai/us-vision/prompts";
import type { PreparedVisionFrame, UsVisionAnalysisResult } from "@/lib/ai/us-vision/types";
import { UsVisionFrameSchema } from "@/lib/ai/us-vision/types";

const OPENROUTER_URL =
  process.env.OPENROUTER_API_URL?.trim() || "https://openrouter.ai/api/v1/chat/completions";

const VisionJsonSchema = z.object({
  studySummary: z.string(),
  impression: z.string(),
  recommendations: z.array(z.string()).default([]),
  frames: z
    .array(
      z.object({
        mediaId: z.string(),
        planeGuess: z.string().optional(),
        qualityScore: z.number().optional(),
        findings: z.array(z.string()).optional(),
        scanErrors: z.array(z.string()).optional(),
        biometryHints: z.array(z.string()).optional(),
        confidence: z.number().optional(),
      }),
    )
    .default([]),
});

function visionMimeForApi(frame: PreparedVisionFrame): string | null {
  if (frame.mediaType === "dicom") return null;
  if (frame.mimeType.startsWith("image/")) return frame.mimeType;
  if (frame.mimeType.startsWith("video/")) return "image/jpeg";
  return "image/jpeg";
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(candidate.slice(start, end + 1)) as unknown;
  }
  return JSON.parse(candidate) as unknown;
}

export function readVisionModelId(): string {
  return (
    process.env.OPENROUTER_US_VISION_MODEL?.trim() ||
    process.env.OPENROUTER_ORADS_MODEL?.trim() ||
    "openai/gpt-4o-mini"
  );
}

export async function analyzeFramesWithOpenRouter(params: {
  clinicalContext: string;
  frames: PreparedVisionFrame[];
  mediaIds: string[];
}): Promise<UsVisionAnalysisResult | { error: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return { error: "OPENROUTER_API_KEY не задан на сервере" };
  }

  const imageFrames = params.frames.filter((f) => visionMimeForApi(f));
  if (imageFrames.length === 0) {
    return {
      error:
        "Нет кадров для vision-анализа (DICOM требует US_AI_WORKER_URL или экспорт в PNG/JPEG).",
    };
  }

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: buildUsVisionUserPrompt({ clinicalContext: params.clinicalContext, frames: imageFrames }),
    },
  ];

  for (const frame of imageFrames.slice(0, 4)) {
    const mime = visionMimeForApi(frame)!;
    content.push({
      type: "image_url",
      image_url: { url: `data:${mime};base64,${frame.base64}` },
    });
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: readVisionModelId(),
      messages: [
        { role: "system", content: buildUsVisionSystemPrompt() },
        { role: "user", content },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { error: `Vision API ${res.status}: ${body.slice(0, 200)}` };
  }

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = body.choices?.[0]?.message?.content?.trim();
  if (!raw) return { error: "Пустой ответ vision-модели" };

  let parsed: z.infer<typeof VisionJsonSchema>;
  try {
    parsed = VisionJsonSchema.parse(extractJsonObject(raw));
  } catch {
    return { error: "Не удалось разобрать JSON ответа ИИ" };
  }

  const frames = parsed.frames.map((f) =>
    UsVisionFrameSchema.parse({
      mediaId: f.mediaId,
      planeGuess: f.planeGuess,
      qualityScore: f.qualityScore,
      findings: f.findings ?? [],
      scanErrors: f.scanErrors ?? [],
      biometryHints: f.biometryHints ?? [],
      confidence: f.confidence ?? 0.5,
    }),
  );

  return {
    modelVersion: readVisionModelId(),
    pipeline: "openrouter-vision",
    locale: "ru",
    disclaimer: US_VISION_DISCLAIMER_RU,
    studySummary: parsed.studySummary,
    impression: parsed.impression,
    recommendations: parsed.recommendations,
    frames,
    mediaIds: params.mediaIds,
    clinicalContext: params.clinicalContext,
  };
}
