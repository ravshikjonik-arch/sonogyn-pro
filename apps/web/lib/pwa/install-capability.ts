/** Уже открыто как установленное PWA / standalone. */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function isIosDevice(userAgent: string): boolean {
  return /iPad|iPhone|iPod/i.test(userAgent) && !/MSStream/i.test(userAgent);
}

/** Safari (не Chrome/Firefox на iOS) — только «Поделиться → На экран Домой». */
export function isIosSafariInstallContext(userAgent: string): boolean {
  if (!isIosDevice(userAgent)) return false;
  if (/CriOS|FxiOS|EdgiOS/i.test(userAgent)) return false;
  return /Safari/i.test(userAgent);
}

export function canShowNativeInstallPrompt(hasDeferredPrompt: boolean, userAgent: string): boolean {
  return hasDeferredPrompt && !isStandaloneDisplayMode();
}

export function shouldShowIosInstallInstructions(userAgent: string): boolean {
  return isIosSafariInstallContext(userAgent) && !isStandaloneDisplayMode();
}
