"use client";

/**
 * Лёгкая шина событий для глобального AI Copilot.
 * Любой компонент может открыть копайлот (и передать стартовый запрос),
 * не завися напрямую от его реализации.
 */
export const COPILOT_OPEN_EVENT = "sonogyn:open-copilot";

export type CopilotOpenDetail = {
  prompt?: string;
  /** Команда/режим, который копайлот может распознать. */
  command?: string;
};

export function openCopilot(detail: CopilotOpenDetail = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CopilotOpenDetail>(COPILOT_OPEN_EVENT, { detail }));
}

export function onCopilotOpen(handler: (detail: CopilotOpenDetail) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<CopilotOpenDetail>).detail ?? {});
  window.addEventListener(COPILOT_OPEN_EVENT, listener);
  return () => window.removeEventListener(COPILOT_OPEN_EVENT, listener);
}
