"use client";

/**
 * Реалистичные фото-макеты матки (наши clinical refs) + клик врача → FIGO.
 * Масштаб: кнопки +/−, колёсико, pinch; сдвиг рукой.
 */

import Image from "next/image";
import {
  useCallback,
  useRef,
  useState,
  useMemo,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

import {
  buildUterusProtocolBlock,
  coronalToSagittal,
  FIGO_SUBTYPE_RU,
  formatUterusLesionMarkerRu,
  getFigoColor,
  hitUterusLayer,
  LAYER_LABEL_RU,
  resolveFigoForMarker,
  sagittalToCoronal,
  type UterusLesionKind,
  type UterusLesionMarker,
  type UterusNormPoint,
  type UterusProjection,
} from "@repo/clinical-3d";

import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

/** Наши фото-рендеры из public/clinical */
export const UTERUS_LIVE_PHOTO_SRC: Record<UterusProjection, string> = {
  coronal: "/clinical/uterus-ref-coronal.jpg",
  sagittal: "/clinical/uterus-ref-sagittal.jpg",
};

const KINDS: { id: UterusLesionKind; label: string }[] = [
  { id: "myoma", label: "Миома" },
  { id: "adenomyosis", label: "Аденомиоз" },
  { id: "polyp", label: "Полип" },
];

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

type Tool = "place" | "pan";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function normFromClient(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  zoom: number,
  panX: number,
  panY: number,
): UterusNormPoint {
  const localX = (clientX - rect.left - panX) / zoom;
  const localY = (clientY - rect.top - panY) / zoom;
  return {
    x: clamp(localX / rect.width, 0.02, 0.98),
    y: clamp(localY / rect.height, 0.02, 0.98),
  };
}

function touchDistance(t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }) {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}

export type UterusLiveAnatomyPanelProps = {
  projection: UterusProjection;
  markers: UterusLesionMarker[];
  onMarkersChange: (markers: UterusLesionMarker[]) => void;
};

