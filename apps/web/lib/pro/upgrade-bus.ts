"use client";

/** Шина для открытия модалки апгрейда на PRO из любого места. */
export const UPGRADE_OPEN_EVENT = "sonogyn:open-upgrade";

export type UpgradeOpenDetail = {
  /** Что заблокировано — для контекстного заголовка. */
  feature?: string;
};

export function openUpgrade(detail: UpgradeOpenDetail = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<UpgradeOpenDetail>(UPGRADE_OPEN_EVENT, { detail }));
}

export function onUpgradeOpen(handler: (detail: UpgradeOpenDetail) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<UpgradeOpenDetail>).detail ?? {});
  window.addEventListener(UPGRADE_OPEN_EVENT, listener);
  return () => window.removeEventListener(UPGRADE_OPEN_EVENT, listener);
}
