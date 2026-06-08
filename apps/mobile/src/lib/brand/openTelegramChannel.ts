import { Alert, Linking, Platform } from "react-native";
import { TELEGRAM_CHANNEL } from "../../config/telegram";

const DOMAIN = TELEGRAM_CHANNEL.handle.replace(/^@/, "");

type OpenOptions = {
  /** Не показывать предупреждение про VPN (повторная попытка) */
  skipVpnPrompt?: boolean;
};

/**
 * Открывает официальный Telegram-канал.
 * Native: tg:// → https. Web: предупреждение про VPN (РФ) → t.me.
 */
export async function openTelegramChannel(options: OpenOptions = {}): Promise<boolean> {
  if (Platform.OS === "web" && !options.skipVpnPrompt) {
    return new Promise((resolve) => {
      Alert.alert(`Telegram · ${TELEGRAM_CHANNEL.name}`, TELEGRAM_CHANNEL.vpnHintRu, [
        { text: "Отмена", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Открыть ссылку",
          onPress: () => {
            void openTelegramChannel({ skipVpnPrompt: true }).then(resolve);
          },
        },
      ]);
    });
  }

  const candidates =
    Platform.OS === "web"
      ? [TELEGRAM_CHANNEL.url]
      : [`tg://resolve?domain=${DOMAIN}`, TELEGRAM_CHANNEL.url];

  for (const url of candidates) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) continue;
      await Linking.openURL(url);
      return true;
    } catch {
      /* пробуем следующий URL */
    }
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      const opened = window.open(TELEGRAM_CHANNEL.url, "_blank", "noopener,noreferrer");
      if (opened) return true;
    } catch {
      /* fall through */
    }
  }

  Alert.alert("Telegram недоступен", TELEGRAM_CHANNEL.vpnHintRu);
  return false;
}
