"use client";

/**
 * Учёт бесплатных AI-запросов (клиентский, демо-уровень).
 * Реальный учёт квот — на сервере при подключении LLM.
 */
export const FREE_AI_LIMIT = 20;
const USAGE_KEY = "sonogyn-ai-usage";

export function getAiUsage(): number {
  if (typeof window === "undefined") return 0;
  const raw = Number(localStorage.getItem(USAGE_KEY));
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

export function incrementAiUsage(): number {
  if (typeof window === "undefined") return 0;
  const next = getAiUsage() + 1;
  try {
    localStorage.setItem(USAGE_KEY, String(next));
    window.dispatchEvent(new CustomEvent("sonogyn:ai-usage", { detail: next }));
  } catch {
    /* ignore */
  }
  return next;
}

export function aiUsagePercent(used: number): number {
  return Math.min(100, Math.round((used / FREE_AI_LIMIT) * 100));
}
