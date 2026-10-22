"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Баннер «Доступна новая версия» — только production (SW от next-pwa).
 */
export function PwaUpdateBanner() {
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const wb = window.workbox;
    if (!wb) return;

    const onWaiting = () => setWaiting(true);
    wb.addEventListener("waiting", onWaiting);

    return () => {
      wb.removeEventListener("waiting", onWaiting);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    const wb = window.workbox;
    if (!wb) {
      window.location.reload();
      return;
    }
    wb.addEventListener("controlling", () => window.location.reload());
    wb.messageSkipWaiting();
  }, []);

  if (!waiting) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 z-[100] mx-auto flex max-w-md flex-col gap-3 rounded-[var(--radius-card,12px)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-[var(--text-primary)]">Доступна новая версия SonoGyn Pro.</p>
      <Button type="button" size="sm" onClick={applyUpdate} className="shrink-0">
        Обновить
      </Button>
    </div>
  );
}
