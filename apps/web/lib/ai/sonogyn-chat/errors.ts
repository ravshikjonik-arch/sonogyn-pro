/** Коды ошибок для UI — без утечки сырого текста провайдера в production */
export type SonogynAiErrorCode =
  | "auth"
  | "config"
  | "invalid_request"
  | "rate_limit"
  | "overloaded"
  | "timeout"
  | "provider"
  | "unknown";

export function userMessageForAiError(code: SonogynAiErrorCode): string {
  switch (code) {
    case "auth":
      return "Сессия истекла. Войдите снова и повторите запрос.";
    case "config":
      return "ИИ-помощник временно недоступен (не настроен сервер). Обратитесь к администратору.";
    case "invalid_request":
      return "Запрос не принят: проверьте текст и формат изображения (JPEG/PNG/WebP, до 5 МБ).";
    case "rate_limit":
      return "Слишком много запросов к ИИ. Подождите 30–60 секунд и попробуйте снова.";
    case "overloaded":
      return "Сервис ИИ перегружен. Повторите через минуту — мы уже пробовали автоматически.";
    case "timeout":
      return "Сервер ИИ долго не ответил. Попробуйте короче сформулировать запрос или повторите позже.";
    case "provider":
      return "Провайдер ИИ вернул ошибку. Попробуйте позже или обратитесь в поддержку.";
    default:
      return "Не удалось получить ответ от ИИ. Попробуйте ещё раз.";
  }
}

export function classifyOpenRouterHttpStatus(status: number, bodyText: string): SonogynAiErrorCode {
  const lower = bodyText.toLowerCase();
  if (status === 401 || lower.includes("invalid_api_key") || lower.includes("authentication")) {
    return "config";
  }
  if (status === 429 || lower.includes("rate_limit")) return "rate_limit";
  if (status === 529 || lower.includes("overloaded")) return "overloaded";
  if (status === 400 || status === 422) return "invalid_request";
  if (status >= 500) return "provider";
  return "unknown";
}

export function parseClientFetchError(err: unknown): { code: SonogynAiErrorCode; message: string } {
  if (err instanceof DOMException && err.name === "AbortError") {
    return { code: "timeout", message: userMessageForAiError("timeout") };
  }
  if (err instanceof Error) {
    if (err.message.includes("401")) return { code: "auth", message: userMessageForAiError("auth") };
    if (err.message.includes("429")) return { code: "rate_limit", message: userMessageForAiError("rate_limit") };
  }
  return { code: "unknown", message: userMessageForAiError("unknown") };
}

/** Разбор JSON-ответа API /api/ai/chat при ошибке */
export function messageFromApiErrorBody(body: {
  error?: string;
  code?: SonogynAiErrorCode;
}): string {
  if (body.code) return userMessageForAiError(body.code);
  if (body.error && body.error.length < 200) return body.error;
  return userMessageForAiError("unknown");
}