export function UterusLiveAnatomyPanel({
  projection,
  markers,
  onMarkersChange,
}: UterusLiveAnatomyPanelProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [kind, setKind] = useState<UterusLesionKind>("myoma");
  const [diameterMm, setDiameterMm] = useState(32);
  const [pedunculated, setPedunculated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("place");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const dragging = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const selected = markers.find((m) => m.id === selectedId) ?? markers[markers.length - 1];
  const protocolText = useMemo(() => buildUterusProtocolBlock(markers, projection), [markers, projection]);
  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: `uterus-photo-${projection}-protocol`,
        title: `Локализация · фото-макет матки (${projection === "sagittal" ? "сагиттально" : "коронар"})`,
        text: protocolText,
      }),
    [protocolText, projection],
  );

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((delta: number) => {
    setZoom((z) => clamp(z + delta, MIN_ZOOM, MAX_ZOOM));
  }, []);

  const placeAt = useCallback(
    (pt: UterusNormPoint) => {
      const near = markers.find((m) => {
        const mp = projection === "sagittal" ? m.sagittal : m.coronal;
        const dx = (mp.x - pt.x) * 1000;
        const dy = (mp.y - pt.y) * 750;
        return Math.hypot(dx, dy) < 28;
      });
      if (near) {
        setSelectedId(near.id);
        return;
      }

      const coronal = projection === "coronal" ? pt : sagittalToCoronal(pt);
      const sagittal = projection === "sagittal" ? pt : coronalToSagittal(pt);
      const id = `ut-photo-${Date.now()}`;
      onMarkersChange([
        ...markers,
        {
          id,
          kind,
          diameterMm,
          pedunculated: kind === "myoma" ? pedunculated : false,
          coronal,
          sagittal,
        },
      ]);
      setSelectedId(id);
    },
    [markers, projection, kind, diameterMm, pedunculated, onMarkersChange],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const el = hostRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      if (tool === "pan" || e.shiftKey) {
        dragging.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }

      const pt = normFromClient(e.clientX, e.clientY, rect, zoom, pan.x, pan.y);
      placeAt(pt);
    },
    [tool, pan, zoom, placeAt],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
    },
    [],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const onWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.ctrlKey || e.metaKey ? e.deltaY * 0.004 : e.deltaY * 0.0015;
    setZoom((z) => clamp(z - delta, MIN_ZOOM, MAX_ZOOM));
  }, []);

  const onTouchStart = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2) {
        pinchRef.current = { dist: touchDistance(e.touches[0]!, e.touches[1]!), zoom };
      }
    },
    [zoom],
  );

  const onTouchMove = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dist = touchDistance(e.touches[0]!, e.touches[1]!);
      const ratio = dist / pinchRef.current.dist;
      setZoom(clamp(pinchRef.current.zoom * ratio, MIN_ZOOM, MAX_ZOOM));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    pinchRef.current = null;
  }, []);

  const selectedFigo =
    selected && selected.kind === "myoma" ? resolveFigoForMarker(selected, projection) : null;
  const selectedHit =
    selected != null
      ? hitUterusLayer(
          projection === "sagittal" ? selected.sagittal : selected.coronal,
          projection,
          selected.diameterMm,
          selected.pedunculated,
        )
      : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <Button key={k.id} size="sm" variant={kind === k.id ? "default" : "outline"} onClick={() => setKind(k.id)}>
            {k.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            onMarkersChange([]);
            setSelectedId(null);
          }}
        >
          Очистить
        </Button>
      </div>

      {kind === "myoma" ? (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--clinical-foreground-muted)]">Диаметр, мм</span>
            <Input
              type="number"
              className="w-20"
              value={diameterMm}
              onChange={(e) => setDiameterMm(Number(e.target.value) || 0)}
            />
          </label>
          <Button size="sm" variant={pedunculated ? "default" : "outline"} onClick={() => setPedunculated((v) => !v)}>
            На ножке
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={tool === "place" ? "default" : "outline"} onClick={() => setTool("place")}>
          Курсор · очаг
        </Button>
        <Button size="sm" variant={tool === "pan" ? "default" : "outline"} onClick={() => setTool("pan")}>
          Рука · сдвиг
        </Button>
        <Button
          size="sm"
          variant="outline"
          aria-label="Уменьшить"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => zoomBy(-ZOOM_STEP)}
        >
          −
        </Button>
        <Button
          size="sm"
          variant="outline"
          aria-label="Увеличить"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => zoomBy(ZOOM_STEP)}
        >
          +
        </Button>
        <Button size="sm" variant="ghost" onClick={resetView}>
          100%
        </Button>
        <span className="text-[11px] text-[var(--clinical-foreground-muted)]">
          {Math.round(zoom * 100)}% · колёсико / pinch
        </span>
      </div>

      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Фото-макет из наших клинических рендеров. Клик — точка врача и FIGO. Увеличить: «+» / колёсико / щипок.
        Сдвинуть увеличенное: «Рука · сдвиг» (или Shift + перетаскивание).
        {projection === "coronal" ? " Слева на рисунке — правая придатка пациентки." : ""}
      </p>

      <div
        ref={hostRef}
        className={cn(
          "relative mx-auto max-w-3xl touch-none overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-[#111] shadow-xl",
          tool === "place" ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing",
        )}
        style={{ aspectRatio: "4/3" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="absolute inset-0 origin-top-left will-change-transform"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <div className="relative h-full w-full">
            <Image
              src={UTERUS_LIVE_PHOTO_SRC[projection]}
              alt={
                projection === "coronal"
                  ? "Коронарный разрез матки — клинический фото-макет"
                  : "Сагиттальный разрез матки — клинический фото-макет"
              }
              fill
              className="pointer-events-none select-none object-contain"
              sizes="(max-width: 768px) 100vw, 768px"
              unoptimized
              priority
              draggable={false}
            />
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 1000 750"
              preserveAspectRatio="xMidYMid meet"
            >
              {markers.map((m) => {
                const active = m.id === selectedId;
                const mp = projection === "sagittal" ? m.sagittal : m.coronal;
                const cx = mp.x * 1000;
                const cy = mp.y * 750;
                const figo = m.kind === "myoma" ? resolveFigoForMarker(m, projection) : null;
                return (
                  <g key={m.id}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={active ? 16 : 12}
                      fill={figo != null ? getFigoColor(String(figo) as "0") : "#f97316"}
                      stroke="#fff7ed"
                      strokeWidth={active ? 3 : 2}
                      opacity={0.95}
                    />
                    {figo != null ? (
                      <text x={cx} y={cy - 20} textAnchor="middle" fill="#fde68a" fontSize="18" fontWeight="700">
                        {figo}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {selected && selectedHit ? (
        <div className="sonogyn-glass-card space-y-2 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">Выбранный очаг</p>
            {selectedFigo != null ? (
              <Badge style={{ backgroundColor: getFigoColor(String(selectedFigo) as "0") }}>
                FIGO {selectedFigo}
              </Badge>
            ) : null}
            <Badge variant="outline">{LAYER_LABEL_RU[selectedHit.layer]}</Badge>
          </div>
          <p className="text-sm leading-relaxed">{formatUterusLesionMarkerRu(selected, projection)}</p>
          {selectedFigo != null ? (
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{FIGO_SUBTYPE_RU[selectedFigo]}</p>
          ) : null}
        </div>
      ) : null}

      <div className="sonogyn-glass-card space-y-3 rounded-2xl p-4">
        <div className="flex flex-wrap justify-between gap-2">
          <p className="text-sm font-bold">Текст для протокола</p>
          <Button size="sm" variant="secondary" onClick={() => void navigator.clipboard.writeText(protocolText)}>
            Копировать
          </Button>
        </div>
        <pre className="whitespace-pre-wrap rounded-xl bg-slate-900/5 p-4 text-sm leading-relaxed dark:bg-white/5">
          {protocolText}
        </pre>
        <DocumentExportToolbar spec={exportSpec} compact />
      </div>
    </div>
  );
}
