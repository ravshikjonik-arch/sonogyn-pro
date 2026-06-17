"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { UTERUS_SAGITTAL_SLICE_SRC } from "@clinical/uterus";
import { UTERUS_CORONAL_ANATOMY_SRC } from "@repo/clinical-3d";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_SCAR_WORKSPACE_STATE,
  SCAR_PREGNANCY_RELATION_LABELS,
  SCAR_STRUCTURE_LABELS,
  buildScarWorkspaceProtocol,
  scarPregnancyHint,
  scarRiskHint,
  type ScarPregnancyRelation,
  type ScarScenario,
  type ScarStructure,
  type ScarWorkspaceState,
} from "@/lib/scar/scar-workspace";

type Tool = "scar" | "sac" | "draw_scar";
type ViewMode = "sagittal" | "coronal";
type NormPoint = { x: number; y: number };

type Props = {
  compact?: boolean;
  onApply?: (protocolText: string) => void;
};

const SAGITTAL_VIEW = { w: 800, h: 500 };
const CORONAL_VIEW = { w: 1000, h: 750 };
const INTERNAL_OS = { x: 410, y: 406 };
const SCAR_POINT_DEFAULT = { x: 0.52, y: 0.69 };
const SAC_POINT_DEFAULT = { x: 0.5, y: 0.48 };
const MM_PER_PX = 0.32;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normFromPointer(event: React.PointerEvent<SVGSVGElement>): NormPoint {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: clamp01((event.clientX - rect.left) / rect.width),
    y: clamp01((event.clientY - rect.top) / rect.height),
  };
}

function px(point: NormPoint, view: { w: number; h: number }) {
  return { x: point.x * view.w, y: point.y * view.h };
}

function distanceMm(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y) * MM_PER_PX);
}

