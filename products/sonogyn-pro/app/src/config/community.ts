import { TELEGRAM_CHANNEL } from "./telegram";

/** Единая ссылка на сообщество — тот же канал, что в Profile / Library */
export const communityLinks = {
  telegramChannelUrl: TELEGRAM_CHANNEL.url,
  telegramChannelLabel: TELEGRAM_CHANNEL.name,
  telegramChannelHandle: TELEGRAM_CHANNEL.handle,
} as const;

export { openTelegramChannel } from "../lib/brand/openTelegramChannel";
