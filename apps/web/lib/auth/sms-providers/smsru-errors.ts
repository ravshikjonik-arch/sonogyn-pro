/** Коды sms.ru → сообщения на русском (UI/API). */
const SMSRU_MESSAGES: Record<number, string> = {
  201: "На счёте sms.ru недостаточно средств. Пополните баланс.",
  202: "Неверный номер телефона или нет маршрута. Нужен мобильный РФ вида +79XXXXXXXXX.",
  203: "Пустой текст SMS (внутренняя ошибка). Напишите в поддержку.",
  204: "Имя отправителя SMS не подключено к оператору. В sms.ru → Отправители подайте заявку или уберите SMSRU_FROM на Vercel.",
  205: "Текст SMS слишком длинный.",
  206: "Превышен дневной лимит sms.ru (часто стоит 10/сутки у нового кабинета). В sms.ru → Настройки поднимите лимит до 100–500 и повторите.",
  207: "На этот номер нет маршрута доставки у sms.ru. Проверьте, что номер мобильный РФ (+79…).",
  209: "Номер в стоп-листе sms.ru. Уберите его из стоп-листа в кабинете или используйте другой номер.",
  210: "Недостаточно средств на счёте sms.ru.",
  220: "Сервис sms.ru временно недоступен. Попробуйте позже.",
  230: "Превышен лимит SMS на этот номер у sms.ru (антифрод). Подождите 15–30 мин или поднимите лимит в sms.ru → Защита от атак.",
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
    return "SMS доступен только для мобильных РФ в формате +79XXXXXXXXX. Иначе — вход через Telegram или email.";
  }
  if (errorCode === "smsru_send_failed") {
    return "sms.ru принял запрос без id сообщения. Проверьте историю в кабинете sms.ru и дневной лимит.";
  }
  const match = /^smsru_(\d+)$/.exec(errorCode);
  if (match) {
    const code = Number.parseInt(match[1]!, 10);
    if (SMSRU_MESSAGES[code]) return SMSRU_MESSAGES[code];
  }
  return "Не удалось отправить SMS. Попробуйте позже или используйте email.";
}
