"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  PATHOLOGY_LABELS_RU,
  enrichAnnotation,
  suggestFigoAlternatives,
  type PathologyAnnotation,
  type PathologyType,
} from "@clinical/uterus";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { UterusSliceAtlas } from "@/components/uterus/UterusSliceAtlas";
import { useUterusAnnotations } from "@/components/uterus/useUterusAnnotations";

export function ClinicalUterusWorkspace() {
  const ua = useUterusAnnotations();
  const [pedunculated, setPedunculated] = useState(false);

  const figoAlternatives = useMemo(() => {
    if (!ua.selectedEnriched || ua.selectedEnriched.type !== "myoma") return [];
    const figo = ua.selectedEnriched.figoOverride ?? ua.selectedEnriched.figoType ?? 4;
    return suggestFigoAlternatives(figo);
  }, [ua.selectedEnriched]);

  const onAddLesion = useCallback(
    (ann: PathologyAnnotation) => {
      const enriched = enrichAnnotation(ann, pedunculated);
      ua.setAnnotations((prev) => [...prev, enriched]);
      ua.setSelectedId(enriched.id);
      const figo =
        enriched.type === "myoma" && enriched.figoType != null ? ` · FIGO ${enriched.figoOverride ?? enriched.figoType}` : "";
      toast.success(PATHOLOGY_LABELS_RU[ua.placeMode], {
        description: `${enriched.localizationRu ?? "Узел на срезе"}${figo}`,
      });
    },
    [ua, pedunculated],
  );

  const resetLesions = useCallback(() => {
    ua.setAnnotations([]);
    ua.setSelectedId(null);
    toast.message("Маркеры сброшены");
  }, [ua]);

  return (
    <Card className="overflow-hidden shadow-xl ring-1 ring-slate-100/80 dark:ring-slate-800/80">
      <div className="border-b bg-gradient-to-r from-white via-[var(--clinical-muted)]/35 to-white px-5 py-5 dark:from-slate-950 dark:via-slate-900/85 dark:to-slate-950">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--clinical-primary-deep)]">
          Сагиттальный срез · статическая схема
        </p>
        <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
          Планирование поражений матки
        </h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          Редактор среза: приближайте схему жестами, обводите образование кистью. FIGO для миомы — автоматически.
        </p>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(280px,340px)_1fr]">
        <CardContent className="space-y-4 border-b border-slate-100 p-5 xl:border-b-0 xl:border-r dark:border-slate-800">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Новый маркер</p>
            <div className="mt-3 flex flex-wrap gap-2">
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
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={pedunculated} onChange={(e) => setPedunculated(e.target.checked)} />
                На ножке (FIGO 0 / 7)
              </label>
            ) : null}
          </div>

          {ua.selectedEnriched ? (
            <section className="space-y-3 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3">
              <p className="font-semibold">{PATHOLOGY_LABELS_RU[ua.selectedEnriched.type]}</p>
              {ua.selectedEnriched.localizationRu ? (
                <p className="text-xs text-[var(--clinical-foreground-muted)]">{ua.selectedEnriched.localizationRu}</p>
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
                  {figoAlternatives.length > 0 ? (
                    <p className="text-[10px] text-amber-600">Варианты: {figoAlternatives.map((n) => `FIGO ${n}`).join(", ")}</p>
                  ) : null}
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
            <p className="text-sm text-[var(--clinical-foreground-muted)]">Коснитесь среза, чтобы поставить маркер.</p>
          )}

          <Badge variant="outline">{ua.annotations.length} маркер(ов)</Badge>

          <Button variant="ghost" size="sm" className="w-full" type="button" onClick={resetLesions}>
            Сбросить все маркеры
          </Button>

          <Separator />

          <div className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">Протокол</p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {ua.protocolText || "—"}
            </pre>
          </div>
        </CardContent>

        <div className="bg-gradient-to-b from-slate-50 to-white p-5 dark:from-slate-950 dark:to-slate-900">
          <UterusSliceAtlas
            annotations={ua.annotations}
            selectedId={ua.selectedId}
            placeMode={ua.placeMode}
            pedunculated={pedunculated}
            onSelect={ua.setSelectedId}
            onAddLesion={onAddLesion}
          />
        </div>
      </div>
    </Card>
  );
}
