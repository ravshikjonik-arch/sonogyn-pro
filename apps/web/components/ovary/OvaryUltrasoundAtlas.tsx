"use client";

import {
  buildOvaryProtocolBlock,
  centroidOfStroke,
  formatOvaryMarkerRu,
  OVARY_MARKER_LABELS_RU,
  OVARY_MORPHOLOGY_LABELS_RU,
  ovaryStrokeToSvgPath,
  type OvaryMarkerKind,
  type OvaryMorphologyPreset,
  type OvaryNormPoint,
  type OvarySide,
  type OvaryTopographyMarker,
} from "@repo/clinical-3d";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { cn } from "@/lib/utils/cn";

const VIEW_W = 280;
const VIEW_H = 200;

const KINDS: OvaryMarkerKind[] = [
  "follicle",
  "dominant_follicle",
  "cyst_functional",
  "cyst_hemorrhagic",
  "cyst_dermoid",
  "cyst_endometrioma",
  "solid_component",
  "other",
];

type Tool = "place" | "draw";

function normFromEvent(clientX: number, clientY: number, rect: DOMRect): OvaryNormPoint {
  return {
    x: Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width)),
    y: Math.max(0.05, Math.min(0.95, (clientY - rect.top) / rect.height)),
  };
}

function markerColor(kind: OvaryMarkerKind): string {
  switch (kind) {
    case "follicle":
      return "#FBBF24";
    case "dominant_follicle":
      return "#F59E0B";
    case "cyst_functional":
      return "#38BDF8";
    case "cyst_hemorrhagic":
      return "#EF4444";
    case "cyst_dermoid":
      return "#10B981";
    case "cyst_endometrioma":
      return "#8B5CF6";
    case "solid_component":
      return "#64748B";
    default:
      return "#94A3B8";
  }
}

function OvaryDiagram({
  side,
  markers,
  draftStroke,
  tool,
  selectedId,
  morphology,
  hostRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  side: OvarySide;
  markers: OvaryTopographyMarker[];
  draftStroke: OvaryNormPoint[];
  tool: Tool;
  selectedId: string | null;
  morphology: OvaryMorphologyPreset;
  hostRef: RefObject<HTMLDivElement | null>;
  onPointerDown: (e: React.PointerEvent, side: OvarySide) => void;
  onPointerMove: (e: React.PointerEvent, side: OvarySide) => void;
  onPointerUp: (e: React.PointerEvent, side: OvarySide) => void;
}) {
  const sideMarkers = markers.filter((m) => m.side === side);
  const enlarged = morphology !== "normal";

  return (
    <div className="space-y-2">
      <p className="text-center text-xs font-bold uppercase tracking-wide text-violet-900 dark:text-violet-200">
        {side === "right" ? "Правый яичник" : "Левый яичник"}
      </p>
      <div
        ref={hostRef}
        className={cn(
          "relative mx-auto touch-none select-none rounded-2xl border-2 border-violet-200 bg-violet-50/90 shadow-inner dark:border-violet-900 dark:bg-violet-950/40",
          "cursor-crosshair",
        )}
        style={{ width: VIEW_W, height: VIEW_H, touchAction: "none" }}
        onPointerDown={(e) => onPointerDown(e, side)}
        onPointerMove={(e) => onPointerMove(e, side)}
        onPointerUp={(e) => onPointerUp(e, side)}
        onPointerCancel={(e) => onPointerUp(e, side)}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          aria-hidden
        >
          <ellipse
            cx={VIEW_W / 2}
            cy={VIEW_H / 2}
            rx={enlarged ? 118 : 95}
            ry={enlarged ? 88 : 72}
            fill="#F5F3FF"
            stroke="#7C3AED"
            strokeWidth="2.5"
          />
          <ellipse cx={VIEW_W / 2} cy={VIEW_H / 2} rx={42} ry={32} fill="#EDE9FE" stroke="#A78BFA" strokeWidth="1.5" opacity={0.9} />
          <text x={VIEW_W / 2} y={18} textAnchor="middle" fontSize="10" fontWeight="700" fill="#5B21B6">
            строма
          </text>
          {enlarged
            ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
                const cx = VIEW_W / 2 + Math.cos(a) * 92;
                const cy = VIEW_H / 2 + Math.sin(a) * 68;
                return (
                  <circle key={i} cx={cx} cy={cy} r={5} fill="#DDD6FE" stroke="#8B5CF6" strokeWidth="1" opacity={0.55} />
                );
              })
            : null}

          {sideMarkers.map((m) => {
            const cx = m.point.x * VIEW_W;
            const cy = m.point.y * VIEW_H;
            const active = m.id === selectedId;
            const r = m.kind.startsWith("cyst_") ? (active ? 16 : 13) : active ? 9 : 7;
            return (
              <g key={m.id}>
                {m.stroke && m.stroke.length > 1 ? (
                  <path
                    d={ovaryStrokeToSvgPath(m.stroke, VIEW_W, VIEW_H)}
                    fill="none"
                    stroke={markerColor(m.kind)}
                    strokeWidth={active ? 3 : 2}
                  />
                ) : null}
                <circle cx={cx} cy={cy} r={r} fill={markerColor(m.kind)} stroke="#4C1D95" strokeWidth={active ? 2.5 : 1.5} opacity={0.95} />
              </g>
            );
          })}
          {draftStroke.length > 1 ? (
            <path
              d={ovaryStrokeToSvgPath(draftStroke, VIEW_W, VIEW_H)}
              fill="none"
              stroke="#EA580C"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          ) : null}
        </svg>
      </div>
    </div>
  );
}

