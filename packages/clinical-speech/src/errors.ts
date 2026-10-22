/** Web Speech API error codes → сообщения для врача */
export function speechErrorMessageRu(code: string | undefined, fallback?: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Доступ к микрофону запрещён. Разрешите микрофон для sonogyn-pro.ru в настройках браузера и обновите страницу.";
    case "no-speech":
      return "Речь не распознана. Говорите ближе к микрофону или проверьте уровень звука.";
    case "audio-capture":
      return "Микрофон недоступен. Подключите гарнитуру или выберите другое устройство ввода.";
    case "network":
      return "Сетевая ошибка распознавания. Проверьте интернет или переключите режим «Только на устройстве».";
    case "aborted":
      return "Диктовка остановлена.";
    case "language-not-supported":
      return "Русский язык не поддерживается этим браузером. Используйте Chrome/Edge или серверный режим.";
    default:
      return fallback ?? "Не удалось распознать речь. Повторите или введите текст с клавиатуры.";
  }
}
