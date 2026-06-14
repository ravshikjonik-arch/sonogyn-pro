/**
 * Promise.race с таймаутом.
 * Vercel Serverless: функция не должна висеть до maxDuration — обрываем внешние API (SMS/Email/TG).
 */
export class OperationTimeoutError extends Error {
  readonly label: string;
  constructor(label: string, timeoutMs: number) {
    super(`${label}_timeout_${timeoutMs}ms`);
    this.name = "OperationTimeoutError";
    this.label = label;
  }
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new OperationTimeoutError(label, timeoutMs)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/** Экспоненциальная пауза между ретраями (макс. 2 попытки в sendVerificationCode). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
