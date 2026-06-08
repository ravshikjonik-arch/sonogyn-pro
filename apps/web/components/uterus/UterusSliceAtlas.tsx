"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import {
  PATHOLOGY_LABELS_RU,
  UTERUS_SAGITTAL_SLICE_SRC,
  analyzeSliceHit,
  annotationFromStroke,
  enrichAnnotation,
  isValidStroke,
  simplifyStroke,
  strokeFromAnnotation,
  strokeToSvgPath,
  type PathologyAnnotation,
  type PathologyType,
  type SliceEditorTool,
  type SliceNorm,
} from "@clinical/uterus";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const MARKER_COLORS: Record<PathologyType, string> = {
  myoma: "#a855f7",
  adenomyosis: "#e11d48",
  polyp: "#0d9488",
  scar: "#475569",
  other: "#2563eb",
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

type Props = {
  annotations: PathologyAnnotation[];
  selectedId: string | null;
  placeMode: PathologyType;
  pedunculated: boolean;
  onSelect: (id: string | null) => void;
  onAddLesion: (annotation: PathologyAnnotation) => void;
  className?: string;
};

function normFromClient(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  zoom: number,
  panX: number,
  panY: number,
): SliceNorm {
  const localX = (clientX - rect.left - panX) / zoom;
  const localY = (clientY - rect.top - panY) / zoom;
  return [localX / rect.width, localY / rect.height];
}

function touchDistance(t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }): number {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}

