"use client";

import {
  buildProtocolInsertion,
  pushRecentNosology,
  type Nosology,
} from "@repo/nosology";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNosologyList } from "@/hooks/useNosologies";
import { cn } from "@/lib/utils/cn";

export type NosologyProtocolInsert = {
  diagnosis: string;
  conclusion: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  studyId?: string;
  onInsert: (payload: NosologyProtocolInsert) => void;
};

export function NosologyPickerModal({ open, onClose, studyId, onInsert }: Props) {
  const { items, loading, query, setQuery, hits } = useNosologyList();
  const [sizeMm, setSizeMm] = useState("");
  const [localization, setLocalization] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    if (hits.length === 0) return [];
    const ids = new Set(hits.map((h) => h.id));
    return items.filter((n) => ids.has(n.id));
  }, [items, query, hits]);

  const pick = (n: Nosology) => {
    pushRecentNosology(n.id);
    const { diagnosis, conclusion } = buildProtocolInsertion(n.diagnosisLine, n.protocolTemplate, {
      размер: sizeMm || "—",
      локализация: localization || "не уточнена",
      степень: "не оценена",
    });
    onInsert({ diagnosis, conclusion });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--clinical-border)] px-4 py-3">
          <h2 className="text-lg font-bold">Нозологии</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Закрыть">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 border-b border-[var(--clinical-border)] px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
            <Input
              className="pl-9"
              placeholder="Поиск заболевания…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Размер, мм" value={sizeMm} onChange={(e) => setSizeMm(e.target.value)} />
            <Input
              placeholder="Локализация"
              value={localization}
              onChange={(e) => setLocalization(e.target.value)}
            />
          </div>
          <p className="text-xs text-[var(--clinical-foreground-muted)]">
            <Link href={studyId ? `/nosologies?studyId=${studyId}` : "/nosologies"} className="underline">
              Открыть полный справочник →
            </Link>
          </p>
        </div>

        <ul className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <li className="p-4 text-center text-sm opacity-60">Загрузка…</li>
          ) : filtered.length === 0 ? (
            <li className="p-4 text-center text-sm opacity-60">Ничего не найдено</li>
          ) : (
            filtered.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-lg px-3 py-3 text-left transition-colors hover:bg-[var(--clinical-muted)]",
                  )}
                  onClick={() => pick(n)}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--clinical-foreground-muted)]">{n.description}</p>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
