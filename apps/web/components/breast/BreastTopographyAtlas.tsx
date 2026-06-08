"use client";

import {
  buildBreastProtocolBlock,
  centroidOfStroke,
  formatBreastLocationRu,
  strokeToSvgPath,
  type BreastNormPoint,
  type BreastSide,
  type BreastTopographyMarker,
} from "@repo/clinical-3d";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { cn } from "@/lib/utils/cn";

type Tool = "place" | "draw" | "pan";

const VIEW = 300;

function normFromEvent(clientX: number, clientY: number, rect: DOMRect): BreastNormPoint {
  return {
    x: Math.max(0.06, Math.min(0.94, (clientX - rect.left) / rect.width)),
    y: Math.max(0.06, Math.min(0.94, (clientY - rect.top) / rect.height)),
  };
}

function BreastDiagram({
  side,
  markers,
  draftStroke,
  tool,
  selectedId,
  hostRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  side: BreastSide;
  markers: BreastTopographyMarker[];
  draftStroke: BreastNormPoint[];
  tool: Tool;
  selectedId: string | null;
  hostRef: RefObject<HTMLDivElement | null>;
  onPointerDown: (e: React.PointerEvent, side: BreastSide) => void;
  onPointerMove: (e: React.PointerEvent, side: BreastSide) => void;
  onPointerUp: (e: React.PointerEvent, side: BreastSide) => void;
}) {
  const lateralLeft = side === "right";
  const sideMarkers = markers.filter((m) => m.side === side);

  return (
    <div className="space-y-2">
      <p className="text-center text-xs font-bold uppercase tracking-wide text-rose-900 dark:text-rose-200">
        {side === "right" ? "Правая МЖ" : "Левая МЖ"}
      </p>
      <div
        ref={hostRef}
        className={cn(
          "relative mx-auto touch-none select-none rounded-2xl border-2 border-rose-200 bg-rose-50/90 shadow-inner dark:border-rose-900 dark:bg-rose-950/40",
          tool === "place" || tool === "draw" ? "cursor-crosshair" : "cursor-grab",
        )}
        style={{ width: VIEW, height: VIEW, touchAction: "none" }}
        onPointerDown={(e) => onPointerDown(e, side)}
        onPointerMove={(e) => onPointerMove(e, side)}
        onPointerUp={(e) => onPointerUp(e, side)}
        onPointerCancel={(e) => onPointerUp(e, side)}
        onPointerLeave={(e) => {
          if (e.buttons !== 0) onPointerUp(e, side);
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          aria-hidden
        >
          <ellipse cx="150" cy="150" rx="118" ry="128" fill="#FFF1F2" stroke="#BE123C" strokeWidth="3" />
          <path
            d="M72 70 C115 32 188 30 230 72"
            stroke="#FDA4AF"
            strokeWidth="12"
            strokeLinecap="round"
            opacity={0.45}
            fill="none"
          />
          <line x1="150" y1="28" x2="150" y2="272" stroke="#F43F5E" strokeWidth="2" strokeDasharray="6 7" opacity={0.7} />
          <line x1="35" y1="150" x2="265" y2="150" stroke="#F43F5E" strokeWidth="2" strokeDasharray="6 7" opacity={0.7} />
          <circle cx="150" cy="150" r="22" fill="#F97316" stroke="#9A3412" strokeWidth="3" />
          <circle cx="150" cy="150" r="7" fill="#7C2D12" />
          <text x="150" y="20" textAnchor="middle" fontSize="12" fontWeight="900" fill="#9F1239">
            12
          </text>
          <text x="282" y="154" textAnchor="middle" fontSize="12" fontWeight="900" fill="#9F1239">
            3
          </text>
          <text x="150" y="292" textAnchor="middle" fontSize="12" fontWeight="900" fill="#9F1239">
            6
          </text>
          <text x="18" y="154" textAnchor="middle" fontSize="12" fontWeight="900" fill="#9F1239">
            9
          </text>
          <text x={lateralLeft ? 64 : 212} y="68" textAnchor="middle" fontSize="13" fontWeight="900" fill="#1D4ED8">
            ВНК
          </text>
          <text x={lateralLeft ? 212 : 64} y="68" textAnchor="middle" fontSize="13" fontWeight="900" fill="#6D28D9">
            ВВК
          </text>
          <text x={lateralLeft ? 64 : 212} y="235" textAnchor="middle" fontSize="13" fontWeight="900" fill="#1D4ED8">
            ННК
          </text>
          <text x={lateralLeft ? 212 : 64} y="235" textAnchor="middle" fontSize="13" fontWeight="900" fill="#6D28D9">
            НВК
          </text>

          {sideMarkers.map((m) => {
            const cx = m.point.x * VIEW;
            const cy = m.point.y * VIEW;
            const active = m.id === selectedId;
            return (
              <g key={m.id}>
                {m.stroke && m.stroke.length > 1 ? (
                  <path
                    d={strokeToSvgPath(m.stroke, VIEW, VIEW)}
                    fill="none"
                    stroke={active ? "#7C2D12" : "#EA580C"}
                    strokeWidth={active ? 3.5 : 2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.9}
                  />
                ) : null}
                <circle
                  cx={cx}
                  cy={cy}
                  r={active ? 14 : 11}
                  fill="#F97316"
                  stroke="#7C2D12"
                  strokeWidth={active ? 3 : 2}
                  opacity={0.95}
                />
                <path
                  d={`M${cx - 12} ${cy} H${cx + 12} M${cx} ${cy - 12} V${cy + 12}`}
                  stroke="#7C2D12"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {draftStroke.length > 1 ? (
            <path
              d={strokeToSvgPath(draftStroke, VIEW, VIEW)}
              fill="none"
              stroke="#EA580C"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
          ) : null}
        </svg>
      </div>
    </div>
  );
}

export function BreastTopographyAtlas({
  onProtocolTextChange,
  compact,
}: {
  onProtocolTextChange?: (text: string) => void;
  /** Скрыть дублирующий экспорт, если встроен в калькулятор BI-RADS */
  compact?: boolean;
}) {
  const [tool, setTool] = useState<Tool>("place");
  const [markers, setMarkers] = useState<BreastTopographyMarker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStroke, setDraftStroke] = useState<BreastNormPoint[]>([]);
  const [draftSide, setDraftSide] = useState<BreastSide>("right");
  const drawing = useRef(false);
  const activeSide = useRef<BreastSide>("right");
  const hostRightRef = useRef<HTMLDivElement>(null);
  const hostLeftRef = useRef<HTMLDivElement>(null);

  const hostForSide = useCallback(
    (side: BreastSide): RefObject<HTMLDivElement | null> =>
      side === "right" ? hostRightRef : hostLeftRef,
    [],
  );

  const selected = markers.find((m) => m.id === selectedId) ?? markers[markers.length - 1];

  const protocolText = useMemo(() => buildBreastProtocolBlock(markers), [markers]);
  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: "breast-topography-protocol",
        title: "Локализация · молочные железы",
        text: protocolText,
      }),
    [protocolText],
  );

  useEffect(() => {
    onProtocolTextChange?.(protocolText);
  }, [protocolText, onProtocolTextChange]);

  const addMarker = useCallback((side: BreastSide, point: BreastNormPoint, stroke?: BreastNormPoint[]) => {
    const id = `br-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setMarkers((prev) => [...prev, { id, side, point, stroke }]);
    setSelectedId(id);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, side: BreastSide) => {
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

      if (tool === "place") {
        const hit = markers.find((m) => {
          if (m.side !== side) return false;
          const dx = (m.point.x - pt.x) * VIEW;
          const dy = (m.point.y - pt.y) * VIEW;
          return Math.hypot(dx, dy) < 22;
        });
        if (hit) {
          setSelectedId(hit.id);
          return;
        }
        addMarker(side, pt);
      }
    },
    [tool, markers, addMarker, hostForSide],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent, side: BreastSide) => {
      if (!drawing.current || tool !== "draw") return;
      const host = hostForSide(side).current ?? hostForSide(activeSide.current).current;
      if (!host) return;
      e.preventDefault();
      const rect = host.getBoundingClientRect();
      const pt = normFromEvent(e.clientX, e.clientY, rect);
      setDraftSide(side);
      setDraftStroke((prev) => {
        const last = prev[prev.length - 1];
        if (last && Math.hypot(last.x - pt.x, last.y - pt.y) < 0.004) return prev;
        return [...prev, pt];
      });
    },
    [tool, hostForSide],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent, side: BreastSide) => {
      const host = hostForSide(side).current;
      if (host?.hasPointerCapture(e.pointerId)) {
        host.releasePointerCapture(e.pointerId);
      }
      if (!drawing.current || tool !== "draw") return;
      drawing.current = false;
      const stroke = draftStroke;
      const strokeSide = draftSide;
      setDraftStroke([]);
      if (stroke.length >= 3) {
        const center = centroidOfStroke(stroke);
        addMarker(strokeSide, center, stroke);
      } else if (stroke.length >= 1) {
        addMarker(strokeSide, stroke[0]);
      }
    },
    [tool, draftStroke, draftSide, addMarker, hostForSide],
  );

  function removeSelected() {
    if (!selectedId) return;
    setMarkers((prev) => prev.filter((m) => m.id !== selectedId));
    setSelectedId(null);
  }

  function copyProtocol() {
    void navigator.clipboard.writeText(protocolText);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant={tool === "place" ? "default" : "outline"} size="sm" onClick={() => setTool("place")}>
          Курсор · очаг
        </Button>
        <Button variant={tool === "draw" ? "default" : "outline"} size="sm" onClick={() => setTool("draw")}>
          Рисовать контур
        </Button>
        <Button variant="outline" size="sm" onClick={removeSelected} disabled={!selectedId}>
          Удалить метку
        </Button>
        <Button variant="outline" size="sm" onClick={() => setMarkers([])}>
          Очистить
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Схема как в протоколе УЗИ: 12 часов — краниально, 3 — латерально (у правой груди), 9 — медиально.
        Клик — точка; обводка — контур + центр для расчёта. Целесообразно сопроводить эхограмму схематическим рисунком.
      </p>

      <div className="flex flex-col items-center justify-center gap-8 lg:flex-row lg:items-start">
        <BreastDiagram
          side="right"
          markers={markers}
          draftStroke={draftSide === "right" ? draftStroke : []}
          tool={tool}
          selectedId={selectedId}
          hostRef={hostRightRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        <BreastDiagram
          side="left"
          markers={markers}
          draftStroke={draftSide === "left" ? draftStroke : []}
          tool={tool}
          selectedId={selectedId}
          hostRef={hostLeftRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>

      {selected ? (
        <div className="sonogyn-glass-card rounded-2xl p-4">
          <p className="text-sm font-bold text-rose-950 dark:text-rose-100">Выбранная метка</p>
          <p className="mt-2 text-base font-semibold leading-relaxed text-[var(--clinical-foreground)]">
            {formatBreastLocationRu(selected.point, selected.side)}
          </p>
        </div>
      ) : null}

      {!compact ? (
      <div className="sonogyn-glass-card space-y-3 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold">Текст для протокола (ВВК)</p>
          <Button size="sm" variant="secondary" onClick={() => void copyProtocol()}>
            Копировать
          </Button>
        </div>
        <pre className="whitespace-pre-wrap rounded-xl bg-slate-900/5 p-4 text-sm leading-relaxed dark:bg-white/5">
          {protocolText}
        </pre>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Не является диагнозом. Окончательная формулировка — за лечащим врачом.
        </p>
        <DocumentExportToolbar spec={exportSpec} compact />
      </div>
      ) : null}
    </div>
  );
}
