import { inferUsStudyDomain } from "@/lib/ai/us-vision/infer-domain";
import type { PreparedVisionFrame, UsVisionAnalysisResult } from "@/lib/ai/us-vision/types";
import { UsVisionAnalysisResultSchema } from "@/lib/ai/us-vision/types";

function readWorkerTimeoutMs(): number {
  const raw = process.env.US_AI_WORKER_REQUEST_TIMEOUT_MS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 280_000;
  if (!Number.isFinite(n) || n < 5_000) return 280_000;
  return Math.min(n, 300_000);
}

function readHealthTimeoutMs(): number {
  const raw = process.env.US_AI_WORKER_HEALTH_TIMEOUT_MS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 8_000;
  if (!Number.isFinite(n) || n < 1_000) return 8_000;
  return Math.min(n, 30_000);
}

export function isUsAiWorkerEnabled(): boolean {
  const flag = process.env.US_AI_WORKER_ENABLED?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  return true;
}

export function readUsAiWorkerConfig(): { baseUrl: string; secret: string } | null {
  if (!isUsAiWorkerEnabled()) return null;
  const baseUrl = process.env.US_AI_WORKER_URL?.trim().replace(/\/$/, "");
  const secret = process.env.US_AI_WORKER_SECRET?.trim();
  if (!baseUrl || !secret) return null;
  return { baseUrl, secret };
}

/** Public /health — no auth. Used to skip dead Railway/Fly endpoints before heavy /analyze. */
export async function probeUsAiWorkerHealth(
  cfg: { baseUrl: string },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const res = await fetch(`${cfg.baseUrl}/health`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(readHealthTimeoutMs()),
    });
    if (!res.ok) {
      return { ok: false, reason: `health ${res.status}` };
    }
    const json = (await res.json()) as { status?: string };
    if (json.status !== "ok") {
      return { ok: false, reason: "health status not ok" };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "health probe failed";
    return { ok: false, reason: msg };
  }
}

export async function analyzeFramesWithWorker(params: {
  clinicalContext: string;
  frames: PreparedVisionFrame[];
  mediaIds: string[];
  domain?: "auto" | "fetal" | "breast" | "gyn" | "kidney";
}): Promise<UsVisionAnalysisResult | { error: string }> {
  const cfg = readUsAiWorkerConfig();
  if (!cfg) return { error: "US_AI_WORKER_URL / US_AI_WORKER_SECRET не настроены" };

  const health = await probeUsAiWorkerHealth(cfg);
  if (!health.ok) {
    return { error: `Worker недоступен (${health.reason})` };
  }

  const res = await fetch(`${cfg.baseUrl}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.secret}`,
    },
    body: JSON.stringify({
      clinicalContext: params.clinicalContext,
      domain: params.domain ?? inferUsStudyDomain(params.clinicalContext),
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
    signal: AbortSignal.timeout(readWorkerTimeoutMs()),
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
