/** Человекочитаемые сообщения для UI/API (без технических деталей). */
export function mapExternalApiError(service: "smsru" | "yookassa" | "telegram", err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (message.includes("abort") || message.includes("AbortError") || message.includes("timeout")) {
    return `${label(service)}: сервис не ответил вовремя. Попробуйте позже.`;
  }

  if (message.includes("fetch failed") || message.includes("ECONNRESET") || message.includes("ENOTFOUND")) {
    return `${label(service)}: нет связи с сервисом. Проверьте интернет и повторите.`;
  }

  if (message.includes("429")) {
    return `${label(service)}: слишком много запросов. Подождите минуту.`;
  }

  return `${label(service)}: временная ошибка. Попробуйте позже.`;
}

function label(service: "smsru" | "yookassa" | "telegram"): string {
  switch (service) {
    case "smsru":
      return "SMS";
    case "yookassa":
      return "Оплата";
    case "telegram":
      return "Telegram";
  }
}
