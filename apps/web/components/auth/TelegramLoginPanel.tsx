import { TelegramLoginButton } from "./TelegramLoginButton";
import { readTelegramBotUsername } from "@/lib/auth/telegram-bot-config";

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

type TelegramLoginPanelProps = {
  enabled?: boolean;
  nextPath?: string;
  onError?: (message: string) => void;
  onAuth?: (user: TelegramUser) => void;
};

/** Server wrapper: имя бота из env без client fetch. */
export function TelegramLoginPanel(props: TelegramLoginPanelProps) {
  const botUsername = readTelegramBotUsername();
  return <TelegramLoginButton botUsername={botUsername} {...props} />;
}
