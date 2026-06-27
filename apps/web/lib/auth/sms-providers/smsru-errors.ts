/** Коды sms.ru → сообщения на русском (UI/API). */
const SMSRU_MESSAGES: Record<number, string> = {
  201: "На счёте sms.ru недостаточно средств. Пополните баланс.",
  202: "Неверный номер телефона.",
  205: "Номер в чёрном списке sms.ru.",
  206: "Превышен лимит отправки sms.ru.",
  209: "Неверный SMSRU_API_ID. Проверьте переменную на Vercel.",
  210: "Недостаточно средств на счёте sms.ru.",
  220: "Сервис sms.ru временно недоступен. Попробуйте позже.",
  230: "Превышен лимит SMS на этот номер у sms.ru.",
  301: "Неверный SMSRU_API_ID.",
  302: "Аккаунт sms.ru заблокирован.",
};

export function translateSmsRuErrorCode(errorCode: string | undefined): string {
  if (!errorCode) return "Не удалось отправить SMS. Попробуйте позже.";
  if (errorCode === "sms_not_configured") {
    return "SMS не настроен: задайте SMS_PROVIDER=smsru и SMSRU_API_ID на Vercel.";
  }
  if (errorCode === "smsru_network_error") {
    return "Нет связи с sms.ru. Проверьте интернет или повторите позже.";
  }
  if (errorCode === "smsru_non_ru_number") {
    return "SMS.ru надёжно доставляет только на номера РФ (+7). Для +993 и других стран используйте вход через Telegram или email.";
  }
  const match = /^smsru_(\d+)$/.exec(errorCode);
  if (match) {
    const code = Number.parseInt(match[1]!, 10);
    if (SMSRU_MESSAGES[code]) return SMSRU_MESSAGES[code];
  }
  return "Не удалось отправить SMS. Попробуйте позже или используйте email.";
}
