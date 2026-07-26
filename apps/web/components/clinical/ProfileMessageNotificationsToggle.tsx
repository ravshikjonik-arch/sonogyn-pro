"use client";

import { isMessageNotificationsEnabled } from "@repo/types";
import { useCallback, useEffect, useState } from "react";

type Props = {
  /** Начальное значение с сервера (страница профиля). */
  initialEnabled?: boolean;
};

/** Глобальный переключатель push о сообщениях / ответах в обсуждениях. */
export function ProfileMessageNotificationsToggle({ initialEnabled = true }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const persist = useCallback(async (next: boolean) => {
    setSyncing(true);
    setError(null);
    const prev = enabled;
    setEnabled(next);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          clinical_preferences: { notifications: { messagesEnabled: next } },
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: unknown } | null;
        const msg =
          typeof payload?.error === "string"
            ? payload.error
            : `Не удалось сохранить (HTTP ${res.status})`;
        setEnabled(prev);
        setError(msg);
        return;
      }
      const body = (await res.json().catch(() => null)) as {
        profile?: { clinical_preferences?: unknown };
      } | null;
      if (body?.profile?.clinical_preferences) {
        setEnabled(isMessageNotificationsEnabled(body.profile.clinical_preferences));
      }
    } catch {
      setEnabled(prev);
      setError("Сеть недоступна — попробуйте ещё раз.");
    } finally {
      setSyncing(false);
    }
  }, [enabled]);

  return (
    <div className="mt-8 space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Уведомления о сообщениях
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Push на телефон: ответы в обсуждениях кейсов и сообщения в чатах врачей. Можно выключить
            в любой момент. Нужно приложение SonoGyn Pro с разрешёнными уведомлениями ОС.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={syncing}
          onClick={() => void persist(!enabled)}
          className={
            enabled
              ? "relative h-7 w-12 shrink-0 rounded-full bg-[var(--clinical-primary,#005CB9)] transition disabled:opacity-60"
              : "relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition dark:bg-slate-600 disabled:opacity-60"
          }
        >
          <span
            className={
              enabled
                ? "absolute top-0.5 left-6 h-6 w-6 rounded-full bg-white shadow transition"
                : "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition"
            }
          />
        </button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Сейчас:{" "}
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {enabled ? "включены" : "выключены"}
        </span>
        {syncing ? " · сохранение…" : null}
      </p>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
