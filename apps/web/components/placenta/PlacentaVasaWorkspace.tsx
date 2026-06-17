"use client";

import { useMemo, useState } from "react";
import { Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  buildPlacentaVasaProtocolBlock,
  classifyPlacentalEdge,
  classifyVasaPreviaRisk,
  CORD_INSERTION_LABELS,
  DEFAULT_PLACENTA_VASA_STATE,
  PLACENTA_LOCATION_LABELS,
  VASA_RELATION_LABELS,
  type CordInsertion,
  type PlacentaLocation,
  type PlacentaVasaState,
  type VasaRelation,
} from "@/lib/placenta/placenta-vasa";

type Tool = "placenta_edge" | "vessel";

type Props = {
  compact?: boolean;
  onApply?: (protocolText: string) => void;
};

const VIEW_W = 360;
const VIEW_H = 520;
const OS = { x: 180, y: 430 };
const MM_PER_PX = 0.55;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function edgeYFromDistance(distanceMm: number) {
  return OS.y - clamp(distanceMm / MM_PER_PX, -45, 210);
}

function distanceFromY(y: number) {
  return Math.round((OS.y - y) * MM_PER_PX);
}

function vesselYFromDistance(distanceMm: number) {
  return OS.y - clamp(distanceMm / MM_PER_PX, -20, 220);
}

