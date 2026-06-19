import { getEnv } from "@/lib/env";

export type RetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
  /** HTTP-коды, при которых повторяем запрос */
  retryOnStatus?: number[];
};

const DEFAULT_RETRY_STATUS = [408, 429, 500, 502, 503, 504];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch с экспоненциальным backoff.
 * Для sms.ru, ЮKassa, Telegram.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {},
): Promise<Response> {
  const env = getEnv();
  const attempts = options.attempts ?? env.HTTP_RETRY_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? env.HTTP_RETRY_BASE_DELAY_MS;
  const retryOnStatus = options.retryOnStatus ?? DEFAULT_RETRY_STATUS;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(input, init);
      if (res.ok || !retryOnStatus.includes(res.status) || attempt === attempts) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
      if (attempt === attempts) break;
    }
    await sleep(baseDelayMs * 2 ** (attempt - 1));
  }

  throw lastError instanceof Error ? lastError : new Error("fetchWithRetry failed");
}