function pathFromStroke(points: NormPoint[], view: { w: number; h: number }) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x * view.w} ${point.y * view.h}`).join(" ");
}

export function ScarNicheWorkspace({ compact, onApply }: Props) {
  const [state, setState] = useState<ScarWorkspaceState>(DEFAULT_SCAR_WORKSPACE_STATE);
  const [viewMode, setViewMode] = useState<ViewMode>("sagittal");
  const [tool, setTool] = useState<Tool>("scar");
  const [scarPoint, setScarPoint] = useState<NormPoint>(SCAR_POINT_DEFAULT);
  const [sacPoint, setSacPoint] = useState<NormPoint>(SAC_POINT_DEFAULT);
  const [scarStroke, setScarStroke] = useState<NormPoint[]>([]);
  const [draftStroke, setDraftStroke] = useState<NormPoint[]>([]);
  const drawing = useRef(false);
  const protocolText = useMemo(() => buildScarWorkspaceProtocol(state), [state]);

  function patch(update: Partial<ScarWorkspaceState>) {
    setState((current) => ({ ...current, ...update }));
  }

  function handleSagittalPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    const norm = normFromPointer(event);
    if (tool === "draw_scar") {
      drawing.current = true;
      setDraftStroke([norm]);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (tool === "scar") {
      setScarPoint(norm);
      const scarPx = px(norm, SAGITTAL_VIEW);
      patch({
        distanceFromInternalOsMm: distanceMm(scarPx, INTERNAL_OS),
      });
      return;
    }
    setSacPoint(norm);
    const sacPx = px(norm, SAGITTAL_VIEW);
    const scarPx = px(scarPoint, SAGITTAL_VIEW);
    const toScar = distanceMm(sacPx, scarPx);
    patch({
      scenario: "early_pregnancy",
      gestationalSacDistanceToScarMm: toScar,
      gestationalSacDistanceToInternalOsMm: distanceMm(sacPx, INTERNAL_OS),
      scarPregnancyRelation: toScar < 5 ? "implanted_in_scar" : toScar < 12 ? "near_scar" : "away_from_scar",
    });
  }

  function handleSagittalPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!drawing.current || tool !== "draw_scar") return;
    const norm = normFromPointer(event);
    setDraftStroke((current) => [...current, norm]);
  }

  function handleSagittalPointerUp() {
    if (!drawing.current) return;
    drawing.current = false;
    if (draftStroke.length >= 2) setScarStroke(draftStroke);
    setDraftStroke([]);
  }

  function handleCoronalPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    const norm = normFromPointer(event);
    setScarPoint(norm);
  }

  async function copyProtocol() {
    await navigator.clipboard.writeText(protocolText);
    toast.success("Текст по рубцу скопирован");
  }

  function applyToProtocol() {
    onApply?.(protocolText);
    toast.success("Блок рубца добавлен в протокол");
  }

  const scarPx = px(scarPoint, SAGITTAL_VIEW);
  const sacPx = px(sacPoint, SAGITTAL_VIEW);
  const coronalScarPx = px(scarPoint, CORONAL_VIEW);

  return (
    <div className={compact ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]" : "grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"}>
      <main className="space-y-4">
        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-slate-700">Рубец после КС</Badge>
              <Badge variant="outline">ниша / истмоцеле</Badge>
              <Badge variant="outline">CSP</Badge>
            </div>
            <CardTitle>Сагиттальный и коронарный срезы матки</CardTitle>
            <CardDescription>
              Отметьте зону рубца/ниши рукой или мышкой. Для ранней беременности поставьте плодное яйцо относительно
              рубца и внутреннего зева.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={viewMode === "sagittal" ? "default" : "outline"} onClick={() => setViewMode("sagittal")}>
                Сагиттальный срез
              </Button>
              <Button type="button" size="sm" variant={viewMode === "coronal" ? "default" : "outline"} onClick={() => setViewMode("coronal")}>
                Фронтальный / коронарный
              </Button>
              <Button type="button" size="sm" variant={tool === "scar" ? "default" : "outline"} onClick={() => setTool("scar")}>
                Рубец
              </Button>
              <Button type="button" size="sm" variant={tool === "draw_scar" ? "default" : "outline"} onClick={() => setTool("draw_scar")}>
                Обвести рубец
              </Button>
              <Button type="button" size="sm" variant={tool === "sac" ? "default" : "outline"} onClick={() => setTool("sac")}>
                Плодное яйцо
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => {
                setState(DEFAULT_SCAR_WORKSPACE_STATE);
                setScarPoint(SCAR_POINT_DEFAULT);
                setSacPoint(SAC_POINT_DEFAULT);
                setScarStroke([]);
              }}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Сброс
              </Button>
            </div>

            {viewMode === "sagittal" ? (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2">
                <svg
                  viewBox={`0 0 ${SAGITTAL_VIEW.w} ${SAGITTAL_VIEW.h}`}
                  className="mx-auto aspect-[16/10] w-full cursor-crosshair select-none"
                  role="img"
                  aria-label="Сагиттальный срез матки: рубец и ранняя беременность"
                  onPointerDown={handleSagittalPointerDown}
                  onPointerMove={handleSagittalPointerMove}
                  onPointerUp={handleSagittalPointerUp}
                  onPointerLeave={handleSagittalPointerUp}
                >
                  <foreignObject x="0" y="0" width={SAGITTAL_VIEW.w} height={SAGITTAL_VIEW.h}>
                    <Image
                      src={UTERUS_SAGITTAL_SLICE_SRC}
                      alt="Сагиттальный срез матки"
                      width={SAGITTAL_VIEW.w}
                      height={SAGITTAL_VIEW.h}
                      className="h-full w-full object-contain"
                      priority
                    />
                  </foreignObject>
                  <circle cx={INTERNAL_OS.x} cy={INTERNAL_OS.y} r="8" fill="#111827" />
                  <text x={INTERNAL_OS.x + 12} y={INTERNAL_OS.y + 5} fontSize="13" fontWeight="800" fill="#111827">
                    внутр. зев
                  </text>
                  {scarStroke.length > 1 ? (
                    <path d={pathFromStroke(scarStroke, SAGITTAL_VIEW)} fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.78" />
                  ) : null}
                  {draftStroke.length > 1 ? (
                    <path d={pathFromStroke(draftStroke, SAGITTAL_VIEW)} fill="none" stroke="#f59e0b" strokeWidth="6" strokeDasharray="8 5" strokeLinecap="round" />
                  ) : null}
                  <ellipse cx={scarPx.x} cy={scarPx.y} rx="34" ry="17" fill="#ef4444" opacity="0.65" stroke="#7f1d1d" strokeWidth="3" />
                  <text x={scarPx.x} y={scarPx.y - 28} textAnchor="middle" fontSize="14" fontWeight="900" fill="#7f1d1d">
                    рубец / ниша
                  </text>
                  {state.scenario === "early_pregnancy" ? (
                    <>
                      <circle cx={sacPx.x} cy={sacPx.y} r="25" fill="#fef3c7" stroke="#b45309" strokeWidth="4" />
                      <circle cx={sacPx.x} cy={sacPx.y} r="8" fill="#f59e0b" />
                      <text x={sacPx.x} y={sacPx.y - 34} textAnchor="middle" fontSize="14" fontWeight="900" fill="#92400e">
                        плодное яйцо
                      </text>
                      <line x1={sacPx.x} y1={sacPx.y} x2={scarPx.x} y2={scarPx.y} stroke="#92400e" strokeWidth="2" strokeDasharray="6 5" />
                    </>
                  ) : null}
                </svg>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2">
                <svg
                  viewBox={`0 0 ${CORONAL_VIEW.w} ${CORONAL_VIEW.h}`}
                  className="mx-auto aspect-[4/3] w-full cursor-crosshair select-none"
                  role="img"
                  aria-label="Фронтальный срез матки: поперечная локализация рубца"
                  onPointerDown={handleCoronalPointerDown}
                >
                  <foreignObject x="0" y="0" width={CORONAL_VIEW.w} height={CORONAL_VIEW.h}>
                    <Image
                      src={UTERUS_CORONAL_ANATOMY_SRC}
                      alt="Фронтальный срез матки"
                      width={CORONAL_VIEW.w}
                      height={CORONAL_VIEW.h}
                      className="h-full w-full object-contain"
                      priority
                    />
                  </foreignObject>
                  <ellipse cx={coronalScarPx.x} cy={coronalScarPx.y} rx="48" ry="22" fill="#ef4444" opacity="0.62" stroke="#7f1d1d" strokeWidth="4" />
                  <text x={coronalScarPx.x} y={coronalScarPx.y - 34} textAnchor="middle" fontSize="18" fontWeight="900" fill="#7f1d1d">
                    рубец
                  </text>
                </svg>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <aside className="space-y-4">
        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader>
            <CardTitle>Параметры рубца</CardTitle>
            <CardDescription>Ручная коррекция после разметки.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SelectField
              label="Сценарий"
              value={state.scenario}
              options={{ gynecology: "Гинекология: ниша / истмоцеле", early_pregnancy: "Ранняя беременность: CSP" }}
              onChange={(value) => patch({ scenario: value as ScarScenario })}
            />
            <SelectField
              label="Структура"
              value={state.structure}
              options={SCAR_STRUCTURE_LABELS}
              onChange={(value) => patch({ structure: value as ScarStructure })}
            />
            <NumField label="RMT, мм" value={state.residualMyometriumMm} onChange={(v) => patch({ residualMyometriumMm: v })} />
            <NumField label="Глубина ниши, мм" value={state.nicheDepthMm} onChange={(v) => patch({ nicheDepthMm: v })} />
            <div className="grid grid-cols-2 gap-2">
              <NumField label="Длина, мм" value={state.nicheLengthMm} onChange={(v) => patch({ nicheLengthMm: v })} />
              <NumField label="Ширина, мм" value={state.nicheWidthMm} onChange={(v) => patch({ nicheWidthMm: v })} />
            </div>
            <NumField label="От внутреннего зева до рубца, мм" value={state.distanceFromInternalOsMm} onChange={(v) => patch({ distanceFromInternalOsMm: v })} />

            {state.scenario === "early_pregnancy" ? (
              <>
                <SelectField
                  label="Плодное яйцо относительно рубца"
                  value={state.scarPregnancyRelation}
                  options={SCAR_PREGNANCY_RELATION_LABELS}
                  onChange={(value) => patch({ scarPregnancyRelation: value as ScarPregnancyRelation })}
                />
                <NumField label="Плодное яйцо до рубца, мм" value={state.gestationalSacDistanceToScarMm} onChange={(v) => patch({ gestationalSacDistanceToScarMm: v })} />
                <NumField label="Плодное яйцо до внутреннего зева, мм" value={state.gestationalSacDistanceToInternalOsMm} onChange={(v) => patch({ gestationalSacDistanceToInternalOsMm: v })} />
                <NumField label="Миометрий к серозе/мочевому пузырю, мм" value={state.bladderSerosaDistanceMm} onChange={(v) => patch({ bladderSerosaDistanceMm: v })} />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={state.vascularityAroundSac}
                    onChange={(event) => patch({ vascularityAroundSac: event.target.checked })}
                  />
                  Васкуляризация вокруг плодного яйца в зоне рубца
                </label>
              </>
            ) : null}

            <Textarea
              value={state.notes}
              onChange={(event) => patch({ notes: event.target.value })}
              placeholder="Комментарий: ТВУЗИ, ЦДК, связь с полостью, симптомы..."
              rows={3}
            />
          </CardContent>
        </Card>

        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader>
            <CardTitle>Интерпретация</CardTitle>
            <CardDescription>Подсказка, не диагноз.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="rounded-xl bg-[var(--clinical-muted)] p-3">{scarRiskHint(state)}</p>
            <p className="rounded-xl bg-[var(--clinical-muted)] p-3">{scarPregnancyHint(state)}</p>
          </CardContent>
        </Card>

        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader>
            <CardTitle>Текст в протокол</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--clinical-muted)] p-3 font-sans text-sm leading-relaxed">
              {protocolText}
            </pre>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" className="flex-1" onClick={copyProtocol}>
                <Copy className="mr-2 h-4 w-4" />
                Скопировать
              </Button>
              {onApply ? (
                <Button type="button" variant="secondary" className="flex-1" onClick={applyToProtocol}>
                  В протокол
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-sm">
      {label}
      <Input
        className="mt-1"
        inputMode="decimal"
        value={value}
        onChange={(event) => {
          const next = Number.parseFloat(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 text-sm"
      >
        {Object.entries(options).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
