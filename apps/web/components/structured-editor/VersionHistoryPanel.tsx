"use client";

import type { StructuredDocumentVersion } from "@repo/types";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  fetchVersions: () => Promise<StructuredDocumentVersion[]>;
  onRestore: (versionId: string) => Promise<void>;
  disabled?: boolean;
};

export function VersionHistoryPanel({ fetchVersions, onRestore, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<StructuredDocumentVersion[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await fetchVersions();
    setVersions(list);
  }, [fetchVersions]);

  useEffect(() => {
    if (open) void load();
  }, [load, open]);

  return (
    <div className="rounded-xl border border-[var(--clinical-border)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">История версий</p>
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Скрыть" : "Показать"}
        </Button>
      </div>
      {open ? (
        <ul className="mt-3 space-y-2">
          {versions.length === 0 ? (
            <li className="text-xs text-[var(--clinical-foreground-muted)]">Версий пока нет</li>
          ) : (
            versions.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--clinical-muted)]/50 px-3 py-2 text-xs"
              >
                <span>
                  v{v.versionNumber} · {new Date(v.createdAt).toLocaleString()}
                  {v.changeSummary ? ` · ${v.changeSummary}` : ""}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled || busyId === v.id}
                  onClick={async () => {
                    setBusyId(v.id);
                    try {
                      await onRestore(v.id);
                      await load();
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  Восстановить
                </Button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
