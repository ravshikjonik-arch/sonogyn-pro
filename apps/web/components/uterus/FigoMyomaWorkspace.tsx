"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Download, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  PATHOLOGY_LABELS_RU,
  enrichAnnotation,
  fibroidVolumeMl,
  type PathologyAnnotation,
} from "@clinical/uterus";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { UterusSliceAtlas } from "@/components/uterus/UterusSliceAtlas";
import { FigoMyoma3DPreview } from "@/components/uterus/FigoMyoma3DPreview";
import { generateUterusSliceSnapshotDataUrl } from "@/components/uterus/sliceSnapshot";
import { useUterusAnnotations } from "@/components/uterus/useUterusAnnotations";

const FIGO_REFERENCE: Array<{ figo: number; label: string; group: string }> = [
  { figo: 0, label: "Субмукозная на ножке, интракавитарная", group: "Субмукозная" },
  { figo: 1, label: "Субмукозная, <50% интрамурального компонента", group: "Субмукозная" },
  { figo: 2, label: "Субмукозная, >=50% интрамурального компонента", group: "Субмукозная" },
  { figo: 3, label: "Контакт с эндометрием, полностью интрамуральная", group: "Интрамуральная" },
  { figo: 4, label: "Интрамуральная без контакта с эндометрием/серозой", group: "Интрамуральная" },
  { figo: 5, label: "Субсерозная, >=50% интрамурального компонента", group: "Субсерозная" },
  { figo: 6, label: "Субсерозная, <50% интрамурального компонента", group: "Субсерозная" },
  { figo: 7, label: "Субсерозная на ножке", group: "Субсерозная" },
  { figo: 8, label: "Другая локализация, включая шеечную/паразитарную", group: "Иная" },
];

const FIGO_GROUP_CLASS: Record<string, string> = {
  "Субмукозная": "bg-rose-600",
  "Интрамуральная": "bg-violet-600",
  "Субсерозная": "bg-blue-600",
  "Иная": "bg-slate-600",
};

function roundedSize(size: { length: number; width: number; depth: number }) {
  return `${Math.round(size.length)}×${Math.round(size.width)}×${Math.round(size.depth)} мм`;
}

function figoLabel(figo?: number | null): string {
  if (figo == null) return "FIGO ?";
  return `FIGO ${figo}`;
}

function formatVolume(volumeMl: number): string {
  if (volumeMl < 0.1) return "<0,1 см³";
  if (volumeMl < 10) return `${volumeMl.toFixed(1).replace(".", ",")} см³`;
  return `${Math.round(volumeMl)} см³`;
}

