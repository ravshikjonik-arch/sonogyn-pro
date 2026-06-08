"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  MODEL_SCALE_MAX,
  MODEL_SCALE_MIN,
  PATHOLOGY_LABELS_RU,
  enrichAnnotation,
  type PathologyAnnotation,
  type PathologyType,
} from "@clinical/uterus";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { UterusSliceAtlas } from "./UterusSliceAtlas";
import { useUterusAnnotations, type UterusVisualizationState } from "./useUterusAnnotations";

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: UterusVisualizationState;
  onApply: (result: { protocolText: string; state: UterusVisualizationState }) => void;
};

export function UterusVisualizationModal({ open, onClose, initial, onApply }: Props) {
  const ua = useUterusAnnotations(initial);
  const [newMyomaPedunculated, setNewMyomaPedunculated] = useState(false);

  const pickPedunculated =
    ua.selectedEnriched?.type === "myoma"
      ? Boolean(ua.selectedEnriched.pedunculated)
      : ua.placeMode === "myoma"
        ? newMyomaPedunculated
        : false;

  const onAddLesion = useCallback(
    (ann: PathologyAnnotation) => {
      const enriched = enrichAnnotation(ann, pickPedunculated);
      ua.setAnnotations((prev) => [...prev, enriched]);
      ua.setSelectedId(enriched.id);
      toast.success(PATHOLOGY_LABELS_RU[ua.placeMode], {
        description:
          enriched.type === "myoma" && enriched.figoType != null
            ? `FIGO ${enriched.figoOverride ?? enriched.figoType}`
            : "Узел на срезе",
      });
    },
    [ua, pickPedunculated],
  );

  const handleApply = useCallback(() => {
    const state = ua.exportState();
    onApply({ protocolText: ua.protocolText, state });
    toast.success("Текст добавлен в протокол");
    onClose();
  }, [ua, onApply, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--clinical-background)]">
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--clinical-border)] px-4 py-3">
        <div className="flex-1">
          <h2 className="text-lg font-bold">Сагиттальный срез матки</h2>
          <p className="text-xs text-[var(--clinical-foreground-muted)]">
            Статическая схема · «Рука» — сдвиг и pinch · «Кисть» — обвести узел
          </p>
        </div>
        <Button type="button" onClick={handleApply}>
          В протокол
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Закрыть
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4 dark:from-slate-950 dark:to-slate-900">
          <UterusSliceAtlas
            className="max-w-4xl"
            annotations={ua.annotations}
            selectedId={ua.selectedId}
            placeMode={ua.placeMode}
            pedunculated={pickPedunculated}
            onSelect={ua.setSelectedId}
            onAddLesion={onAddLesion}
          />
        </div>

        <aside className="flex w-full flex-col border-t border-[var(--clinical-border)] bg-[var(--clinical-sidebar)] lg:w-96 lg:border-l lg:border-t-0">
          <div className="space-y-4 overflow-y-auto p-4">
            <section>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                Масштаб схемы ({Math.round(ua.modelScale * 100)}%)
              </p>
              <input
                type="range"
                min={MODEL_SCALE_MIN}
                max={MODEL_SCALE_MAX}
                step={0.01}
                value={ua.modelScale}
                onChange={(e) => ua.setModelScale(Number(e.target.value))}
                className="h-2 w-full accent-[var(--clinical-primary)]"
              />
            </section>

            <section>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                Тип маркера
              </p>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(PATHOLOGY_LABELS_RU) as PathologyType[]).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    variant={ua.placeMode === t ? "default" : "secondary"}
                    onClick={() => ua.setPlaceMode(t)}
                  >
                    {PATHOLOGY_LABELS_RU[t]}
                  </Button>
                ))}
              </div>
              {ua.placeMode === "myoma" && !ua.selectedEnriched ? (
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newMyomaPedunculated}
                    onChange={(e) => setNewMyomaPedunculated(e.target.checked)}
                  />
                  На ножке (для нового маркера)
                </label>
              ) : null}
            </section>

            {ua.selectedEnriched ? (
              <section className="space-y-3 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3">
                <p className="font-semibold">{PATHOLOGY_LABELS_RU[ua.selectedEnriched.type]}</p>
                {ua.selectedEnriched.localizationRu ? (
                  <p className="text-xs text-[var(--clinical-foreground-muted)]">
                    {ua.selectedEnriched.localizationRu}
                  </p>
                ) : null}

                {ua.selectedEnriched.type === "myoma" ? (
                  <>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={ua.selectedEnriched.pedunculated ?? false}
                        onChange={(e) => ua.updateSelected({ pedunculated: e.target.checked })}
                      />
                      На ножке (FIGO)
                    </label>
                    <label className="block text-sm">
                      FIGO
                      <select
                        className="mt-1 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-2"
                        value={ua.selectedEnriched.figoOverride ?? ua.selectedEnriched.figoType ?? 4}
                        onChange={(e) => ua.updateSelected({ figoOverride: Number(e.target.value) })}
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>
                            FIGO {n}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : null}

                <div className="grid grid-cols-3 gap-2">
                  {(["length", "width", "depth"] as const).map((k) => {
                    const sel = ua.selectedEnriched!;
                    return (
                      <label key={k} className="text-xs">
                        {k === "length" ? "Длина" : k === "width" ? "Ширина" : "Глубина"} (мм)
                        <Input
                          inputMode="decimal"
                          className="mt-1"
                          value={sel.sizeMm[k]}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!Number.isFinite(v)) return;
                            ua.updateSelected({ sizeMm: { ...sel.sizeMm, [k]: v } });
                          }}
                        />
                      </label>
                    );
                  })}
                </div>

                <Button type="button" variant="destructive" size="sm" onClick={ua.removeSelected}>
                  Удалить маркер
                </Button>
              </section>
            ) : (
              <p className="text-sm text-[var(--clinical-foreground-muted)]">
                Коснитесь среза на схеме, чтобы поставить маркер.
              </p>
            )}

            <section>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                Маркеры ({ua.annotations.length})
              </p>
              <ul className="space-y-1">
                {ua.annotations.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm",
                        ua.selectedId === a.id
                          ? "bg-[var(--clinical-primary-muted)] font-semibold"
                          : "hover:bg-[var(--clinical-muted)]",
                      )}
                      onClick={() => ua.setSelectedId(a.id)}
                    >
                      {PATHOLOGY_LABELS_RU[a.type]}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                Текст для протокола
              </p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {ua.protocolText || "—"}
              </pre>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
