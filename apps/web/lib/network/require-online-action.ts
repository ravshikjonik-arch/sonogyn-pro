import { NETWORK_OFFLINE_ACTION_RU } from "@/lib/network/network-messages";

/** Клиентская проверка перед POST/fetch к API (чат, AI, кейсы). */
export function requireOnlineForNetworkAction(): string | null {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return NETWORK_OFFLINE_ACTION_RU;
  }
  return null;
}
