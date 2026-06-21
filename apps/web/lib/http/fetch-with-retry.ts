export type FetchWithRetryOptions = {
  attempts?: number;
  timeoutMs?: number;
  baseDelayMs?: number;
  /** HTTP-коды, при которых повторяем запрос */
  retryOnStatus?: number[];
};

const DEFAULT_RETRY_STATUS = [408, 429, 500, 502, 503, 504];

function readIntEnv(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch с таймаутом и экспоненциальным backoff.
 * Для sms.ru, ЮKassa, Telegram Bot API.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const attempts = options.attempts ?? readIntEnv("HTTP_RETRY_ATTEMPTS", 3);
  const timeoutMs = options.timeoutMs ?? readIntEnv("HTTP_FETCH_TIMEOUT_MS", 15_000);
  const baseDelayMs = options.baseDelayMs ?? readIntEnv("HTTP_RETRY_BASE_DELAY_MS", 500);
  const retryOnStatus = options.retryOnStatus ?? DEFAULT_RETRY_STATUS;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(input, {
        ...init,
        signal: init?.signal ?? controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok || !retryOnStatus.includes(res.status) || attempt === attempts) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if (attempt === attempts) break;
    }

    await sleep(baseDelayMs * 2 ** (attempt - 1));
  }

  throw lastError instanceof Error ? lastError : new Error("fetchWithRetry failed");
}