export function FigoMyomaWorkspace() {
  const ua = useUterusAnnotations();
  const [newPedunculated, setNewPedunculated] = useState(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const selected = ua.selectedEnriched;
  const selectedFigo = selected?.figoOverride ?? selected?.figoType ?? null;
  const selectedReference = FIGO_REFERENCE.find((item) => item.figo === selectedFigo);

  const myomas = useMemo(
    () => ua.annotations.map((a) => enrichAnnotation(a)).filter((a) => a.type === "myoma"),
    [ua.annotations],
  );
  const totalVolumeMl = useMemo(
    () => myomas.reduce((sum, myoma) => sum + fibroidVolumeMl(myoma.sizeMm), 0),
    [myomas],
  );
  const largestMyoma = useMemo(
    () => [...myomas].sort((a, b) => fibroidVolumeMl(b.sizeMm) - fibroidVolumeMl(a.sizeMm))[0] ?? null,
    [myomas],
  );

  const handleAddLesion = useCallback(
    (ann: PathologyAnnotation) => {
      const enriched = enrichAnnotation({ ...ann, type: "myoma", pedunculated: newPedunculated }, newPedunculated);
      ua.setAnnotations((prev) => [...prev, enriched]);
      ua.setSelectedId(enriched.id);
      toast.success("Миома добавлена", {
        description: figoLabel(enriched.figoOverride ?? enriched.figoType),
      });
    },
    [newPedunculated, ua],
  );

  async function copyProtocol() {
    if (!ua.protocolText.trim()) {
      toast.message("Сначала добавьте миому на схему");
      return;
    }
    await navigator.clipboard.writeText(ua.protocolText);
    toast.success("Текст скопирован");
  }

  async function downloadSnapshot() {
    if (ua.annotations.length === 0) {
      toast.message("Сначала добавьте миому на схему");
      return;
    }
    try {
      const dataUrl = await generateUterusSliceSnapshotDataUrl(ua.annotations);
      if (!dataUrl) {
        toast.error("Не удалось сформировать PNG");
        return;
      }
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `figo-myoma-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
      toast.success("PNG-схема сформирована");
    } catch {
      toast.error("Не удалось сформировать PNG");
    }
  }

  function clearAll() {
    ua.setAnnotations([]);
    ua.setSelectedId(null);
    toast.success("Схема очищена");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <main className="space-y-4">
        <Card className="overflow-hidden border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-violet-700">FIGO 0-8</Badge>
              <Badge variant="outline">2D сагиттальный срез</Badge>
              <Badge variant="outline">L x W x D</Badge>
            </div>
            <div>
              <CardTitle className="text-xl">Поставьте миоматозный узел на схеме</CardTitle>
              <CardDescription className="mt-1 leading-relaxed">
                Используйте «Точка» для быстрого маркера или «Кисть» для обводки образования. Затем уточните размеры
                и FIGO в правой панели.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={viewMode === "2d" ? "default" : "outline"} onClick={() => setViewMode("2d")}>
                2D срез
              </Button>
              <Button type="button" size="sm" variant={viewMode === "3d" ? "default" : "outline"} onClick={() => setViewMode("3d")}>
                3D preview
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "2d" ? (
              <UterusSliceAtlas
                className="mx-auto max-w-5xl"
                annotations={ua.annotations}
                selectedId={ua.selectedId}
                placeMode="myoma"
                pedunculated={selected?.type === "myoma" ? Boolean(selected.pedunculated) : newPedunculated}
                onSelect={ua.setSelectedId}
                onAddLesion={handleAddLesion}
              />
            ) : (
              <div className="space-y-3">
                <FigoMyoma3DPreview
                  annotations={ua.annotations}
                  selectedId={ua.selectedId}
                  onSelect={ua.setSelectedId}
                  onPositionCommit={ua.commitPosition}
                  pedunculated={selected?.type === "myoma" ? Boolean(selected.pedunculated) : newPedunculated}
                />
                <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                  3D preview показывает уже добавленные узлы и позволяет оценить пространственное положение. Основной
                  клинический ввод пока выполняется на 2D-срезе; 3D — следующий слой для точной сцены.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {myomas.length > 1 ? (
          <Card className="border-violet-200 bg-violet-50/80">
            <CardHeader>
              <CardTitle className="text-lg text-violet-950">Множественная миома матки</CardTitle>
              <CardDescription className="text-violet-900/80">
                Узлов: {myomas.length}. Суммарный расчётный объём ~{formatVolume(totalVolumeMl)}. Крупнейший узел:{" "}
                {largestMyoma ? `${roundedSize(largestMyoma.sizeMm)}, ${figoLabel(largestMyoma.figoOverride ?? largestMyoma.figoType)}` : "—"}.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <section className="grid gap-3 md:grid-cols-3">
          <WorkflowCard index="1" title="Поставить" text="Точка или кисть на сагиттальном срезе." />
          <WorkflowCard index="2" title="Уточнить" text="Размеры LxWxD, ножка, FIGO auto/manual." />
          <WorkflowCard index="3" title="В протокол" text="Скопировать готовый текст для описания матки." />
        </section>

        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader>
            <CardTitle>Справка FIGO 0-8</CardTitle>
            <CardDescription>
              Быстрая подсказка для врача. Авто-FIGO является предложением; финально подтверждает специалист.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {FIGO_REFERENCE.map((item) => (
              <div key={item.figo} className="flex items-start gap-3 rounded-xl border border-[var(--clinical-border)] p-3">
                <span
                  className={cn(
                    "flex h-8 w-12 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                    FIGO_GROUP_CLASS[item.group],
                  )}
                >
                  {item.figo}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--clinical-foreground)]">{item.group}</p>
                  <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">{item.label}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      <aside className="space-y-4">
        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Карточка узла</CardTitle>
                <CardDescription>Редактирование выбранной миомы.</CardDescription>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={clearAll}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Очистить
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selected ? (
              <div className="rounded-2xl border border-dashed border-[var(--clinical-border)] p-4 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                Выберите «Точка» или «Кисть» и поставьте миому на схеме. Для новой миомы можно заранее отметить
                «на ножке».
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge>{PATHOLOGY_LABELS_RU[selected.type]}</Badge>
                  <Badge variant="outline">{figoLabel(selectedFigo)}</Badge>
                  {selectedReference ? <Badge variant="outline">{selectedReference.group}</Badge> : null}
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.pedunculated ?? false}
                    onChange={(e) => ua.updateSelected({ pedunculated: e.target.checked })}
                  />
                  Узел на ножке
                </label>

                <label className="block text-sm">
                  FIGO manual override
                  <select
                    className="mt-1 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-2"
                    value={selected.figoOverride ?? selected.figoType ?? 4}
                    onChange={(e) => ua.updateSelected({ figoOverride: Number(e.target.value) })}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        FIGO {n}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {(["length", "width", "depth"] as const).map((key) => (
                    <label key={key} className="text-xs">
                      {key === "length" ? "Длина" : key === "width" ? "Ширина" : "Глубина"} (мм)
                      <Input
                        inputMode="decimal"
                        className="mt-1"
                        value={selected.sizeMm[key]}
                        onChange={(e) => {
                          const v = Number.parseFloat(e.target.value);
                          if (!Number.isFinite(v) || v <= 0) return;
                          ua.updateSelected({ sizeMm: { ...selected.sizeMm, [key]: v } });
                        }}
                      />
                    </label>
                  ))}
                </div>

                <div className="rounded-xl bg-[var(--clinical-muted)] p-3 text-sm">
                  <p className="font-semibold">Итог</p>
                  <p className="mt-1 text-[var(--clinical-foreground-muted)]">
                    {selected.localizationRu ?? "локализация уточняется"}, размеры {roundedSize(selected.sizeMm)}, объём ~
                    {formatVolume(fibroidVolumeMl(selected.sizeMm))}.
                  </p>
                  {selectedReference ? (
                    <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">{selectedReference.label}</p>
                  ) : null}
                </div>

                <Button type="button" variant="destructive" size="sm" onClick={ua.removeSelected}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить выбранный узел
                </Button>
              </>
            )}

            {!selected ? (
              <label className="flex items-center gap-2 rounded-xl bg-[var(--clinical-muted)] p-3 text-sm">
                <input
                  type="checkbox"
                  checked={newPedunculated}
                  onChange={(e) => setNewPedunculated(e.target.checked)}
                />
                Новая миома на ножке
              </label>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader>
            <CardTitle>Список миом ({myomas.length})</CardTitle>
            <CardDescription>Несколько узлов нумеруются отдельными строками протокола.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {myomas.length === 0 ? (
              <p className="text-sm text-[var(--clinical-foreground-muted)]">Миомы ещё не добавлены.</p>
            ) : (
              myomas.map((myoma, index) => (
                <button
                  key={myoma.id}
                  type="button"
                  onClick={() => ua.setSelectedId(myoma.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left text-sm transition-colors",
                    ua.selectedId === myoma.id
                      ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)]"
                      : "border-[var(--clinical-border)] hover:bg-[var(--clinical-muted)]",
                  )}
                >
                  <span className="font-semibold">
                    Узел {index + 1} · {figoLabel(myoma.figoOverride ?? myoma.figoType)}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--clinical-foreground-muted)]">
                    {roundedSize(myoma.sizeMm)} · ~{formatVolume(fibroidVolumeMl(myoma.sizeMm))} ·{" "}
                    {myoma.localizationRu ?? "локализация уточняется"}
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader>
            <CardTitle>Текст для протокола</CardTitle>
            <CardDescription>Можно скопировать в описание матки или использовать через протокол УЗИ.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--clinical-muted)] p-3 font-sans text-sm leading-relaxed">
              {ua.protocolText || "Добавьте миому на схему — здесь появится текст."}
            </pre>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" className="flex-1" onClick={() => void copyProtocol()}>
                <Copy className="mr-2 h-4 w-4" />
                Скопировать
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => void downloadSnapshot()}>
                <Download className="mr-2 h-4 w-4" />
                PNG
              </Button>
              <Button type="button" variant="secondary" className="flex-1" asChild>
                <Link href="/workspace">Открыть протокол</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function WorkflowCard({ index, title, text }: { index: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--clinical-primary)] text-sm font-bold text-white">
        {index}
      </div>
      <p className="font-semibold text-[var(--clinical-foreground)]">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">{text}</p>
    </div>
  );
}