export function UterusSliceAtlas({
  annotations,
  selectedId,
  placeMode,
  pedunculated,
  onSelect,
  onAddLesion,
  className,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<SliceEditorTool>("navigate");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 800, h: 500 });

  const dragging = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const strokeRef = useRef<SliceNorm[]>([]);
  const [draftStroke, setDraftStroke] = useState<SliceNorm[]>([]);
  const [hoverHit, setHoverHit] = useState<string | null>(null);

  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const finishStroke = useCallback(() => {
    const pts = simplifyStroke(strokeRef.current);
    strokeRef.current = [];
    setDraftStroke([]);
    if (!isValidStroke(pts)) return;
    const ann = annotationFromStroke(placeMode, pts, {
      pedunculated: placeMode === "myoma" ? pedunculated : false,
    });
    if (!ann) return;
    onAddLesion(enrichAnnotation(ann, pedunculated));
  }, [placeMode, pedunculated, onAddLesion]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const el = hostRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });

      if (tool === "navigate") {
        dragging.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      if (tool === "draw") {
        dragging.current = true;
        strokeRef.current = [normFromClient(e.clientX, e.clientY, rect, zoom, pan.x, pan.y)];
        setDraftStroke([...strokeRef.current]);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
    },
    [tool, zoom, pan],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const el = hostRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });

      if (tool === "navigate" && dragging.current) {
        setPan({
          x: panStart.current.panX + (e.clientX - panStart.current.x),
          y: panStart.current.panY + (e.clientY - panStart.current.y),
        });
        return;
      }

      if (tool === "draw" && dragging.current) {
        const n = normFromClient(e.clientX, e.clientY, rect, zoom, pan.x, pan.y);
        const last = strokeRef.current[strokeRef.current.length - 1];
        if (!last || Math.hypot(n[0] - last[0], n[1] - last[1]) > 0.003) {
          strokeRef.current.push(n);
          setDraftStroke([...strokeRef.current]);
        }
        return;
      }

      const norm = normFromClient(e.clientX, e.clientY, rect, zoom, pan.x, pan.y);
      if (norm[0] >= 0 && norm[0] <= 1 && norm[1] >= 0 && norm[1] <= 1) {
        setHoverHit(analyzeSliceHit(norm[0], norm[1], pedunculated).tooltipRu);
      }
    },
    [tool, zoom, pan, pedunculated],
  );

  const handlePointerUp = useCallback(() => {
    if (tool === "draw" && dragging.current) {
      finishStroke();
    }
    dragging.current = false;
  }, [tool, finishStroke]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.ctrlKey || e.metaKey ? e.deltaY * 0.004 : e.deltaY * 0.0015;
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - delta)));
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = { dist: touchDistance(e.touches[0], e.touches[1]), zoom };
      }
    },
    [zoom],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dist = touchDistance(e.touches[0], e.touches[1]);
      const ratio = dist / pinchRef.current.dist;
      setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchRef.current.zoom * ratio)));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pinchRef.current) pinchRef.current = null;
  }, []);

  return (
    <div className={cn("relative w-full space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={tool === "navigate" ? "default" : "secondary"}
          onClick={() => setTool("navigate")}
        >
          Рука · сдвиг
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tool === "draw" ? "default" : "secondary"}
          onClick={() => setTool("draw")}
        >
          Кисть · рисовать
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={resetView}>
          Сброс вида
        </Button>
        <span className="text-[11px] text-slate-500">
          {Math.round(zoom * 100)}% · колёсико / pinch — масштаб
        </span>
      </div>

      <div
        ref={hostRef}
        role="presentation"
        className={cn(
          "relative aspect-[16/10] w-full touch-none overflow-hidden rounded-2xl bg-white shadow-inner ring-1 ring-slate-200/90 dark:ring-slate-700",
          tool === "draw" ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing",
        )}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="absolute inset-0 origin-top-left"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <div className="relative h-full w-full">
            <Image
              src={UTERUS_SAGITTAL_SLICE_SRC}
              alt="Сагиттальный срез матки с шейкой"
              fill
              sizes="(max-width: 1200px) 100vw"
              className="pointer-events-none object-contain object-center select-none"
              priority
              draggable={false}
            />
            <svg
              className="absolute inset-0 z-10 h-full w-full"
              viewBox={`0 0 ${size.w} ${size.h}`}
              preserveAspectRatio="none"
            >
              {annotations.map((raw) => {
                const a = enrichAnnotation(raw);
                const stroke = strokeFromAnnotation(a);
                if (!stroke) return null;
                const selected = a.id === selectedId;
                const col = MARKER_COLORS[a.type];
                const path = strokeToSvgPath(stroke.points, size.w, size.h, true);
                const b = stroke.points.reduce(
                  (acc, p) => ({
                    cx: acc.cx + p[0] / stroke.points.length,
                    cy: acc.cy + p[1] / stroke.points.length,
                  }),
                  { cx: 0, cy: 0 },
                );
                return (
                  <g
                    key={a.id}
                    className="pointer-events-auto cursor-pointer"
                    onPointerDown={(ev) => {
                      if (tool === "navigate") {
                        ev.stopPropagation();
                        onSelect(a.id);
                      }
                    }}
                  >
                    <path
                      d={path}
                      fill={col}
                      fillOpacity={selected ? 0.45 : 0.3}
                      stroke={selected ? "#fbbf24" : "#fff"}
                      strokeWidth={selected ? 3 : 2}
                      strokeLinejoin="round"
                    />
                    {a.type === "myoma" && (a.figoType ?? a.figoOverride) != null ? (
                      <text
                        x={b.cx * size.w}
                        y={b.cy * size.h}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#fff"
                        fontSize={12}
                        fontWeight={700}
                        style={{ pointerEvents: "none" }}
                      >
                        FIGO {a.figoOverride ?? a.figoType}
                      </text>
                    ) : null}
                  </g>
                );
              })}

              {draftStroke.length > 1 ? (
                <path
                  d={strokeToSvgPath(draftStroke, size.w, size.h, false)}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </svg>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] leading-snug text-slate-500 dark:text-slate-400">
        {tool === "draw"
          ? `Обведите ${PATHOLOGY_LABELS_RU[placeMode].toLowerCase()} пальцем или мышью`
          : hoverHit ?? "Перетащите схему · pinch/колёсико — приближение · дно слева, шейка справа"}
      </p>
    </div>
  );
}

export function addAnnotationAtSlice(
  norm: [number, number],
  type: PathologyType,
  patch?: Partial<PathologyAnnotation>,
): PathologyAnnotation {
  const r = 0.02;
  const pts: SliceNorm[] = [
    [norm[0] - r, norm[1]],
    [norm[0], norm[1] - r * 0.6],
    [norm[0] + r, norm[1]],
    [norm[0], norm[1] + r * 0.6],
    [norm[0] - r, norm[1]],
  ];
  const ann = annotationFromStroke(type, pts, patch);
  return enrichAnnotation(ann ?? { id: "x", type, position: [0, 0, 0], sizeMm: { length: 10, width: 10, depth: 8 } });
}