type Props = {
  morphology: OvaryMorphologyPreset;
  onMorphologyChange: (m: OvaryMorphologyPreset) => void;
  markers: OvaryTopographyMarker[];
  onMarkersChange: (markers: OvaryTopographyMarker[]) => void;
  onProtocolTextChange?: (text: string) => void;
};

export function OvaryUltrasoundAtlas({
  morphology,
  onMorphologyChange,
  markers,
  onMarkersChange,
  onProtocolTextChange,
}: Props) {
  const [kind, setKind] = useState<OvaryMarkerKind>("follicle");
  const [sizeMm, setSizeMm] = useState("8");
  const [tool, setTool] = useState<Tool>("place");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStroke, setDraftStroke] = useState<OvaryNormPoint[]>([]);
  const [draftSide, setDraftSide] = useState<OvarySide>("right");
  const drawing = useRef(false);
  const activeSide = useRef<OvarySide>("right");
  const hostRightRef = useRef<HTMLDivElement>(null);
  const hostLeftRef = useRef<HTMLDivElement>(null);

  const hostForSide = useCallback(
    (side: OvarySide): RefObject<HTMLDivElement | null> => (side === "right" ? hostRightRef : hostLeftRef),
    [],
  );

  const selected = markers.find((m) => m.id === selectedId) ?? markers[markers.length - 1];
  const protocolText = useMemo(() => buildOvaryProtocolBlock(markers, morphology), [markers, morphology]);
  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: "ovary-topography-protocol",
        title: "Локализация · яичники",
        text: protocolText,
      }),
    [protocolText],
  );

  useEffect(() => {
    onProtocolTextChange?.(protocolText);
  }, [protocolText, onProtocolTextChange]);

  const addMarker = useCallback(
    (side: OvarySide, point: OvaryNormPoint, stroke?: OvaryNormPoint[]) => {
      const id = `ov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const mm = Number(sizeMm);
      onMarkersChange([
        ...markers,
        {
          id,
          side,
          point,
          kind,
          sizeMm: Number.isFinite(mm) && mm > 0 ? mm : undefined,
          stroke,
        },
      ]);
      setSelectedId(id);
    },
    [kind, sizeMm, markers, onMarkersChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, side: OvarySide) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const host = hostForSide(side).current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const pt = normFromEvent(e.clientX, e.clientY, rect);
      activeSide.current = side;

      if (tool === "draw") {
        drawing.current = true;
        setDraftSide(side);
        setDraftStroke([pt]);
        host.setPointerCapture(e.pointerId);
        return;
      }

      const hit = markers.find((m) => {
        if (m.side !== side) return false;
        const dx = (m.point.x - pt.x) * VIEW_W;
        const dy = (m.point.y - pt.y) * VIEW_H;
        return Math.hypot(dx, dy) < 20;
      });
      if (hit) {
        setSelectedId(hit.id);
        return;
      }
      addMarker(side, pt);
    },
    [tool, markers, addMarker, hostForSide],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent, side: OvarySide) => {
      if (!drawing.current || tool !== "draw") return;
      const host = hostForSide(side).current ?? hostForSide(activeSide.current).current;
      if (!host) return;
      e.preventDefault();
      const pt = normFromEvent(e.clientX, e.clientY, host.getBoundingClientRect());
      setDraftSide(side);
      setDraftStroke((prev) => {
        const last = prev[prev.length - 1];
        if (last && Math.hypot(last.x - pt.x, last.y - pt.y) < 0.008) return prev;
        return [...prev, pt];
      });
    },
    [tool, hostForSide],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent, side: OvarySide) => {
      const host = hostForSide(side).current;
      if (host?.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);
      if (!drawing.current || tool !== "draw") return;
      drawing.current = false;
      const stroke = draftStroke;
      const strokeSide = draftSide;
      setDraftStroke([]);
      if (stroke.length >= 3) addMarker(strokeSide, centroidOfStroke(stroke), stroke);
      else if (stroke.length >= 1) addMarker(strokeSide, stroke[0]);
    },
    [tool, draftStroke, draftSide, addMarker, hostForSide],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(OVARY_MORPHOLOGY_LABELS_RU) as OvaryMorphologyPreset[]).map((m) => (
          <Button
            key={m}
            size="sm"
            variant={morphology === m ? "default" : "outline"}
            onClick={() => onMorphologyChange(m)}
          >
            {OVARY_MORPHOLOGY_LABELS_RU[m]}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <Button key={k} size="sm" variant={kind === k ? "default" : "secondary"} onClick={() => setKind(k)}>
            {OVARY_MARKER_LABELS_RU[k]}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-bold">Размер, мм</label>
          <Input className="mt-1 w-24" inputMode="decimal" value={sizeMm} onChange={(e) => setSizeMm(e.target.value)} />
        </div>
        <Button variant={tool === "place" ? "default" : "outline"} size="sm" onClick={() => setTool("place")}>
          Курсор · очаг
        </Button>
        <Button variant={tool === "draw" ? "default" : "outline"} size="sm" onClick={() => setTool("draw")}>
          Контур кисты
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => selectedId && onMarkersChange(markers.filter((m) => m.id !== selectedId))}
          disabled={!selectedId}
        >
          Удалить
        </Button>
        <Button variant="outline" size="sm" onClick={() => onMarkersChange([])}>
          Очистить
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Увеличенный яичник: отметьте фолликулы по периферии (2–9 мм) или кисту. Клик — точка; контур — обводка с центром.
        Для мультифолликулярного/СПКЯ — несколько фолликулов + AFC в блоке ИИ.
      </p>

      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
        <OvaryDiagram
          side="right"
          markers={markers}
          draftStroke={draftSide === "right" ? draftStroke : []}
          tool={tool}
          selectedId={selectedId}
          morphology={morphology}
          hostRef={hostRightRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        <OvaryDiagram
          side="left"
          markers={markers}
          draftStroke={draftSide === "left" ? draftStroke : []}
          tool={tool}
          selectedId={selectedId}
          morphology={morphology}
          hostRef={hostLeftRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>

      {selected ? (
        <div className="sonogyn-glass-card rounded-2xl p-4">
          <p className="text-sm font-bold text-violet-950">Выбранный очаг</p>
          <p className="mt-2 text-sm leading-relaxed">{formatOvaryMarkerRu(selected)}</p>
        </div>
      ) : null}

      <div className="sonogyn-glass-card space-y-3 rounded-2xl p-4">
        <p className="text-sm font-bold">Текст для протокола</p>
        <pre className="whitespace-pre-wrap rounded-xl bg-slate-900/5 p-4 text-sm leading-relaxed dark:bg-white/5">{protocolText}</pre>
        <DocumentExportToolbar spec={exportSpec} compact />
      </div>
    </div>
  );
}

export function applyAiMarkersToOvary(
  markers: OvaryTopographyMarker[],
  side: OvarySide,
  kinds: OvaryMarkerKind[],
): OvaryTopographyMarker[] {
  const baseAngle = side === "right" ? 0 : Math.PI;
  const newMarkers: OvaryTopographyMarker[] = kinds.map((k, i) => {
    const a = baseAngle + (i / kinds.length) * Math.PI * 1.2 + 0.3;
    return {
      id: `ov-ai-${Date.now()}-${i}`,
      side,
      point: { x: 0.5 + Math.cos(a) * 0.32, y: 0.5 + Math.sin(a) * 0.28 },
      kind: k,
      sizeMm: k === "follicle" ? 6 : 18,
    };
  });
  return [...markers, ...newMarkers];
}
