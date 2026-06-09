import type { OradsInput } from "../types";
import { enqueueAIRequest, loadAIQueue, saveAIQueue } from "../storage/oradsStorage";
import { getWebApiBase } from "../../../api/chatBackend";
import { supabaseMobile } from "../../../lib/supabase/mobileClient";

export type AIResult = {
  text: string;
};
export type AIQueueStatus = { size: number; nextRetryInSec: number | null; lastError: string | null };

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

  for (const item of queue) {
    if (item.nextAttemptAt && item.nextAttemptAt > now) {
      failed.push(item);
      continue;
    }
    try {
      const result = await requestAI(item.payload);
      done.push(result);
    } catch (e) {
      const retryCount = (item.retryCount ?? 0) + 1;
      const delayMs = Math.min(5 * 60_000, 15_000 * Math.pow(2, Math.min(retryCount, 4)));
      failed.push({
        ...item,
        retryCount,
        nextAttemptAt: now + delayMs,
        lastError: e instanceof Error ? e.message : "network_error",
      });
    }
  }
  await saveAIQueue(failed);
  return { done, failedCount: failed.length };
}
