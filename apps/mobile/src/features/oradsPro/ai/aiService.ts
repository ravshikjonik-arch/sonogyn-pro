import Constants from "expo-constants";
import type { OradsInput } from "../types";
import { enqueueAIRequest, loadAIQueue, saveAIQueue } from "../storage/oradsStorage";

export type AIResult = {
  text: string;
};
export type AIQueueStatus = { size: number; nextRetryInSec: number | null; lastError: string | null };

const API_URL =
  (process.env.EXPO_PUBLIC_OPENROUTER_URL as string | undefined) ||
  (Constants.expoConfig?.extra?.openRouterUrl as string | undefined);
const API_KEY =
  (process.env.EXPO_PUBLIC_OPENROUTER_KEY as string | undefined) ||
  (Constants.expoConfig?.extra?.openRouterKey as string | undefined);

function buildPrompt(payload: OradsInput): string {
  return `Ты радиолог. Оцени O-RADS по признакам и дай краткий ответ.
Формат: "AI предполагает O-RADS [X] с уверенностью [Y]%. Основание: [кратко]".
Данные: ${JSON.stringify(payload)}`;
}

export async function requestAI(payload: OradsInput): Promise<AIResult> {
  if (!API_URL || !API_KEY) {
    return { text: "AI предполагает O-RADS 3 с уверенностью 72%. Основание: мок-режим без API ключа." };
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Ты медицинский ассистент по O-RADS. Ответ краткий." },
        { role: "user", content: buildPrompt(payload) },
      ],
    }),
  });

  if (!res.ok) throw new Error(`AI API error ${res.status}`);
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content as string | undefined;
  if (!text) throw new Error("AI API empty response");
  return { text };
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
