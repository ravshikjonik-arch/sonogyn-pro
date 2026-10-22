"use client";

export const PWA_INSTALL_OPEN_EVENT = "sonogyn:open-pwa-install";

export type PwaInstallOpenDetail = {
  source?: "menu" | "banner";
};

export function openPwaInstall(detail: PwaInstallOpenDetail = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PwaInstallOpenDetail>(PWA_INSTALL_OPEN_EVENT, { detail }));
}

export function onPwaInstallOpen(handler: (detail: PwaInstallOpenDetail) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<PwaInstallOpenDetail>).detail ?? {});
  window.addEventListener(PWA_INSTALL_OPEN_EVENT, listener);
  return () => window.removeEventListener(PWA_INSTALL_OPEN_EVENT, listener);
}
