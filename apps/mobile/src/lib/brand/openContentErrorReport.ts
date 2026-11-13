import { Alert, Linking, Platform } from "react-native";

import {
  buildContentErrorReportUrl,
  CONTENT_ERROR_REPORT,
} from "../../config/contentErrorReport";

type OpenOptions = {
  pageHint?: string;
  skipVpnPrompt?: boolean;
};

/**
 * Открывает Telegram @Yakrav7700 с предзаполненным текстом об ошибке.
 * Телефон не используем.
 */
export async function openContentErrorReport(options: OpenOptions = {}): Promise<boolean> {
  if (Platform.OS === "web" && !options.skipVpnPrompt) {
    return new Promise((resolve) => {
      Alert.alert(CONTENT_ERROR_REPORT.labelRu, CONTENT_ERROR_REPORT.vpnHintRu, [
        { text: "Отмена", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Открыть Telegram",
          onPress: () => {
            void openContentErrorReport({ ...options, skipVpnPrompt: true }).then(resolve);
          },
        },
      ]);
    });
  }

  const httpsUrl = buildContentErrorReportUrl(options.pageHint);
  const candidates =
    Platform.OS === "web"
      ? [httpsUrl]
      : [`tg://resolve?domain=${CONTENT_ERROR_REPORT.domain}`, httpsUrl];

  for (const url of candidates) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) continue;
      await Linking.openURL(url);
      return true;
    } catch {
      /* next */
    }
  }

  Alert.alert("Telegram недоступен", CONTENT_ERROR_REPORT.vpnHintRu);
  return false;
}
