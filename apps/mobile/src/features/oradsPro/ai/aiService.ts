import type { OradsInput } from "../types";
import { enqueueAIRequest, loadAIQueue, saveAIQueue } from "../storage/oradsStorage";
import { getWebApiBase } from "../../../api/chatBackend";
import { supabaseMobile } from "../../../lib/supabase/mobileClient";

export type AIResult = {
  text: string;
};
export type AIQueueStatus = { size: number; nextRetryInSec: number | null; lastError: string | null };

const FLUSH_GAP_MS = 1500;

class AiRateLimitError extends Error {
  retryAfterSec: number;

  constructor(retryAfterSec: number) {
    super(`AI API rate limited (${retryAfterSec}s)`);
    this.name = "AiRateLimitError";
    this.retryAfterSec = retryAfterSec;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildOfflineMock(): AIResult {
  return {
    text: "AI предполагает O-RADS 3 с уверенностью 72%. Основание: офлайн — подключите интернет и войдите для серверного AI.",
  };
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!supabaseMobile) return headers;
  const { data } = await supabaseMobile.auth.getSession();
  const token = data.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Серверный прокси SonoGyn (ключ OpenRouter только на backend). */
export async function requestAI(payload: OradsInput): Promise<AIResult> {
  const base = getWebApiBase();
  if (!base) {
    return buildOfflineMock();
  }

  const res = await fetch(`${base}/api/ai/orads`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ payload }),
  });

  if (res.status === 429) {
    const retryAfterRaw = res.headers.get("Retry-After");
    const retryAfterSec = retryAfterRaw ? Number.parseInt(retryAfterRaw, 10) : 60;
    throw new AiRateLimitError(Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec : 60);
  }

  if (!res.ok) {
    throw new Error(`AI API error ${res.status}`);
  }

  const json = (await res.json()) as { text?: string };
  if (!json.text) throw new Error("AI API empty response");
  return { text: json.text };
}

export async function requestAIOrQueue(payload: OradsInput): Promise<{ queued: boolean; result?: AIResult }> {
  try {
    const result = await requestAI(payload);
    return { queued: false, result };
  } catch {
    await enqueueAIRequest(payload);
    return { queued: true };
  }
}

export async function getAIQueueSize(): Promise<number> {
  const queue = await loadAIQueue();
  return queue.length;
}

export async function getAIQueueStatus(): Promise<AIQueueStatus> {
  const queue = await loadAIQueue();
  if (queue.length === 0) return { size: 0, nextRetryInSec: null, lastError: null };
  const now = Date.now();
  const soonest = queue
    .map((q) => q.nextAttemptAt ?? now)
    .sort((a, b) => a - b)[0];
  const nextRetryInSec = Math.max(0, Math.ceil((soonest - now) / 1000));
  const lastError = queue.find((q) => q.lastError)?.lastError ?? null;
  return { size: queue.length, nextRetryInSec, lastError };
}

export async function flushAIQueue(): Promise<{ done: AIResult[]; failedCount: number }> {
  const queue = await loadAIQueue();
  if (queue.length === 0) return { done: [], failedCount: 0 };

  const done: AIResult[] = [];
  const failed = [];
  const now = Date.now();
  let flushedCount = 0;

  for (const item of queue) {
    if (item.nextAttemptAt && item.nextAttemptAt > now) {
      failed.push(item);
      continue;
    }
    if (flushedCount > 0) {
      await sleep(FLUSH_GAP_MS);
    }
    try {
      const result = await requestAI(item.payload);
      done.push(result);
      flushedCount += 1;
    } catch (e) {
      const retryCount = (item.retryCount ?? 0) + 1;
      let delayMs = Math.min(5 * 60_000, 15_000 * Math.pow(2, Math.min(retryCount, 4)));
      if (e instanceof AiRateLimitError) {
        delayMs = Math.max(delayMs, e.retryAfterSec * 1000);
      }
      failed.push({
        ...item,
        retryCount,
        nextAttemptAt: now + delayMs,
        lastError: e instanceof Error ? e.message : "network_error",
      });
      flushedCount += 1;
    }
  }
  await saveAIQueue(failed);
  return { done, failedCount: failed.length };
}
