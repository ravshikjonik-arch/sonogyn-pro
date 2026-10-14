"use client";

import type { StructuredMediaRef } from "@repo/types";
import { useEffect, useState } from "react";

import { structuredEditorUuid } from "@/lib/structured-editor/uuid";

type CaseMediaItem = {
  id: string;
  media_type: string;
  order_index: number;
  url?: string | null;
};

type Props = {
  caseId: string;
  onInsert: (ref: StructuredMediaRef) => void;
  disabled?: boolean;
};

export function StructuredCaseMediaInsert({ caseId, onInsert, disabled }: Props) {
  const [items, setItems] = useState<CaseMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/cases/${caseId}/media`);
      const json = (await res.json().catch(() => null)) as { media?: CaseMediaItem[] } | null;
      if (!cancelled) {
        setItems(json?.media ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId, open]);

  function pick(item: CaseMediaItem) {
    onInsert({
      id: structuredEditorUuid(),
      mediaId: item.id,
      label: `Кадр #${item.order_index + 1} (${item.media_type})`,
      insertedAt: new Date().toISOString(),
    });
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        className="text-xs font-semibold text-[var(--clinical-primary-deep)] underline-offset-2 hover:underline"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        + Выбрать ключевой кадр из галереи кейса
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-[var(--clinical-border)] p-3">
      <p className="text-xs font-semibold text-[var(--clinical-foreground-muted)]">
        Обезличенные изображения из галереи кейса
      </p>
      {loading ? <p className="text-xs">Загрузка…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Нет загруженных снимков. Добавьте медиа в галерею ниже на странице кейса.
        </p>
      ) : null}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="w-full rounded-lg border border-[var(--clinical-border)] px-3 py-2 text-left text-xs hover:bg-[var(--clinical-muted)]"
              disabled={disabled}
              onClick={() => pick(item)}
            >
              Кадр #{item.order_index + 1} · {item.media_type}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="text-xs underline" onClick={() => setOpen(false)}>
        Отмена
      </button>
    </div>
  );
}
