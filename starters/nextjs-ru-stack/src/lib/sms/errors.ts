/** Коды sms.ru → сообщения на русском для UI/API. */
const SMSRU_MESSAGES: Record<number, string> = {
  201: "На счёте sms.ru недостаточно средств. Пополните баланс.",
  202: "Неверный номер телефона.",
  203: "Не указан текст SMS.",
  204: "Имя отправителя не согласовано с sms.ru.",
  205: "Номер в чёрном списке sms.ru.",
  206: "Превышен лимит отправки sms.ru.",
  207: "Ошибка параметров запроса к sms.ru.",
  209: "Неверный api_id. Проверьте SMSRU_API_ID.",
  210: "Недостаточно средств на счёте sms.ru.",
  220: "Сервис sms.ru временно недоступен. Попробуйте позже.",
  230: "Превышен лимит SMS на этот номер у sms.ru.",
  300: "Неверный токен sms.ru.",
  301: "Неверный api_id (SMSRU_API_ID).",
  302: "Аккаунт sms.ru заблокирован.",
};

export function mapSmsRuErrorCode(statusCode: number | undefined, httpStatus?: number): string {
  if (statusCode && SMSRU_MESSAGES[statusCode]) {
    return SMSRU_MESSAGES[statusCode];
  }
  if (httpStatus && httpStatus >= 500) {
    return "Сервис sms.ru временно недоступен. Попробуйте позже.";
  }
  return "Не удалось отправить SMS. Попробуйте позже или используйте email.";
}

export const SMS_RATE_LIMIT_MINUTE =
  "Слишком часто. Подождите 1 минуту перед повторной отправкой.";
export const SMS_RATE_LIMIT_HOUR =
  "Превышен лимит: не более 5 SMS в час на один номер.";
