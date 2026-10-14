"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  clearLocalRecovery,
  localRecoveryKey,
  readLocalRecovery,
  writeLocalRecovery,
} from "@/lib/structured-editor/autosave-storage";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error" | "conflict";

type UseStructuredAutosaveOptions<T> = {
  scope: "case" | "protocol";
  entityId: string;
  value: T;
  enabled?: boolean;
  debounceMs?: number;
  serverUpdatedAt?: string | null;
  onSave: (value: T, opts: { isAutosave: boolean; expectedUpdatedAt?: string }) => Promise<{
    ok: boolean;
    updatedAt?: string;
    conflict?: boolean;
    error?: string;
  }>;
  onRecovered?: (value: T) => void;
};

export function useStructuredAutosave<T>({
  scope,
  entityId,
  value,
  enabled = true,
  debounceMs = 1500,
  serverUpdatedAt,
  onSave,
  onRecovered,
}: UseStructuredAutosaveOptions<T>) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recoveryChecked = useRef(false);
  const latestUpdatedAt = useRef(serverUpdatedAt ?? undefined);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestUpdatedAt.current = serverUpdatedAt ?? undefined;
  }, [serverUpdatedAt]);

  useEffect(() => {
    if (recoveryChecked.current || !entityId) return;
    recoveryChecked.current = true;
    const key = localRecoveryKey(scope, entityId);
    const recovered = readLocalRecovery<T>(key);
    if (!recovered) return;
    if (!serverUpdatedAt || !recovered.serverUpdatedAt || recovered.serverUpdatedAt === serverUpdatedAt) {
      onRecovered?.(recovered.payload);
      setStatus("saved");
      setLastSavedAt(recovered.savedAt);
    }
  }, [entityId, onRecovered, scope, serverUpdatedAt]);

  const persist = useCallback(
    async (next: T, isAutosave: boolean) => {
      setStatus("saving");
      setError(null);
      const result = await onSave(next, {
        isAutosave,
        expectedUpdatedAt: latestUpdatedAt.current,
      });
      if (result.conflict) {
        setStatus("conflict");
        setError("Документ изменён в другой вкладке. Обновите страницу.");
        return false;
      }
      if (!result.ok) {
        setStatus("error");
        setError(result.error ?? "Не удалось сохранить");
        writeLocalRecovery(localRecoveryKey(scope, entityId), next, latestUpdatedAt.current);
        return false;
      }
      if (result.updatedAt) latestUpdatedAt.current = result.updatedAt;
      clearLocalRecovery(localRecoveryKey(scope, entityId));
      setStatus("saved");
      setLastSavedAt(new Date().toISOString());
      return true;
    },
    [entityId, onSave, scope],
  );

  const saveNow = useCallback(async () => persist(value, false), [persist, value]);

  useEffect(() => {
    if (!enabled || !entityId) return;
    setStatus("pending");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void persist(value, true);
    }, debounceMs);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [debounceMs, enabled, entityId, persist, value]);

  return { status, lastSavedAt, error, saveNow, persist };
}
