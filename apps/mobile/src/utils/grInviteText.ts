import Constants from "expo-constants";

/** Deep link for Expo Go when the bundle is served by `expo start` (LAN or tunnel). */
export function getExpoGoDevDeepLink(): string | null {
  const exp = Constants.experienceUrl;
  if (typeof exp === "string" && exp.startsWith("exp://")) {
    return exp;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (typeof hostUri === "string" && hostUri.length > 0) {
    return `exp://${hostUri}`;
  }
  return null;
}

/** RU steps for colleagues: Expo Go + tunnel + optional exp link + trial code. */
export function buildGrTeamInviteMessage(): string {
  const slug = Constants.expoConfig?.slug ?? "us-risk-calc";
  const url = getExpoGoDevDeepLink();
  const urlBlock = url
    ? `Ссылка для Expo Go (если не сканируете QR):\n${url}`
    : "Ссылку возьмите из QR в терминале (Expo) или попросите ведущего прислать exp://…";

  return [
    "Команда GR — пилот O-RADS / ovarian-calc",
    "",
    "1) Установите «Expo Go» (App Store / Google Play).",
    "",
    "2) Ведущий в папке проекта запускает туннель (удобно без общей Wi‑Fi):",
    "   npm run start:share",
    "",
    "3) Откройте проект:",
    "   • отсканируйте QR из терминала, или",
    `   • ${urlBlock}`,
    "",
    "4) В приложении: Профиль → введите одноразовый trial-код (выдаёт ведущий).",
    "",
    `Проект Expo: ${slug}, порт CLI: 8085`,
  ].join("\n");
}
