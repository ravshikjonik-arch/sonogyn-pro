/**
 * Логирование ошибок Remote Config (консоль + analytics/Crashlytics-ready).
 */

import { logProductAnalyticsMobile } from "../../../lib/analytics/productAnalytics";
import { ConfigValidationError } from "./types";

/**
 * Записывает ошибку конфигурации в консоль и аналитику.
 * На native можно подключить @react-native-firebase/crashlytics в этом месте.
 */
export function logConfigError(error: unknown, context?: string): void {
  const prefix = "[ElastographyConfig]";
  let code = "UNKNOWN";
  let message = "Неизвестная ошибка";

  if (error instanceof ConfigValidationError) {
    code = error.code;
    message = error.message;
    console.warn(`${prefix} ${code}: ${message}`);
  } else if (error instanceof Error) {
    message = error.message;
    console.warn(`${prefix} ${message}`);
  } else {
    console.warn(`${prefix} Неизвестная ошибка валидации`);
  }

  void logProductAnalyticsMobile("elastography_config_error", {
    code,
    message: message.slice(0, 120),
    context: context ?? "remote_config",
  });
}