export function PlacentaVasaWorkspace({ compact, onApply }: Props) {
  const [state, setState] = useState<PlacentaVasaState>(DEFAULT_PLACENTA_VASA_STATE);
  const [tool, setTool] = useState<Tool>("placenta_edge");
  const protocolText = useMemo(() => buildPlacentaVasaProtocolBlock(state), [state]);
  const edgeY = edgeYFromDistance(state.placentaCoversInternalOs ? -10 : state.placentalEdgeDistanceMm);
  const vesselY = vesselYFromDistance(state.vesselDistanceToInternalOsMm);

  function patch(update: Partial<PlacentaVasaState>) {
    setState((current) => ({ ...current, ...update }));
  }

  function handleDiagramClick(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const y = ((event.clientY - rect.top) / rect.height) * VIEW_H;
    if (tool === "placenta_edge") {
      const distance = distanceFromY(y);
      patch({
        placentalEdgeDistanceMm: distance,
        placentaCoversInternalOs: distance < 0,
      });
      return;
    }
    const distance = Math.max(0, distanceFromY(y));
    patch({
      vesselDistanceToInternalOsMm: distance,
      fetalVesselsNearInternalOs: distance < 20,
      vasaRelation: distance < 5 ? "over_os" : distance < 20 ? "near_os" : state.vasaRelation,
    });
  }

  async function copyProtocol() {
    await navigator.clipboard.writeText(protocolText);
    toast.success("Текст по плаценте скопирован");
  }

  function applyToProtocol() {
    onApply?.(protocolText);
    toast.success("Блок плаценты добавлен в протокол");
  }

  return (
    <div className={compact ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]" : "grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"}>
      <main className="space-y-4">
        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-rose-700">Плацента</Badge>
              <Badge variant="outline">internal os</Badge>
              <Badge variant="outline">vasa previa</Badge>
            </div>
            <CardTitle>Плацента / предлежание / vasa previa</CardTitle>
            <CardDescription>
              Нажмите на схему, чтобы поставить нижний край плаценты или сосуды относительно внутреннего зева.
              Расстояние можно поправить вручную.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={tool === "placenta_edge" ? "default" : "outline"} onClick={() => setTool("placenta_edge")}>
                Край плаценты
              </Button>
              <Button type="button" size="sm" variant={tool === "vessel" ? "default" : "outline"} onClick={() => setTool("vessel")}>
                Сосуды
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setState(DEFAULT_PLACENTA_VASA_STATE)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Сброс
              </Button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-3">
              <svg
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                className="mx-auto h-[520px] max-h-[70vh] w-full max-w-[420px] cursor-crosshair select-none"
                role="img"
                aria-label="Схема плаценты и внутреннего зева"
                onPointerDown={handleDiagramClick}
              >
                <defs>
                  <linearGradient id="placentaGradient" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#be123c" />
                  </linearGradient>
                </defs>
                <path
                  d="M90 55 C45 125 50 305 103 418 C126 468 234 468 257 418 C310 305 315 125 270 55 C233 28 127 28 90 55 Z"
                  fill="#fff7ed"
                  stroke="#c2410c"
                  strokeWidth="4"
                />
                <path
                  d="M158 110 C145 190 148 310 164 400 C171 423 189 423 196 400 C212 310 215 190 202 110"
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="10"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                <path d="M160 430 C172 420 188 420 200 430 C190 445 170 445 160 430 Z" fill="#7f1d1d" opacity="0.9" />
                <circle cx={OS.x} cy={OS.y} r="7" fill="#111827" />
                <text x={OS.x + 16} y={OS.y + 5} fontSize="13" fontWeight="800" fill="#111827">
                  внутр. зев
                </text>

                <path
                  d={`M82 ${edgeY - 88} C118 ${edgeY - 120} 240 ${edgeY - 120} 278 ${edgeY - 82} L278 ${edgeY} C225 ${edgeY + 24} 132 ${edgeY + 24} 82 ${edgeY} Z`}
                  fill="url(#placentaGradient)"
                  opacity="0.9"
                  stroke="#881337"
                  strokeWidth="3"
                />
                <line x1="70" x2="290" y1={edgeY} y2={edgeY} stroke="#881337" strokeDasharray="6 5" strokeWidth="2" />
                <text x="74" y={edgeY - 8} fontSize="13" fontWeight="800" fill="#881337">
                  край плаценты
                </text>

                <path
                  d={`M88 ${vesselY + 18} C130 ${vesselY - 22} 226 ${vesselY + 48} 285 ${vesselY - 8}`}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <circle cx="88" cy={vesselY + 18} r="6" fill="#1d4ed8" />
                <circle cx="285" cy={vesselY - 8} r="6" fill="#1d4ed8" />
                <text x="235" y={vesselY - 20} fontSize="13" fontWeight="800" fill="#1d4ed8">
                  сосуды
                </text>

                <line x1="318" x2="318" y1={Math.min(edgeY, OS.y)} y2={Math.max(edgeY, OS.y)} stroke="#111827" strokeWidth="2" />
                <line x1="308" x2="328" y1={edgeY} y2={edgeY} stroke="#111827" strokeWidth="2" />
                <line x1="308" x2="328" y1={OS.y} y2={OS.y} stroke="#111827" strokeWidth="2" />
                <text x="242" y={(edgeY + OS.y) / 2} fontSize="13" fontWeight="800" fill="#111827">
                  {state.placentaCoversInternalOs ? "перекрывает" : `${Math.round(state.placentalEdgeDistanceMm)} мм`}
                </text>
              </svg>
            </div>
          </CardContent>
        </Card>
      </main>

      <aside className="space-y-4">
        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader>
            <CardTitle>Параметры</CardTitle>
            <CardDescription>Ручная коррекция после постановки маркеров.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SelectField
              label="Локализация плаценты"
              value={state.placentaLocation}
              options={PLACENTA_LOCATION_LABELS}
              onChange={(value) => patch({ placentaLocation: value as PlacentaLocation })}
            />
            <label className="block text-sm">
              Расстояние от нижнего края до внутреннего зева, мм
              <Input
                className="mt-1"
                inputMode="decimal"
                value={state.placentalEdgeDistanceMm}
                onChange={(event) => {
                  const value = Number.parseFloat(event.target.value);
                  if (Number.isFinite(value)) patch({ placentalEdgeDistanceMm: value, placentaCoversInternalOs: value < 0 });
                }}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={state.placentaCoversInternalOs}
                onChange={(event) => patch({ placentaCoversInternalOs: event.target.checked })}
              />
              Плацента перекрывает внутренний зев
            </label>
            <SelectField
              label="Прикрепление пуповины"
              value={state.cordInsertion}
              options={CORD_INSERTION_LABELS}
              onChange={(value) => patch({ cordInsertion: value as CordInsertion })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={state.accessoryPlacentalLobe}
                onChange={(event) => patch({ accessoryPlacentalLobe: event.target.checked })}
              />
              Добавочная доля / сосуды между долями
            </label>
            <SelectField
              label="Vasa previa"
              value={state.vasaRelation}
              options={VASA_RELATION_LABELS}
              onChange={(value) => patch({ vasaRelation: value as VasaRelation })}
            />
            <label className="block text-sm">
              Расстояние сосудов до внутреннего зева, мм
              <Input
                className="mt-1"
                inputMode="decimal"
                value={state.vesselDistanceToInternalOsMm}
                onChange={(event) => {
                  const value = Number.parseFloat(event.target.value);
                  if (Number.isFinite(value)) {
                    patch({
                      vesselDistanceToInternalOsMm: value,
                      fetalVesselsNearInternalOs: value < 20,
                      vasaRelation: value < 5 ? "over_os" : value < 20 ? "near_os" : state.vasaRelation,
                    });
                  }
                }}
              />
            </label>
            <Textarea
              value={state.notes}
              onChange={(event) => patch({ notes: event.target.value })}
              placeholder="Комментарий: ЦДК, ТВУЗИ, визуализация прикрепления пуповины..."
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
            <p className="rounded-xl bg-[var(--clinical-muted)] p-3">{classifyPlacentalEdge(state)}</p>
            <p className="rounded-xl bg-[var(--clinical-muted)] p-3">{classifyVasaPreviaRisk(state)}</p>
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
