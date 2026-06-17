"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CalcStepCard } from "@/components/calculators/shared/calc-ui";
import type { ColposcopySession } from "@/lib/colposcopy";

const STORAGE_KEY = "sonogyn_colposcopy_history_v1";

export function loadColposcopyHistory(): ColposcopySession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ColposcopySession[]) : [];
  } catch {
    return [];
  }
}

export function saveColposcopyHistory(items: ColposcopySession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
}

type Props = {
  onLoad: (session: ColposcopySession) => void;
};

export function ColposcopyHistoryPanel({ onLoad }: Props) {
  const [items, setItems] = useState<ColposcopySession[]>([]);

  const refresh = useCallback(() => setItems(loadColposcopyHistory()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function remove(id: string) {
    const next = items.filter((i) => i.id !== id);
    saveColposcopyHistory(next);
    setItems(next);
  }

  function clearAll() {
    if (!confirm("Очистить всю локальную историю кольпоскопий?")) return;
    saveColposcopyHistory([]);
    setItems([]);
  }

  return (
    <CalcStepCard title="История осмотров (локально в браузере)">
      <p className="mb-2 text-xs text-[var(--clinical-foreground-muted)]">
        Данные не уходят на сервер — только на этом устройстве. Для ЭМК используйте экспорт PDF.
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--clinical-foreground-muted)]">Нет сохранённых осмотров</p>
      ) : (
        <ul className="max-h-48 space-y-2 overflow-y-auto">
          {items.map((h) => (
            <li
              key={h.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--clinical-border)] bg-white px-3 py-2 text-sm"
            >
              <div>
                <span className="font-bold">{h.protocol.patientName || "Без имени"}</span>
                <span className="text-[var(--clinical-foreground-muted)]">
                  {" "}
                  · {h.swedeResult.total} б. · {new Date(h.savedAt).toLocaleString("ru-RU")}
                </span>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => onLoad(h)}>
                  Открыть
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => remove(h.id)}>
                  Удалить
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 ? (
        <Button type="button" size="sm" variant="outline" className="mt-2" onClick={clearAll}>
          Очистить всё
        </Button>
      ) : null}
    </CalcStepCard>
  );
}
