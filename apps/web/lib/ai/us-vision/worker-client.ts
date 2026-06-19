import { inferUsStudyDomain } from "@/lib/ai/us-vision/infer-domain";
import type { PreparedVisionFrame, UsVisionAnalysisResult } from "@/lib/ai/us-vision/types";
import { UsVisionAnalysisResultSchema } from "@/lib/ai/us-vision/types";

export function readUsAiWorkerConfig(): { baseUrl: string; secret: string } | null {
  const baseUrl = process.env.US_AI_WORKER_URL?.trim().replace(/\/$/, "");
  const secret = process.env.US_AI_WORKER_SECRET?.trim();
  if (!baseUrl || !secret) return null;
  return { baseUrl, secret };
}

export async function analyzeFramesWithWorker(params: {
  clinicalContext: string;
  frames: PreparedVisionFrame[];
  mediaIds: string[];
}): Promise<UsVisionAnalysisResult | { error: string }> {
  const cfg = readUsAiWorkerConfig();
  if (!cfg) return { error: "US_AI_WORKER_URL / US_AI_WORKER_SECRET не настроены" };

  const res = await fetch(`${cfg.baseUrl}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.secret}`,
    },
    body: JSON.stringify({
      clinicalContext: params.clinicalContext,
      domain: inferUsStudyDomain(params.clinicalContext),
      backend: "auto",
      mediaIds: params.mediaIds,
      frames: params.frames.map((f) => ({
        mediaId: f.mediaId,
        fileName: f.fileName,
        mediaType: f.mediaType,
        mimeType: f.mimeType,
        dataBase64: f.base64,
      })),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { error: `Worker ${res.status}: ${text.slice(0, 240)}` };
  }

  const json: unknown = await res.json();
  const parsed = UsVisionAnalysisResultSchema.safeParse(json);
  if (!parsed.success) {
    return { error: "Worker вернул невалидный JSON" };
  }
  return parsed.data;
}
